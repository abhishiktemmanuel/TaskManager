import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Status } from './interfaces/status.enum';
import { UserRole } from '../users/interfaces/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('dashboard-data')
  getDashboardData(@GetUser() user: User) {
    return this.tasksService.getDashboardData(user);
  }

  @Get()
  getTasks(@GetUser() user: User) {
    return this.tasksService.getTasks(user);
  }

  @Get(':id')
  getTaskById(@Param('id') id: string, @GetUser() user: User) {
    return this.tasksService.getTaskById(+id, user);
  }

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto, @GetUser() user: User) {
    return this.tasksService.createTask(createTaskDto, user);
  }

  @Put(':id')
  updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User,
  ) {
    return this.tasksService.updateTask(+id, updateTaskDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  deleteTask(@Param('id') id: string, @GetUser() user: User) {
    return this.tasksService.deleteTask(+id, user);
  }

  @Put(':id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body() statusUpdateDto: { status: Status },
    @GetUser() user: User,
  ) {
    return this.tasksService.updateTaskStatus(
      +id,
      statusUpdateDto.status,
      user,
    );
  }

  @Put(':id/todo')
  updateTaskChecklist(
    @Param('id') id: string,
    @Body() todoUpdateDto: { todoChecklist: any[] },
    @GetUser() user: User,
  ) {
    return this.tasksService.updateTaskChecklist(
      +id,
      todoUpdateDto.todoChecklist,
      user,
    );
  }
}
