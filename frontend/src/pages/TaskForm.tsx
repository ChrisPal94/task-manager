import { useState, type FormEvent } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { toDateInputValue, getApiErrorMessage } from '@/utils'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import type { Task, TaskStatus, TaskPriority } from '@/types'

interface TaskFormProps {
  task: Task | null
  onClose: () => void
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const isEditing = !!task

  const [title, setTitle]             = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus]           = useState<TaskStatus>(task?.status ?? 'pending')
  const [priority, setPriority]       = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate]         = useState(toDateInputValue(task?.due_date))
  const [error, setError]             = useState<string | null>(null)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const isPending = createTask.isPending || updateTask.isPending

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setError(null)

    const payload = {
      title:       title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      due_date:    dueDate || undefined,
    }

    try {
      if (isEditing) {
        await updateTask.mutateAsync({ id: task.id, payload })
      } else {
        await createTask.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} noValidate className="space-y-4">
      <Input
        label="Title *"
        placeholder="Fix the login bug"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={3}
          placeholder="Optional details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
        />
        <Select
          label="Priority"
          value={priority}
          options={PRIORITY_OPTIONS}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
        />
      </div>

      <Input
        label="Due Date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isPending}>
          {isEditing ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
