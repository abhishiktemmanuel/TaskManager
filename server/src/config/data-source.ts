import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Todo } from '../tasks/entities/todo.entity';
import { Team } from '../users/entities/team.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'task_manager',
  entities: [User, Task, Todo, Team],
  synchronize: false,
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
