import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Todo } from '../tasks/entities/todo.entity';
import { Team } from '../users/entities/team.entity';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const useSsl =
  process.env.DB_SSL === 'true' ||
  (hasDatabaseUrl && process.env.DB_SSL !== 'false');

export const databaseConfig: TypeOrmModuleOptions = hasDatabaseUrl
  ? {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Task, Todo, Team],
      synchronize: true,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      logging: !isProduction,
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'task_manager',
      entities: [User, Task, Todo, Team],
      synchronize: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      logging: !isProduction,
    };
