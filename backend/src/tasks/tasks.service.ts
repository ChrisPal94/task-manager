import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAll(ownerId: string, status?: TaskStatus): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = { owner_id: ownerId };
    if (status) where.status = status;

    return this.tasksRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
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
    Object.assign(task, dto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const task = await this.findOne(id, ownerId);
    await this.tasksRepository.remove(task);
  }
}
