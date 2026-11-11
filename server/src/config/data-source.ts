import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Todo } from '../tasks/entities/todo.entity';
import { Team } from '../users/entities/team.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const useSsl =
  process.env.DB_SSL === 'true' ||
  (hasDatabaseUrl && process.env.DB_SSL !== 'false');

export const AppDataSource = new DataSource(
  hasDatabaseUrl
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, Task, Todo, Team],
        synchronize: false,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        migrations: ['src/migrations/*.ts'],
        migrationsTableName: 'migrations',
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'task_manager',
        entities: [User, Task, Todo, Team],
        synchronize: false,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        migrations: ['src/migrations/*.ts'],
        migrationsTableName: 'migrations',
      },
);
