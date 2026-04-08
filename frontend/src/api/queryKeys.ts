import type { TaskStatus } from '@/types'

// Query key factory — keeps cache keys consistent and allows
// invalidating all task queries at once after any mutation.
export const tasksKeys = {
  all: () => ['tasks'] as const,
  list: (status?: TaskStatus) =>
    [...tasksKeys.all(), 'list', status ?? 'all'] as const,
  detail: (id: string) => [...tasksKeys.all(), 'detail', id] as const,
}
