import type { TaskPriority, TaskStatus } from '@/types'

export const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100   text-blue-800',
  completed: 'bg-green-100  text-green-800',
}

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-gray-100  text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100   text-red-700',
}
