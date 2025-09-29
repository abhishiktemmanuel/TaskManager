import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { Todo } from './entities/todo.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/interfaces/user-role.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Status } from './interfaces/status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Todo)
    private todosRepository: Repository<Todo>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getDashboardData(user: User) {
    if (user.role === UserRole.ADMIN) {
      const teamUsers = await this.usersRepository.find({
        where: { invitedByAdminId: user.id },
      });
      const userIds = teamUsers.map((u) => u.id);
      const [totalTasks, pendingTasks, inProgressTasks, completedTasks] =
        await Promise.all([
          this.tasksRepository.count({ where: { assignedTo: In(userIds) } }),
          this.tasksRepository.count({
            where: { assignedTo: In(userIds), status: Status.PENDING },
          }),
          this.tasksRepository.count({
            where: { assignedTo: In(userIds), status: Status.IN_PROGRESS },
          }),
          this.tasksRepository.count({
            where: { assignedTo: In(userIds), status: Status.COMPLETED },
          }),
        ]);

      return {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        teamSize: teamUsers.length,
      };
    } else {
      const [totalTasks, pendingTasks, inProgressTasks, completedTasks] =
        await Promise.all([
          this.tasksRepository.count({
            where: { assignedTo: { id: user.id } },
          }),
          this.tasksRepository.count({
            where: { assignedTo: { id: user.id }, status: Status.PENDING },
          }),
          this.tasksRepository.count({
            where: { assignedTo: { id: user.id }, status: Status.IN_PROGRESS },
          }),
          this.tasksRepository.count({
            where: { assignedTo: { id: user.id }, status: Status.COMPLETED },
          }),
        ]);

      return { totalTasks, pendingTasks, inProgressTasks, completedTasks };
    }
  }

  async getTasks(user: User) {
    if (user.role === UserRole.ADMIN) {
      const teamUsers = await this.usersRepository.find({
        where: { invitedByAdminId: user.id },
      });
      const userIds = teamUsers.map((u) => u.id);
      return this.tasksRepository.find({
        where: { assignedTo: In(userIds) },
        relations: ['assignedTo', 'createdBy', 'todos'],
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.tasksRepository.find({
        where: { assignedTo: { id: user.id } },
        relations: ['assignedTo', 'createdBy', 'todos'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async getTaskById(id: number, user: User) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'todos'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permissions
    if (user.role !== UserRole.ADMIN && task.assignedTo.id !== user.id) {
      throw new ForbiddenException('You can only view your own tasks');
    }

    if (user.role === UserRole.ADMIN) {
      const teamUsers = await this.usersRepository.find({
        where: { invitedByAdminId: user.id },
      });
      const userIds = teamUsers.map((u) => u.id);

      if (!userIds.includes(task.assignedTo.id)) {
        throw new ForbiddenException('You can only view tasks from your team');
      }
    }

    return task;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User) {
    const { assignedToId, todos, ...taskData } = createTaskDto;

    // Non-admin users can only create tasks for themselves
    let assignedUser = user;
    if (assignedToId && user.role === UserRole.ADMIN) {
      const foundUser = await this.usersRepository.findOne({
        where: { id: assignedToId },
      });
      if (!foundUser) {
        throw new NotFoundException('Assigned user not found');
      }
      assignedUser = foundUser;

      // Check if the assigned user is in the admin's team
      const teamUsers = await this.usersRepository.find({
        where: { invitedByAdminId: user.id },
      });
      const userIds = teamUsers.map((u) => u.id);

      if (!userIds.includes(assignedToId)) {
        throw new ForbiddenException(
          'You can only assign tasks to your team members',
        );
      }
    }

    const task = this.tasksRepository.create({
      ...taskData,
      assignedTo: assignedUser,
      createdBy: user,
    });

    if (todos && todos.length > 0) {
      task.todos = todos.map((todoText) =>
        this.todosRepository.create({ text: todoText, completed: false }),
      );
    }

    return this.tasksRepository.save(task);
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto, user: User) {
    try {
      const task = await this.getTaskById(id, user);

      // Apply the updates
      Object.assign(task, updateTaskDto);

      // Only recalculate progress if NOT explicitly provided in the update
      if (updateTaskDto.progress === undefined && task.todos?.length) {
        const doneCount = task.todos.filter((todo) => todo.completed).length;
        task.progress = Math.round((doneCount / task.todos.length) * 100);
      }

      return await this.tasksRepository.save(task);
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  async deleteTask(id: number, user: User) {
    const task = await this.getTaskById(id, user);

    if (user.role !== UserRole.ADMIN && task.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only delete tasks you created');
    }

    await this.tasksRepository.remove(task);
  }

  async updateTaskStatus(id: number, status: Status, user: User) {
    const task = await this.getTaskById(id, user);

    task.status = status;

    // Auto-complete todos when task is completed
    if (status === Status.COMPLETED && task.todos) {
      task.todos.forEach((todo) => (todo.completed = true));
      task.progress = 100;
    }

    // Reset progress when moving back from completed
    if (status !== Status.COMPLETED && task.progress === 100) {
      task.progress = 0;
    }

    return this.tasksRepository.save(task);
  }

  async updateTaskChecklist(
    id: number,
    todoChecklist: { id?: number; text: string; completed: boolean }[],
    user: User,
  ) {
    const task = await this.getTaskById(id, user);

    // Remove existing todos
    await this.todosRepository.delete({ task: { id: task.id } });

    // Create new todos
    task.todos = todoChecklist.map((todo) =>
      this.todosRepository.create({
        text: todo.text,
        completed: todo.completed,
      }),
    );

    // Update progress based on todos
    const completedTodos = task.todos.filter((todo) => todo.completed).length;
    task.progress =
      task.todos.length > 0
        ? Math.round((completedTodos / task.todos.length) * 100)
        : 0;

    // Update status based on progress - THIS WAS MISSING
    if (task.progress === 100) {
      task.status = Status.COMPLETED;
    } else if (task.progress > 0) {
      task.status = Status.IN_PROGRESS;
    } else {
      task.status = Status.PENDING;
    }

    return this.tasksRepository.save(task);
  }
}
