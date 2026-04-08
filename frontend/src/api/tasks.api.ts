import { http } from './http'
import type { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from '@/types'

export const tasksApi = {
  getAll: (status?: TaskStatus) =>
    http
      .get<Task[]>('/tasks', { params: status ? { status } : undefined })
      .then((r) => r.data),

  getOne: (id: string) =>
    http.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (payload: CreateTaskPayload) =>
    http.post<Task>('/tasks', payload).then((r) => r.data),

  update: (id: string, payload: UpdateTaskPayload) =>
    http.put<Task>(`/tasks/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    http.delete(`/tasks/${id}`),
}
