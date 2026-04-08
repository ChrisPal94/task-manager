import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { CreateUsersTable1712300000000 } from './database/migrations/1712300000000-CreateUsersTable';
import { CreateTasksTable1712300000001 } from './database/migrations/1712300000001-CreateTasksTable';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH ?? './database.sqlite',
  entities: [User, Task],
  migrations: [CreateUsersTable1712300000000, CreateTasksTable1712300000001],
  synchronize: false,
  logging: false,
});
