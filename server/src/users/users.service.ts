import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserRole } from './interfaces/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(user: User): Promise<User[]> {
    if (user.role === UserRole.ADMIN) {
      return this.usersRepository.find({
        where: { invitedByAdminId: user.id },
        relations: ['assignedTasks', 'createdTasks'],
      });
    }
    throw new ForbiddenException('Only admins can view all users');
  }

  async findOne(id: number, currentUser: User): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['assignedTasks', 'createdTasks'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Admins can see their team members, users can only see themselves
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    if (
      currentUser.role === UserRole.ADMIN &&
      user.invitedByAdminId !== currentUser.id
    ) {
      throw new ForbiddenException('You can only view users from your team');
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

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      invitedByAdminId: adminUser.id,
      role: createUserDto.role || UserRole.USER,
    });

    return this.usersRepository.save(user);
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

    await this.usersRepository.remove(user);
  }

  async getTeamMembers(adminUser: User): Promise<User[]> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view team members');
    }

    return this.usersRepository.find({
      where: { invitedByAdminId: adminUser.id },
      relations: ['assignedTasks'],
    });
  }
}
