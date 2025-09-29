import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/interfaces/user-role.enum';
import { Status } from '../tasks/interfaces/status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async exportTasksReport(user: User): Promise<ExcelJS.Workbook> {
    let tasks: Task[];

    if (user.role === UserRole.ADMIN) {
      const teamUsers = await this.usersRepository.find({
        where: { invitedByAdminId: user.id },
      });
      const userIds = teamUsers.map((u) => u.id);

      tasks = await this.tasksRepository.find({
        where: { assignedTo: In(userIds) },
        relations: ['assignedTo', 'todos'],
      });
    } else {
      tasks = await this.tasksRepository.find({
        where: { assignedTo: { id: user.id } },
        relations: ['assignedTo', 'todos'],
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
      users = await this.usersRepository.find({
        where: { invitedByAdminId: user.id },
      });
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

      worksheet.addRow({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
      throw new Error('Only admins can access team performance reports');
    }

    const teamUsers = await this.usersRepository.find({
      where: { invitedByAdminId: user.id },
    });

    const report = await Promise.all(
      teamUsers.map(async (teamUser) => {
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
              status: In(['Pending', 'In Progress']),
              dueDate: LessThan(new Date()),
            },
          }),
        ]);

        return {
          userId: teamUser.id,
          userName: teamUser.name,
          userEmail: teamUser.email,
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
}
