import { NotFoundException } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { Repository } from 'typeorm'
import { Task, TaskPriority, TaskStatus } from './task.entity'
import { TasksService } from './tasks.service'

const OWNER_ID = 'uuid-mario'
const OTHER_OWNER_ID = 'uuid-bowser'
const TASK_ID = 'uuid-task-1'

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

describe('TasksService', () => {
  let service: TasksService
  let repo: jest.Mocked<Repository<Task>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            merge: jest.fn().mockImplementation((entity: Task, dto: Partial<Task>) => Object.assign(entity, dto)),
          },
        },
      ],
    }).compile()

    service = module.get(TasksService)
    repo = module.get(getRepositoryToken(Task))
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('returns tasks for the given owner', async () => {
      const tasks = [buildTask()]
      repo.find.mockResolvedValue(tasks)

      const result = await service.findAll(OWNER_ID)

      expect(repo.find).toHaveBeenCalledWith({
        where: { owner_id: OWNER_ID },
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0,
      })
      expect(result).toEqual(tasks)
    })

    it('returns an empty array when the owner has no tasks', async () => {
      repo.find.mockResolvedValue([])

      const result = await service.findAll(OTHER_OWNER_ID)

      expect(result).toEqual([])
      expect(repo.find).toHaveBeenCalledWith({
        where: { owner_id: OTHER_OWNER_ID },
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0,
      })
    })

    it('filters by status when provided', async () => {
      repo.find.mockResolvedValue([])

      await service.findAll(OWNER_ID, TaskStatus.COMPLETED)

      expect(repo.find).toHaveBeenCalledWith({
        where: { owner_id: OWNER_ID, status: TaskStatus.COMPLETED },
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0,
      })
    })

    it('paginates with custom page and limit', async () => {
      repo.find.mockResolvedValue([])

      await service.findAll(OWNER_ID, undefined, 3, 10)

      expect(repo.find).toHaveBeenCalledWith({
        where: { owner_id: OWNER_ID },
        order: { created_at: 'DESC' },
        take: 10,
        skip: 20,
      })
    })

    it('always orders results by created_at DESC', async () => {
      repo.find.mockResolvedValue([])

      await service.findAll(OWNER_ID)

      const call = repo.find.mock.calls[0][0] as Parameters<typeof repo.find>[0]
      expect((call as any).order).toEqual({ created_at: 'DESC' })
    })
  })

  describe('findOne', () => {
    it('returns the task when it belongs to the owner', async () => {
      const task = buildTask()
      repo.findOne.mockResolvedValue(task)

      const result = await service.findOne(TASK_ID, OWNER_ID)

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: TASK_ID, owner_id: OWNER_ID },
      })
      expect(result).toEqual(task)
    })

    it('throws NotFoundException when task does not exist', async () => {
      repo.findOne.mockResolvedValue(null)

      await expect(service.findOne(TASK_ID, OWNER_ID)).rejects.toThrow(NotFoundException)
    })

    it('throws NotFoundException when task belongs to a different owner', async () => {
      repo.findOne.mockResolvedValue(null)

      await expect(service.findOne(TASK_ID, OTHER_OWNER_ID)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('persists and returns a new task with the correct owner', async () => {
      const dto = { title: 'Save Princess Peach' }
      const task = buildTask({ title: dto.title })

      repo.create.mockReturnValue(task)
      repo.save.mockResolvedValue(task)

      const result = await service.create(dto, OWNER_ID)

      expect(repo.create).toHaveBeenCalledWith({ ...dto, owner_id: OWNER_ID })
      expect(repo.save).toHaveBeenCalledWith(task)
      expect(result).toEqual(task)
    })
  })

  describe('update', () => {
    it('applies partial changes and saves the task', async () => {
      const task = buildTask()
      const dto = { title: 'Defeat Bowser', status: TaskStatus.IN_PROGRESS }

      repo.findOne.mockResolvedValue(task)
      repo.save.mockResolvedValue({ ...task, ...dto })

      const result = await service.update(TASK_ID, dto, OWNER_ID)

      expect(repo.save).toHaveBeenCalled()
      expect(result.title).toBe(dto.title)
      expect(result.status).toBe(dto.status)
    })

    it('throws NotFoundException when updating a non-existent task', async () => {
      repo.findOne.mockResolvedValue(null)

      await expect(
        service.update(TASK_ID, { title: 'Ghost task' }, OWNER_ID),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('removes the task when it belongs to the owner', async () => {
      const task = buildTask()
      repo.findOne.mockResolvedValue(task)
      repo.remove.mockResolvedValue(task)

      await service.remove(TASK_ID, OWNER_ID)

      expect(repo.remove).toHaveBeenCalledWith(task)
    })

    it('throws NotFoundException when removing a task that does not belong to the owner', async () => {
      repo.findOne.mockResolvedValue(null)

      await expect(service.remove(TASK_ID, OTHER_OWNER_ID)).rejects.toThrow(NotFoundException)
    })
  })
})
