// src/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Task } from './entities/task.entity';
import { Todo } from './entities/todo.entity';
import { User } from '../users/entities/user.entity';
import { Team } from '../users/entities/team.entity';
import { UserRole } from '../users/interfaces/user-role.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Status } from './interfaces/status.enum';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Todo)
    private todosRepository: Repository<Todo>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async getDashboardData(user: User) {
    try {
      if (user.role === UserRole.ADMIN) {
        // Get all teams owned by this admin
        const teams = await this.teamsRepository.find({
          where: { owner: { id: user.id } },
          relations: ['members'],
        });

        const teamUserIds = teams.flatMap((team) =>
          team.members.map((member) => member.id),
        );
        const allUserIds = [...new Set(teamUserIds)]; // Remove duplicates

        const [totalTasks, pendingTasks, inProgressTasks, completedTasks] =
          await Promise.all([
            this.tasksRepository.count({
              where: { assignedTo: In(allUserIds) },
            }),
            this.tasksRepository.count({
              where: {
                assignedTo: In(allUserIds),
                status: Status.PENDING,
              },
            }),
            this.tasksRepository.count({
              where: {
                assignedTo: In(allUserIds),
                status: Status.IN_PROGRESS,
              },
            }),
            this.tasksRepository.count({
              where: {
                assignedTo: In(allUserIds),
                status: Status.COMPLETED,
              },
            }),
          ]);

        return {
          totalTasks,
          pendingTasks,
          inProgressTasks,
          completedTasks,
          teamCount: teams.length,
          totalTeamMembers: allUserIds.length,
        };
      } else {
        // Regular users see tasks assigned to them
        const [totalTasks, pendingTasks, inProgressTasks, completedTasks] =
          await Promise.all([
            this.tasksRepository.count({
              where: { assignedTo: { id: user.id } },
            }),
            this.tasksRepository.count({
              where: {
                assignedTo: { id: user.id },
                status: Status.PENDING,
              },
            }),
            this.tasksRepository.count({
              where: {
                assignedTo: { id: user.id },
                status: Status.IN_PROGRESS,
              },
            }),
            this.tasksRepository.count({
              where: {
                assignedTo: { id: user.id },
                status: Status.COMPLETED,
              },
            }),
          ]);

        return {
          totalTasks,
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      }
    } catch (error) {
      this.logger.error(
        `Error getting dashboard data for user ${user.id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getTasks(user: User) {
    try {
      if (user.role === UserRole.ADMIN) {
        // Admin sees tasks from all their teams AND personal tasks they created
        const teams = await this.teamsRepository.find({
          where: { owner: { id: user.id } },
          relations: ['members'],
        });

        const teamUserIds = teams.flatMap((team) =>
          team.members.map((member) => member.id),
        );
        const allUserIds = [...new Set(teamUserIds)];

        return this.tasksRepository.find({
          where: [
            { assignedTo: In(allUserIds) }, // Team tasks
            { createdBy: { id: user.id }, team: IsNull() }, // Personal tasks created by admin
          ],
          relations: ['assignedTo', 'createdBy', 'todos', 'team'],
          order: { createdAt: 'DESC' },
        });
      } else {
        // Users see tasks assigned to them (both team and personal)
        return this.tasksRepository.find({
          where: { assignedTo: { id: user.id } },
          relations: ['assignedTo', 'createdBy', 'todos', 'team'],
          order: { createdAt: 'DESC' },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error getting tasks for user ${user.id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getTaskById(id: number, user: User) {
    try {
      const task = await this.tasksRepository.findOne({
        where: { id },
        relations: ['assignedTo', 'createdBy', 'todos', 'team'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Check if user has access to this task
      const hasAccess = await this.userHasAccessToTask(user, task);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this task');
      }

      return task;
    } catch (error) {
      this.logger.error(
        `Error getting task ${id} for user ${user.id}: ${error.message}`,
      );
      throw error;
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User) {
    try {
      const { assignedToId, teamId, todos, ...taskData } = createTaskDto;

      let team: Team | null = null;
      let assignedUser = user;

      // Handle assignment logic first
      if (assignedToId) {
        const foundUser = await this.usersRepository.findOne({
          where: { id: assignedToId },
          relations: ['teams'],
        });

        if (!foundUser) {
          throw new NotFoundException('Assigned user not found');
        }

        // If assigning to someone else, we need to determine the team
        if (foundUser.id !== user.id) {
          // If teamId is provided, use that team
          if (teamId) {
            team = await this.teamsRepository.findOne({
              where: { id: teamId },
              relations: ['members', 'owner'],
            });

            if (!team) {
              throw new NotFoundException('Team not found');
            }

            // Check if user has access to this team
            const hasTeamAccess = await this.userHasAccessToTeam(user, team);
            if (!hasTeamAccess) {
              throw new ForbiddenException('You do not have access to this team');
            }

            // Check if assigned user is in the same team
            const isUserInTeam = foundUser.teams.some((t) => t.id === team!.id);
            if (!isUserInTeam) {
              throw new ForbiddenException(
                'Assigned user is not in the selected team',
              );
            }
          } else {
            // If no teamId provided, try to find a shared team between admin and assigned user
            const sharedTeams = await this.teamsRepository
              .createQueryBuilder('team')
              .innerJoin('team.members', 'member')
              .where('member.id = :userId', { userId: user.id })
              .andWhere('team.id IN (SELECT "team_id" FROM user_teams WHERE user_id = :assignedUserId)', { assignedUserId: foundUser.id })
              .getMany();

            if (sharedTeams.length === 0) {
              throw new BadRequestException(
                'No shared team found with the assigned user. Please specify a team ID.',
              );
            }

            // Use the first shared team (you might want to let the user choose if multiple)
            team = sharedTeams[0];
            this.logger.log(`Auto-selected shared team: ${team.name} for task assignment`);
          }
        }

        assignedUser = foundUser;
      }

      // If teamId is provided but we haven't fetched the team yet (for self-assignment with team)
      if (teamId && !team) {
        team = await this.teamsRepository.findOne({
          where: { id: teamId },
          relations: ['members', 'owner'],
        });

        if (!team) {
          throw new NotFoundException('Team not found');
        }

        // Check if user has access to this team
        const hasTeamAccess = await this.userHasAccessToTeam(user, team);
        if (!hasTeamAccess) {
          throw new ForbiddenException('You do not have access to this team');
        }
      }

      // For personal tasks (self-assigned without team), team remains null
      // For team tasks assigned to others, we now have a team

      // Create the task
      const task = this.tasksRepository.create({
        ...taskData,
        assignedTo: assignedUser,
        createdBy: user,
        team: team, // This can be null for personal tasks
      });

      if (todos && todos.length > 0) {
        task.todos = todos.map((todoText) =>
          this.todosRepository.create({ text: todoText, completed: false }),
        );
      }

      const savedTask = await this.tasksRepository.save(task);
      this.logger.log(`Task created successfully: ${savedTask.id}`);

      return savedTask;
    } catch (error) {
      this.logger.error(
        `Error creating task for user ${user.id}: ${error.message}`,
      );
      throw error;
    }
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto, user: User) {
    try {
      const task = await this.getTaskById(id, user);

      // Handle team assignment if teamId is provided
      if (updateTaskDto.teamId) {
        const team = await this.teamsRepository.findOne({
          where: { id: updateTaskDto.teamId },
          relations: ['members', 'owner'],
        });

        if (!team) {
          throw new NotFoundException('Team not found');
        }

        // Check if user has access to the new team
        const hasTeamAccess = await this.userHasAccessToTeam(user, team);
        if (!hasTeamAccess) {
          throw new ForbiddenException('You do not have access to this team');
        }

        // Check if assigned user (if changing) is in the new team
        if (updateTaskDto.assignedToId) {
          const assignedUser = await this.usersRepository.findOne({
            where: { id: updateTaskDto.assignedToId },
            relations: ['teams'],
          });

          if (!assignedUser) {
            throw new NotFoundException('Assigned user not found');
          }

          // Add null check for team
          const isUserInTeam = assignedUser.teams.some((t) => t.id === team.id);
          if (!isUserInTeam) {
            throw new ForbiddenException(
              'Assigned user is not in the selected team',
            );
          }
        }

        task.team = team;
      }

      // Handle assigned user update
      if (
        updateTaskDto.assignedToId &&
        updateTaskDto.assignedToId !== task.assignedTo.id
      ) {
        const assignedUser = await this.usersRepository.findOne({
          where: { id: updateTaskDto.assignedToId },
          relations: ['teams'],
        });

        if (!assignedUser) {
          throw new NotFoundException('Assigned user not found');
        }

        // Check if assigned user is in the task's team - with null check
        if (task.team) {
          const isUserInTeam = assignedUser.teams.some(
            (t) => t.id === task.team!.id, // Use non-null assertion since we checked task.team exists
          );
          if (!isUserInTeam) {
            throw new ForbiddenException(
              'Assigned user is not in the task team',
            );
          }
        } else {
          // If task has no team, only allow assigning to self
          if (assignedUser.id !== user.id) {
            throw new ForbiddenException(
              'You can only assign personal tasks to yourself',
            );
          }
        }

        task.assignedTo = assignedUser;
      }

      // Apply other updates
      Object.assign(task, updateTaskDto);

      // Only recalculate progress if NOT explicitly provided in the update
      if (updateTaskDto.progress === undefined && task.todos?.length) {
        const doneCount = task.todos.filter((todo) => todo.completed).length;
        task.progress = Math.round((doneCount / task.todos.length) * 100);
      }

      const updatedTask = await this.tasksRepository.save(task);
      this.logger.log(`Task updated successfully: ${updatedTask.id}`);

      return updatedTask;
    } catch (error) {
      this.logger.error(`Error updating task ${id}: ${error.message}`);
      throw error;
    }
  }

  async deleteTask(id: number, user: User) {
    try {
      const task = await this.getTaskById(id, user);

      // Only admins or task creators can delete tasks
      if (user.role !== UserRole.ADMIN && task.createdBy.id !== user.id) {
        throw new ForbiddenException('You can only delete tasks you created');
      }

      await this.tasksRepository.remove(task);
      this.logger.log(`Task deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting task ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateTaskStatus(id: number, status: Status, user: User) {
    try {
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
        if (task.todos) {
          task.todos.forEach((todo) => (todo.completed = false));
        }
      }

      const updatedTask = await this.tasksRepository.save(task);
      this.logger.log(`Task status updated to ${status} for task: ${id}`);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Error updating task status for task ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async updateTaskChecklist(
    id: number,
    todoChecklist: { id?: number; text: string; completed: boolean }[],
    user: User,
  ) {
    try {
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

      // Update status based on progress
      if (task.progress === 100) {
        task.status = Status.COMPLETED;
      } else if (task.progress > 0) {
        task.status = Status.IN_PROGRESS;
      } else {
        task.status = Status.PENDING;
      }

      const updatedTask = await this.tasksRepository.save(task);
      this.logger.log(`Task checklist updated for task: ${id}`);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Error updating task checklist for task ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  // Helper method to check if user has access to a task
  private async userHasAccessToTask(user: User, task: Task): Promise<boolean> {
    try {
      // Personal task - only the assigned user and creator have access
      if (!task.team) {
        return task.assignedTo.id === user.id || task.createdBy.id === user.id;
      }

      if (user.role === UserRole.ADMIN) {
        // Admin can access tasks from their teams
        const adminTeams = await this.teamsRepository.find({
          where: { owner: { id: user.id } },
        });

        const adminTeamIds = adminTeams.map((team) => team.id);
        return adminTeamIds.includes(task.team.id);
      } else {
        // Regular users can access tasks assigned to them
        return task.assignedTo.id === user.id;
      }
    } catch (error) {
      this.logger.error(`Error checking task access: ${error.message}`);
      return false;
    }
  }

  // Helper method to check if user has access to a team
  private async userHasAccessToTeam(user: User, team: Team): Promise<boolean> {
    try {
      if (user.role === UserRole.ADMIN) {
        return team.owner.id === user.id;
      } else {
        // Load team with members to check membership
        const teamWithMembers = await this.teamsRepository.findOne({
          where: { id: team.id },
          relations: ['members'],
        });

        if (!teamWithMembers) {
          return false;
        }

        return teamWithMembers.members.some((member) => member.id === user.id);
      }
    } catch (error) {
      this.logger.error(`Error checking team access: ${error.message}`);
      return false;
    }
  }

  // Get tasks for a specific team
  async getTeamTasks(teamId: number, user: User) {
    try {
      const team = await this.teamsRepository.findOne({
        where: { id: teamId },
        relations: ['owner', 'members'],
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      // Check if user has access to this team
      const hasAccess = await this.userHasAccessToTeam(user, team);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this team');
      }

      return this.tasksRepository.find({
        where: { team: { id: teamId } },
        relations: ['assignedTo', 'createdBy', 'todos'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Error getting team tasks for team ${teamId}: ${error.message}`,
      );
      throw error;
    }
  }
}
