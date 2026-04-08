import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { UserRole } from '../users/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAll(
    callerId: string,
    callerRole: UserRole,
    status?: TaskStatus,
    priority?: TaskPriority,
    page = 1,
    limit = 50,
  ): Promise<Task[]> {
    const qb = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .orderBy('task.created_at', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (callerRole !== 'admin') {
      qb.where('task.owner_id = :ownerId', { ownerId: callerId });
    }

    if (status) qb.andWhere('task.status = :status', { status });
    if (priority) qb.andWhere('task.priority = :priority', { priority });

    return qb.getMany();
  }

  async findOne(id: string, ownerId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, owner_id: ownerId },
    });

    if (!task) throw new NotFoundException('Task not found');

    return task;
  }

  async create(dto: CreateTaskDto, ownerId: string): Promise<Task> {
    const task = this.tasksRepository.create({ ...dto, owner_id: ownerId });
    return this.tasksRepository.save(task);
  }

  async update(id: string, dto: UpdateTaskDto, ownerId: string): Promise<Task> {
    const task = await this.findOne(id, ownerId);
    this.tasksRepository.merge(task, dto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const task = await this.findOne(id, ownerId);
    await this.tasksRepository.remove(task);
  }
}
