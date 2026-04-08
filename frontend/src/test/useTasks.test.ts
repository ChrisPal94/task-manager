import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useTasksQuery, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { tasksApi } from '@/api'
import type { Task } from '@/types'

vi.mock('@/api', () => ({
  tasksApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  tasksKeys: {
    all: () => ['tasks'] as const,
    list: (status?: string, priority?: string) =>
      ['tasks', 'list', status ?? 'all', priority ?? 'all'] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
}))

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'uuid-task-1',
  title: 'Fix the pipes',
  description: null,
  status: 'pending',
  priority: 'medium',
  due_date: null,
  owner_id: 'uuid-mario',
  created_at: '2025-06-15T00:00:00.000Z',
  updated_at: '2025-06-15T00:00:00.000Z',
  ...overrides,
})

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useTasksQuery', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns tasks from the API', async () => {
    const tasks = [buildTask()]
    vi.mocked(tasksApi.getAll).mockResolvedValue(tasks)

    const { result } = renderHook(() => useTasksQuery(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(tasks)
    expect(tasksApi.getAll).toHaveBeenCalledWith(undefined, undefined)
  })

  it('passes the status filter to the API', async () => {
    vi.mocked(tasksApi.getAll).mockResolvedValue([])

    const { result } = renderHook(() => useTasksQuery('completed'), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(tasksApi.getAll).toHaveBeenCalledWith('completed', undefined)
  })

  it('surfaces API errors', async () => {
    vi.mocked(tasksApi.getAll).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useTasksQuery(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
  })
})

describe('useCreateTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls tasksApi.create with the payload', async () => {
    const newTask = buildTask({ title: 'Save Princess Peach' })
    vi.mocked(tasksApi.getAll).mockResolvedValue([newTask])
    vi.mocked(tasksApi.create).mockResolvedValue(newTask)

    const { result } = renderHook(() => useCreateTask(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ title: 'Save Princess Peach' })
    })

    expect(tasksApi.create).toHaveBeenCalledWith({ title: 'Save Princess Peach' })
  })

  it('exposes the created task in mutate result', async () => {
    const newTask = buildTask({ id: 'uuid-new', title: 'New task' })
    vi.mocked(tasksApi.getAll).mockResolvedValue([newTask])
    vi.mocked(tasksApi.create).mockResolvedValue(newTask)

    const { result } = renderHook(() => useCreateTask(), { wrapper: makeWrapper() })

    let created: Task | undefined
    await act(async () => {
      created = await result.current.mutateAsync({ title: 'New task' })
    })

    expect(created).toEqual(newTask)
  })
})

describe('useUpdateTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls tasksApi.update with the id and payload', async () => {
    const updated = buildTask({ title: 'Defeat Bowser', status: 'in_progress' })
    vi.mocked(tasksApi.getAll).mockResolvedValue([updated])
    vi.mocked(tasksApi.update).mockResolvedValue(updated)

    const { result } = renderHook(() => useUpdateTask(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({
        id: 'uuid-task-1',
        payload: { title: 'Defeat Bowser', status: 'in_progress' },
      })
    })

    expect(tasksApi.update).toHaveBeenCalledWith('uuid-task-1', {
      title: 'Defeat Bowser',
      status: 'in_progress',
    })
  })
})

describe('useDeleteTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls tasksApi.remove with the task id', async () => {
    vi.mocked(tasksApi.getAll).mockResolvedValue([])
    vi.mocked(tasksApi.remove).mockResolvedValue(undefined as any)

    const { result } = renderHook(() => useDeleteTask(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync('uuid-task-1')
    })

    expect(tasksApi.remove).toHaveBeenCalledWith('uuid-task-1')
  })

  it('returns the deleted task id on success', async () => {
    vi.mocked(tasksApi.getAll).mockResolvedValue([])
    vi.mocked(tasksApi.remove).mockResolvedValue(undefined as any)

    const { result } = renderHook(() => useDeleteTask(), { wrapper: makeWrapper() })

    let deletedId: string | undefined
    await act(async () => {
      deletedId = await result.current.mutateAsync('uuid-task-1')
    })

    expect(deletedId).toBe('uuid-task-1')
  })
})
