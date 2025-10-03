import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Team } from './entities/team.entity'; // Add this import
import { UserRole } from './interfaces/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Team) // Add this
    private teamsRepository: Repository<Team>, // Add this
  ) {}

  async findAll(user: User): Promise<User[]> {
    if (user.role === UserRole.ADMIN) {
      // Get all teams where user is owner or member
      const teams = await this.teamsRepository.find({
        where: [
          { owner: { id: user.id } }, // Teams owned by user
          { members: { id: user.id } }, // Teams where user is a member
        ],
        relations: ['members'],
      });

      // Get all user IDs from these teams
      const teamUserIds = teams.flatMap((team) =>
        team.members.map((member) => member.id),
      );
      const uniqueUserIds = [...new Set(teamUserIds)];

      return this.usersRepository.find({
        where: { id: In(uniqueUserIds) },
        relations: ['assignedTasks', 'createdTasks', 'teams'],
      });
    } else {
      // Regular users can only see themselves
      return this.usersRepository.find({
        where: { id: user.id },
        relations: ['assignedTasks', 'createdTasks', 'teams'],
      });
    }
  }

  async getTeamMembers(adminUser: User): Promise<User[]> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view team members');
    }

    // Get teams owned by the admin
    const teams = await this.teamsRepository.find({
      where: { owner: { id: adminUser.id } },
      relations: ['members', 'members.assignedTasks'],
    });

    // Get all members from these teams
    const allMembers = teams.flatMap((team) => team.members);

    // Remove duplicates (in case user is in multiple teams)
    const uniqueMembers = allMembers.filter(
      (member, index, self) =>
        index === self.findIndex((m) => m.id === member.id),
    );

    return uniqueMembers;
  }

  async findOne(id: number, currentUser: User): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['assignedTasks', 'createdTasks', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Admins can see their team members, users can only see themselves
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    if (currentUser.role === UserRole.ADMIN && currentUser.id !== id) {
      // Check if the target user is in any of the admin's teams
      const sharedTeams = await this.teamsRepository.find({
        where: [
          { owner: { id: currentUser.id }, members: { id: user.id } },
          { members: [{ id: currentUser.id }, { id: user.id }] },
        ],
      });

      if (sharedTeams.length === 0) {
        throw new ForbiddenException('You can only view users from your teams');
      }
    }

    return user;
  }

  async create(createUserDto: CreateUserDto, adminUser: User): Promise<User> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create users');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Get admin's default team to add the user
    const adminTeams = await this.teamsRepository.find({
      where: { owner: { id: adminUser.id } },
      relations: ['members'],
    });

    if (adminTeams.length === 0) {
      throw new NotFoundException('Admin does not have any teams');
    }

    const defaultTeam = adminTeams[0];

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.USER,
      teams: [defaultTeam], // Add user to admin's default team
    });

    const savedUser = await this.usersRepository.save(user);

    // Also update the team to include the new user
    if (!defaultTeam.members.some((member) => member.id === savedUser.id)) {
      defaultTeam.members.push(savedUser);
      await this.teamsRepository.save(defaultTeam);
    }

    return savedUser;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const user = await this.findOne(id, currentUser);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const user = await this.findOne(id, currentUser);

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete admin users');
    }

    // Remove user from all teams before deleting
    const userWithTeams = await this.usersRepository.findOne({
      where: { id },
      relations: ['teams'],
    });

    if (userWithTeams && userWithTeams.teams) {
      for (const team of userWithTeams.teams) {
        team.members = team.members.filter((member) => member.id !== id);
        await this.teamsRepository.save(team);
      }
    }

    await this.usersRepository.remove(user);
  }

  // Helper method to get users in the same teams as current user
  async getUsersInSameTeams(currentUser: User): Promise<User[]> {
    const teams = await this.teamsRepository.find({
      where: { members: { id: currentUser.id } },
      relations: ['members'],
    });

    const teamUserIds = teams.flatMap((team) =>
      team.members.map((member) => member.id),
    );
    const uniqueUserIds = [...new Set(teamUserIds)];

    return this.usersRepository.find({
      where: { id: In(uniqueUserIds) },
      relations: ['teams', 'assignedTasks'],
    });
  }
}
