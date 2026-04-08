import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTasksQuery, useDeleteTask } from '@/hooks/useTasks'
import { Badge, Button, Spinner, Modal } from '@/components/ui'
import {
  STATUS_STYLES, STATUS_LABELS,
  PRIORITY_STYLES, PRIORITY_LABELS,
  formatDate, getApiErrorMessage,
} from '@/utils'
import type { Task, TaskStatus } from '@/types'
import TaskForm from './TaskForm'

const FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All',         value: 'all' },
  { label: 'Pending',     value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed',   value: 'completed' },
]

export default function TaskListPage() {
  const { user, logout } = useAuth()
  const [activeFilter, setActiveFilter] = useState<TaskStatus | 'all'>('all')

  const { data: tasks = [], isLoading, isError, error } = useTasksQuery(
    activeFilter === 'all' ? undefined : activeFilter,
  )

  const deleteMutation = useDeleteTask()

  const [modalOpen, setModalOpen]     = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const openCreate = () => { setEditingTask(null); setModalOpen(true) }
  const openEdit   = (task: Task) => { setEditingTask(task); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingTask(null) }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this task?')) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">T</span>
            <span className="font-semibold text-gray-900">Task Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openCreate}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {(isError || deleteMutation.isError) && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {isError
              ? getApiErrorMessage(error)
              : getApiErrorMessage(deleteMutation.error)}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-gray-700">No tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first task to get started</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge label={STATUS_LABELS[task.status]}     className={STATUS_STYLES[task.status]} />
                    <Badge label={PRIORITY_LABELS[task.priority]} className={PRIORITY_STYLES[task.priority]} />
                    {task.due_date && (
                      <span className="text-xs text-gray-400">Due {formatDate(task.due_date)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(task)}>Edit</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={deleteMutation.isPending && deleteMutation.variables === task.id}
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          task={editingTask}
          onClose={closeModal}
        />
      </Modal>
    </div>
  )
}
