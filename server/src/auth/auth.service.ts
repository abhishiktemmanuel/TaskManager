import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/interfaces/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenPayload } from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ADMIN_INVITE_TOKENS = new Map<
    string,
    { adminId: number; expiresAt: Date }
  >();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    // Initialize with a default admin token for first-time setup
    this.generateAdminInviteToken(1, 'initial-admin'); // You can remove this after initial setup
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    try {
      const { email, password, name, adminInviteToken } = registerDto;

      // Validate input
      if (!email || !password || !name) {
        throw new BadRequestException('Name, email, and password are required');
      }

      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email },
        select: ['id', 'email'],
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      let role = UserRole.USER;
      let invitedByAdminId: number | undefined = undefined;

      // Handle admin registration with token validation
      if (adminInviteToken) {
        const tokenValidation = await this.validateAdminToken(adminInviteToken);
        if (tokenValidation.valid) {
          role = UserRole.ADMIN;
          invitedByAdminId = tokenValidation.adminId;
          this.logger.log(
            `Admin user created by admin ID: ${tokenValidation.adminId}`,
          );
        } else {
          throw new BadRequestException(
            'Invalid or expired admin invitation token',
          );
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for production

      // Create and save user
      const user = this.usersRepository.create({
        email: email.toLowerCase().trim(), // Normalize email
        password: hashedPassword,
        name: name.trim(),
        role,
        invitedByAdminId,
      });

      await this.usersRepository.save(user);

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

      this.logger.log(
        `User registered successfully: ${user.email} with role: ${user.role}`,
      );

      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error; // Re-throw the error to be handled by NestJS
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

      // Check if user is active (you can add an 'active' field to your user entity)
      // if (!user.isActive) {
      //   throw new UnauthorizedException('Account is deactivated');
      // }

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
   * Generate a secure admin invitation token
   */
  generateAdminInviteToken(adminId: number, purpose?: string): string {
    const token = uuidv4() as string;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    this.ADMIN_INVITE_TOKENS.set(token, { adminId, expiresAt });

    this.logger.log(
      `Admin invite token generated for admin ID: ${adminId}, purpose: ${purpose || 'general'}`,
    );
    return token;
  }

  /**
   * Validate admin invitation token
   */
  private async validateAdminToken(
    token: string,
  ): Promise<{ valid: boolean; adminId?: number }> {
    try {
      // Check in-memory tokens first
      const tokenData = this.ADMIN_INVITE_TOKENS.get(token);

      if (tokenData) {
        // Check if token is expired
        if (new Date() > tokenData.expiresAt) {
          this.ADMIN_INVITE_TOKENS.delete(token);
          this.logger.warn(`Expired admin token attempted: ${token}`);
          return { valid: false };
        }

        // Verify admin user exists and is still an admin
        const adminUser = await this.usersRepository.findOne({
          where: { id: tokenData.adminId, role: UserRole.ADMIN },
        });

        if (adminUser) {
          // Remove used token (one-time use)
          this.ADMIN_INVITE_TOKENS.delete(token);
          this.logger.log(
            `Admin token validated successfully for admin ID: ${tokenData.adminId}`,
          );
          return { valid: true, adminId: tokenData.adminId };
        }
      }

      this.logger.warn(`Invalid admin token attempted: ${token}`);
      return { valid: false };
    } catch (error) {
      this.logger.error(`Admin token validation error: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Clean up expired tokens (call this periodically)
   */
  cleanupExpiredTokens(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, data] of this.ADMIN_INVITE_TOKENS.entries()) {
      if (now > data.expiresAt) {
        this.ADMIN_INVITE_TOKENS.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired admin tokens`);
    }

    return cleanedCount;
  }

  /**
   * Get statistics about admin tokens (for monitoring)
   */
  getAdminTokenStats(): { total: number; expired: number } {
    const now = new Date();
    let expired = 0;

    for (const data of this.ADMIN_INVITE_TOKENS.values()) {
      if (now > data.expiresAt) {
        expired++;
      }
    }

    return {
      total: this.ADMIN_INVITE_TOKENS.size,
      expired,
    };
  }
}
