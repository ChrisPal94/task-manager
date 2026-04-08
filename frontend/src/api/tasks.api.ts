import { http } from './http'
import type { Task, TaskPriority, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from '@/types'

export const tasksApi = {
  getAll: (status?: TaskStatus, priority?: TaskPriority) => {
    const params: Record<string, string> = {}
    if (status) params.status = status
    if (priority) params.priority = priority
    return http.get<Task[]>('/tasks', { params }).then((r) => r.data)
  },

  getOne: (id: string) => http.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (payload: CreateTaskPayload) => http.post<Task>('/tasks', payload).then((r) => r.data),

  update: (id: string, payload: UpdateTaskPayload) =>
    http.patch<Task>(`/tasks/${id}`, payload).then((r) => r.data),

  remove: (id: string) => http.delete(`/tasks/${id}`),
}
