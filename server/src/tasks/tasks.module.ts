import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { Todo } from './entities/todo.entity';
import { User } from '../users/entities/user.entity';
import { Team } from '../users/entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Todo, User, Team])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
