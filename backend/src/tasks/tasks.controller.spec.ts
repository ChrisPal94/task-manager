import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Task, TaskPriority, TaskStatus } from './task.entity'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

const OWNER_ID = 'uuid-mario'
const TASK_ID = 'uuid-task-1'

const mockUser = { id: OWNER_ID, email: 'mario@mushroom.kingdom' }

const buildTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: TASK_ID,
    title: 'Fix the pipes',
    description: null,
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    due_date: null,
    owner_id: OWNER_ID,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as Task

const mockTasksService: jest.Mocked<TasksService> = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
} as any

describe('TasksController', () => {
  let controller: TasksController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile()

    controller = module.get(TasksController)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('delegates to service with the authenticated user id', async () => {
      const tasks = [buildTask()]
      mockTasksService.findAll.mockResolvedValue(tasks)

      const result = await controller.findAll(mockUser, {})

      expect(mockTasksService.findAll).toHaveBeenCalledWith(OWNER_ID, undefined)
      expect(result).toEqual(tasks)
    })

    it('forwards the status filter to the service', async () => {
      mockTasksService.findAll.mockResolvedValue([])

      await controller.findAll(mockUser, { status: TaskStatus.COMPLETED })

      expect(mockTasksService.findAll).toHaveBeenCalledWith(OWNER_ID, TaskStatus.COMPLETED)
    })
  })

  describe('findOne', () => {
    it('delegates to service with the task id and owner id', async () => {
      const task = buildTask()
      mockTasksService.findOne.mockResolvedValue(task)

      const result = await controller.findOne(mockUser, TASK_ID)

      expect(mockTasksService.findOne).toHaveBeenCalledWith(TASK_ID, OWNER_ID)
      expect(result).toEqual(task)
    })

    it('propagates NotFoundException when task is not found', async () => {
      mockTasksService.findOne.mockRejectedValue(new NotFoundException())

      await expect(controller.findOne(mockUser, 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('create', () => {
    it('delegates to service with the dto and owner id', async () => {
      const dto = { title: 'Rescue Princess Peach' }
      const task = buildTask({ title: dto.title })
      mockTasksService.create.mockResolvedValue(task)

      const result = await controller.create(mockUser, dto as any)

      expect(mockTasksService.create).toHaveBeenCalledWith(dto, OWNER_ID)
      expect(result).toEqual(task)
    })
  })

  describe('update', () => {
    it('delegates to service with the id, dto and owner id', async () => {
      const dto = { title: 'Defeat Bowser' }
      const updated = buildTask({ title: dto.title })
      mockTasksService.update.mockResolvedValue(updated)

      const result = await controller.update(mockUser, TASK_ID, dto as any)

      expect(mockTasksService.update).toHaveBeenCalledWith(TASK_ID, dto, OWNER_ID)
      expect(result).toEqual(updated)
    })

    it('propagates NotFoundException when updating a non-existent task', async () => {
      mockTasksService.update.mockRejectedValue(new NotFoundException())

      await expect(
        controller.update(mockUser, 'nonexistent-id', { title: 'Ghost' } as any),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('delegates to service with the task id and owner id', async () => {
      mockTasksService.remove.mockResolvedValue()

      await controller.remove(mockUser, TASK_ID)

      expect(mockTasksService.remove).toHaveBeenCalledWith(TASK_ID, OWNER_ID)
    })
  })
})
