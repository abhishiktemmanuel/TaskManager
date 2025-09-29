import { Priority } from '../interfaces/priority.enum';
import { Status } from '../interfaces/status.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class TodoResponseDto {
  id: number;
  text: string;
  completed: boolean;
}

export class TaskResponseDto {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: Date;
  assignedTo: UserResponseDto;
  createdBy: UserResponseDto;
  progress: number;
  todos: TodoResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
// This DTO is used to structure the task data sent in responses, including related user and todo information.
