// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/interfaces/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenPayload } from './interfaces/token-payload.interface';
import { Team } from '../users/entities/team.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly TEAM_INVITE_TOKENS = new Map<
    string,
    { adminId: number; teamId: number; expiresAt: Date; purpose?: string } // teamId is required number
  >();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { email, password, name, adminInviteToken } = registerDto;

      // Validate input
      if (!email || !password || !name) {
        throw new BadRequestException('Name, email, and password are required');
      }

      // Check if user already exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email },
        select: ['id', 'email'],
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      let role = UserRole.ADMIN;
      let team: Team | null = null;

      // Handle team member registration with token validation
      if (adminInviteToken) {
        const tokenValidation = await this.validateTeamInviteToken(adminInviteToken);
        if (tokenValidation.valid && tokenValidation.teamId) {
          role = UserRole.USER;
          
          // Verify the team exists before proceeding
          team = await queryRunner.manager.findOne(Team, {
            where: { id: tokenValidation.teamId },
            relations: ['members']
          });

          if (!team) {
            throw new BadRequestException(
              'The team associated with this invitation no longer exists',
            );
          }

          this.logger.log(`Team member will be added to team: ${team.name}`);
        } else {
          throw new BadRequestException('Invalid or expired team invitation token');
        }
      } else {
        this.logger.log(`New admin created without invitation token: ${email}`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user (without teams initially)
      const user = queryRunner.manager.create(User, {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Handle team assignment
      if (adminInviteToken && team) {
        team.members.push(savedUser);
        await queryRunner.manager.save(team);
        this.logger.log(`User ${savedUser.id} added to team ${team.id}`);
      } else if (!adminInviteToken) {
        // Create default team for admin and add user
        const defaultTeam = queryRunner.manager.create(Team, {
          name: `${name}'s Team`,
          description: `Default team for ${name}`,
          owner: savedUser,
          members: [savedUser],
        });
        const savedTeam = await queryRunner.manager.save(defaultTeam);
        team = savedTeam;
        // Update user with team relationship
        savedUser.teams = [savedTeam];
        await queryRunner.manager.save(savedUser);
        this.logger.log(`Default team created for admin ${savedUser.id}`);
      }

      // Generate JWT token
      const payload: TokenPayload = {
        email: savedUser.email,
        sub: savedUser.id,
        role: savedUser.role,
      };

      const access_token = this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'task-manager-api',
        audience: 'task-manager-users',
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = savedUser;

      await queryRunner.commitTransaction();
      this.logger.log(`User registered successfully: ${savedUser.email} with role: ${savedUser.role}`);

      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    try {
      const { email, password } = loginDto;

      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }

      // Find user with password selected (it's normally excluded)
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email: email.toLowerCase().trim() })
        .getOne();

      if (!user) {
        // Use same error message to prevent email enumeration
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload: TokenPayload = {
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      const access_token = this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'task-manager-api',
        audience: 'task-manager-users',
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      this.logger.log(`User logged in successfully: ${user.email}`);

      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      this.logger.error(
        `Login failed for email: ${loginDto.email}`,
        error.stack,
      );
      throw error;
    }
  }

  async validateUser(payload: TokenPayload): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Additional validation checks
      if (user.email !== payload.email) {
        throw new UnauthorizedException('Token validation failed');
      }

      return user;
    } catch (error) {
      this.logger.error(
        `User validation failed for payload: ${JSON.stringify(payload)}`,
      );
      throw error;
    }
  }

  /**
   * Generate a secure team invitation token (for admins to invite team members)
   */
  async generateTeamInviteToken(adminId: number, teamId?: number, purpose?: string): Promise<string> {
    // Verify the admin exists and is actually an admin
    const admin = await this.usersRepository.findOne({
      where: { id: adminId, role: UserRole.ADMIN }
    });

    if (!admin) {
      throw new NotFoundException('Admin not found or user is not an admin');
    }

    let targetTeamId: number;
    
    if (teamId) {
      // Verify the admin has access to the specified team
      const team = await this.teamsRepository.findOne({
        where: { id: teamId },
        relations: ['members', 'owner']
      });

      if (!team || (team.owner.id !== adminId && !team.members.some(m => m.id === adminId))) {
        throw new ForbiddenException('You do not have access to this team');
      }
      targetTeamId = teamId;
    } else {
      // Use admin's first owned team as default
      const ownedTeams = await this.teamsRepository.find({
        where: { owner: { id: adminId } }
      });
      
      if (ownedTeams.length === 0) {
        throw new NotFoundException('Admin does not own any teams');
      }
      targetTeamId = ownedTeams[0].id;
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    this.TEAM_INVITE_TOKENS.set(token, {
      adminId, 
      teamId: targetTeamId,
      expiresAt, 
      purpose 
    });

    this.logger.log(`Team invitation token generated for team ID: ${targetTeamId} by admin ID: ${adminId}`);
    return token;
  }

  /**
   * Get all team invitation tokens for an admin (for management)
   */
  getAdminTokens(
    adminId: number,
  ): Array<{ token: string; expiresAt: Date; purpose?: string }> {
    const tokens: Array<{ token: string; expiresAt: Date; purpose?: string }> =
      [];
    for (const [token, data] of this.TEAM_INVITE_TOKENS.entries()) {
      if (data.adminId === adminId) {
        tokens.push({
          token,
          expiresAt: data.expiresAt,
          purpose: data.purpose,
        });
      }
    }

    return tokens;
  }

  /**
   * Revoke a specific team invitation token
   */
  revokeTeamInviteToken(token: string, adminId: number): boolean {
    const tokenData = this.TEAM_INVITE_TOKENS.get(token);
    if (tokenData && tokenData.adminId === adminId) {
      this.TEAM_INVITE_TOKENS.delete(token);
      this.logger.log(`Team invitation token revoked by admin ID: ${adminId}`);
      return true;
    }
    return false;
  }

  /**
   * Validate team invitation token
   */
  private async validateTeamInviteToken(
    token: string,
  ): Promise<{ valid: boolean; adminId?: number; teamId?: number }> {
    try {
      const tokenData = this.TEAM_INVITE_TOKENS.get(token);

      if (tokenData) {
        // Check if token is expired
        if (new Date() > tokenData.expiresAt) {
          this.TEAM_INVITE_TOKENS.delete(token);
          this.logger.warn(`Expired team invitation token attempted: ${token}`);
          return { valid: false };
        }

        // Verify admin user exists and is still an admin
        const adminUser = await this.usersRepository.findOne({
          where: { id: tokenData.adminId, role: UserRole.ADMIN },
        });

        if (adminUser) {
          // Verify the team still exists
          const team = await this.teamsRepository.findOne({
            where: { id: tokenData.teamId }
          });

          if (team) {
            this.logger.log(
              `Team invitation token validated for team ID: ${tokenData.teamId}`,
            );
            return { 
              valid: true, 
              adminId: tokenData.adminId,
              teamId: tokenData.teamId,
            };
          } else {
            // Team no longer exists - invalidate token
            this.TEAM_INVITE_TOKENS.delete(token);
            this.logger.warn(`Team no longer exists for token: ${token}`);
            return { valid: false };
          }
        }
      }

      this.logger.warn(`Invalid team invitation token attempted: ${token}`);
      return { valid: false };
    } catch (error) {
      this.logger.error(`Team invitation token validation error: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Clean up expired tokens (call this periodically)
   */
  cleanupExpiredTokens(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, data] of this.TEAM_INVITE_TOKENS.entries()) {
      if (now > data.expiresAt) {
        this.TEAM_INVITE_TOKENS.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(
        `Cleaned up ${cleanedCount} expired team invitation tokens`,
      );
    }

    return cleanedCount;
  }

  /**
   * Get statistics about team invitation tokens (for monitoring)
   */
  getTeamTokenStats(): { total: number; expired: number; valid: number } {
    const now = new Date();
    let expired = 0;

    for (const data of this.TEAM_INVITE_TOKENS.values()) {
      if (now > data.expiresAt) {
        expired++;
      }
    }

    const total = this.TEAM_INVITE_TOKENS.size;
    const valid = total - expired;

    return {
      total,
      expired,
      valid,
    };
  }

  /**
   * Get team members for a specific admin
   */
  async getTeamMembers(adminId: number): Promise<User[]> {
    const admin = await this.usersRepository.findOne({
      where: { id: adminId, role: UserRole.ADMIN },
      relations: ['teams'],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const team = await this.teamsRepository.findOne({
      where: { owner: { id: adminId } },
      relations: ['members', 'members.assignedTasks'],
    });

    return team ? team.members : [];
  }

  /**
   * Verify if a user can invite team members (is an admin)
   */
  async canInviteTeamMembers(userId: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });

    return user?.role === UserRole.ADMIN;
  }
}
