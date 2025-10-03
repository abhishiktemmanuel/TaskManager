import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Team } from '../users/entities/team.entity';
import { UserRole } from '../users/interfaces/user-role.enum';
import { Status } from '../tasks/interfaces/status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Team) // Add Team repository
    private teamsRepository: Repository<Team>,
  ) {}

  async exportTasksReport(user: User): Promise<ExcelJS.Workbook> {
    let tasks: Task[];

    if (user.role === UserRole.ADMIN) {
      // Get all teams where user is owner or member
      const teams = await this.teamsRepository.find({
        where: [{ owner: { id: user.id } }, { members: { id: user.id } }],
        relations: ['members'],
      });

      // Get all user IDs from these teams
      const teamUserIds = teams.flatMap((team) =>
        team.members.map((member) => member.id),
      );
      const uniqueUserIds = [...new Set(teamUserIds)];

      tasks = await this.tasksRepository.find({
        where: { assignedTo: In(uniqueUserIds) },
        relations: ['assignedTo', 'todos', 'team'],
      });
    } else {
      tasks = await this.tasksRepository.find({
        where: { assignedTo: { id: user.id } },
        relations: ['assignedTo', 'todos', 'team'],
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks Report');

    worksheet.columns = [
      { header: 'Task ID', key: 'id', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Assigned To', key: 'assignedTo', width: 25 },
      { header: 'Team', key: 'team', width: 25 },
      { header: 'Progress', key: 'progress', width: 10 },
      { header: 'Todos Completed', key: 'todosCompleted', width: 15 },
      { header: 'Total Todos', key: 'totalTodos', width: 15 },
    ];

    tasks.forEach((task) => {
      const totalTodos = task.todos ? task.todos.length : 0;
      const completedTodos = task.todos
        ? task.todos.filter((todo) => todo.completed).length
        : 0;

      worksheet.addRow({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo
          ? `${task.assignedTo.name} (${task.assignedTo.email})`
          : 'Unassigned',
        team: task.team ? task.team.name : 'No Team',
        progress: `${task.progress}%`,
        todosCompleted: completedTodos,
        totalTodos: totalTodos,
      });
    });

    return workbook;
  }

  async exportUsersReport(user: User): Promise<ExcelJS.Workbook> {
    let users: User[];

    if (user.role === UserRole.ADMIN) {
      // Get all teams where user is owner or member
      const teams = await this.teamsRepository.find({
        where: [{ owner: { id: user.id } }, { members: { id: user.id } }],
        relations: ['members'],
      });

      // Get all users from these teams
      const allUsers = teams.flatMap((team) => team.members);

      // Remove duplicates
      users = allUsers.filter(
        (userObj, index, self) =>
          index === self.findIndex((u) => u.id === userObj.id),
      );
    } else {
      users = [user];
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users Report');

    worksheet.columns = [
      { header: 'User ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Teams', key: 'teams', width: 30 },
      { header: 'Total Tasks', key: 'totalTasks', width: 15 },
      { header: 'Pending Tasks', key: 'pendingTasks', width: 15 },
      { header: 'In Progress Tasks', key: 'inProgressTasks', width: 15 },
      { header: 'Completed Tasks', key: 'completedTasks', width: 15 },
      { header: 'Completion Rate', key: 'completionRate', width: 15 },
    ];

    for (const user of users) {
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

      const completionRate =
        totalTasks > 0
          ? ((completedTasks / totalTasks) * 100).toFixed(2) + '%'
          : '0%';

      // Get user's teams
      const userWithTeams = await this.usersRepository.findOne({
        where: { id: user.id },
        relations: ['teams'],
      });

      const teamNames =
        userWithTeams?.teams?.map((team) => team.name).join(', ') || 'No Teams';

      worksheet.addRow({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teams: teamNames,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        completionRate,
      });
    }

    return workbook;
  }

  async getTeamPerformanceReport(user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can access team performance reports',
      );
    }

    // Get all teams where user is owner or member
    const teams = await this.teamsRepository.find({
      where: [{ owner: { id: user.id } }, { members: { id: user.id } }],
      relations: ['members'],
    });

    // Get all users from these teams
    const allUsers = teams.flatMap((team) => team.members);
    const uniqueUsers = allUsers.filter(
      (userObj, index, self) =>
        index === self.findIndex((u) => u.id === userObj.id),
    );

    const report = await Promise.all(
      uniqueUsers.map(async (teamUser) => {
        const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
          this.tasksRepository.count({
            where: { assignedTo: { id: teamUser.id } },
          }),
          this.tasksRepository.count({
            where: {
              assignedTo: { id: teamUser.id },
              status: Status.COMPLETED,
            },
          }),
          this.tasksRepository.count({
            where: {
              assignedTo: { id: teamUser.id },
              status: In([Status.PENDING, Status.IN_PROGRESS]),
              dueDate: LessThan(new Date()),
            },
          }),
        ]);

        return {
          userId: teamUser.id,
          userName: teamUser.name,
          userEmail: teamUser.email,
          userRole: teamUser.role,
          totalTasks,
          completedTasks,
          overdueTasks,
          completionRate:
            totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        };
      }),
    );

    return report;
  }

  // New method: Get team-specific reports
  async getTeamDetailedReport(user: User, teamId: number) {
    // Verify user has access to this team
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members', 'owner'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const hasAccess =
      team.owner.id === user.id ||
      team.members.some((member) => member.id === user.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this team');
    }

    const teamUserIds = team.members.map((member) => member.id);

    const tasks = await this.tasksRepository.find({
      where: { assignedTo: In(teamUserIds) },
      relations: ['assignedTo', 'todos'],
    });

    const teamReport = {
      teamId: team.id,
      teamName: team.name,
      totalMembers: team.members.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((task) => task.status === Status.COMPLETED)
        .length,
      pendingTasks: tasks.filter((task) => task.status === Status.PENDING)
        .length,
      inProgressTasks: tasks.filter(
        (task) => task.status === Status.IN_PROGRESS,
      ).length,
      overdueTasks: tasks.filter(
        (task) =>
          [Status.PENDING, Status.IN_PROGRESS].includes(task.status) &&
          new Date(task.dueDate) < new Date(),
      ).length,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignedTo: task.assignedTo.name,
        dueDate: task.dueDate,
        progress: task.progress,
      })),
    };

    return teamReport;
  }
}
