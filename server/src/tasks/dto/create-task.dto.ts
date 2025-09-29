import {
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Priority } from '../interfaces/priority.enum';
import { Status } from '../interfaces/status.enum';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  @IsOptional()
  assignedToId?: number;

  @IsNumber()
  @IsOptional()
  progress: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  todos?: string[];
}
