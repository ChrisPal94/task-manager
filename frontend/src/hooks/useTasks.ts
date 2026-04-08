import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi, tasksKeys } from '@/api'
import type { CreateTaskPayload, Task, TaskStatus, UpdateTaskPayload } from '@/types'

// ── Query ─────────────────────────────────────────────────────────────────────

export function useTasksQuery(status?: TaskStatus) {
  return useQuery({
    queryKey: tasksKeys.list(status),
    queryFn: () => tasksApi.getAll(status),
    staleTime: 30_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all() })
    },
  })
}

// Optimistic update: applies the change locally before the server responds.
// onMutate snapshots the cache, onError rolls it back, onSettled re-syncs.
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      tasksApi.update(id, payload),

    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.all() })

      const previousData = queryClient.getQueriesData<Task[]>({
        queryKey: tasksKeys.all(),
      })

      queryClient.setQueriesData<Task[]>({ queryKey: tasksKeys.all() }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...payload } : t)),
      )

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all() })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id).then(() => id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.all() })

      const previousData = queryClient.getQueriesData<Task[]>({
        queryKey: tasksKeys.all(),
      })

      queryClient.setQueriesData<Task[]>({ queryKey: tasksKeys.all() }, (old) =>
        old?.filter((t) => t.id !== id),
      )

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all() })
    },
  })
}
