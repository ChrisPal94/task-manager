import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({
    type: 'varchar',
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({
    type: 'varchar',
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({ nullable: true, type: 'date' })
  due_date!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.tasks, { eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @Index()
  @Column()
  owner_id!: string;
}
