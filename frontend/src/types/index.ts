export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface CreateTaskPayload {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export interface ApiError {
  message: string | string[]
  error: string
  statusCode: number
}
