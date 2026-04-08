import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { CreateUsersTable1712300000000 } from './database/migrations/1712300000000-CreateUsersTable';
import { CreateTasksTable1712300000001 } from './database/migrations/1712300000001-CreateTasksTable';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', './database.sqlite'),
        entities: [User, Task],
        migrations: [CreateUsersTable1712300000000, CreateTasksTable1712300000001],
        migrationsRun: true,
        synchronize: false,
        logging: false,
      }),
    }),
    AuthModule,
    TasksModule,
    UsersModule,
  ],
})
export class AppModule {}
