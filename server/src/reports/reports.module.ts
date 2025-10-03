import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Team } from '../users/entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Team])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
