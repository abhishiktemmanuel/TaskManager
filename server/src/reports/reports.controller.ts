import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/interfaces/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('tasks/export')
  async exportTasksReport(@Res() res: Response, @GetUser() user: User) {
    const workbook = await this.reportsService.exportTasksReport(user);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=tasks-report.xlsx',
    );
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('users/export')
  async exportUsersReport(@Res() res: Response, @GetUser() user: User) {
    const workbook = await this.reportsService.exportUsersReport(user);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users-report.xlsx',
    );
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('team-performance')
  @Roles(UserRole.ADMIN)
  async getTeamPerformanceReport(@GetUser() user: User) {
    return this.reportsService.getTeamPerformanceReport(user);
  }
}
