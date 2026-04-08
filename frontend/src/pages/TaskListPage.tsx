import { useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LangContext'
import { useTasksQuery, useDeleteTask } from '@/hooks/useTasks'
import { Badge, Button, ConfirmModal, LocaleSwitcher, Spinner, Modal } from '@/components/ui'
import { STATUS_STYLES, PRIORITY_STYLES, formatDate, getApiErrorKey } from '@/utils'
import type { Task, TaskPriority, TaskStatus } from '@/types'
import TaskForm from './TaskForm'

export default function TaskListPage() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const isAdmin = user?.role === 'admin'

  const [activeStatus, setActiveStatus] = useState<TaskStatus | 'all'>('all')
  const [activePriority, setActivePriority] = useState<TaskPriority | 'all'>('all')

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
  } = useTasksQuery(
    activeStatus === 'all' ? undefined : activeStatus,
    activePriority === 'all' ? undefined : activePriority,
  )

  const deleteMutation = useDeleteTask()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const openCreate = () => {
    setEditingTask(null)
    setModalOpen(true)
  }
  const openEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditingTask(null)
  }

  const confirmDelete = () => {
    if (!confirmDeleteId) return
    deleteMutation.mutate(confirmDeleteId, {
      onSettled: () => setConfirmDeleteId(null),
    })
  }

  const STATUS_FILTERS = useMemo<{ label: string; value: TaskStatus | 'all' }[]>(
    () => [
      { label: t('filterAll'), value: 'all' },
      { label: t('filterPending'), value: 'pending' },
      { label: t('filterInProgress'), value: 'in_progress' },
      { label: t('filterCompleted'), value: 'completed' },
    ],
    [t],
  )

  const PRIORITY_FILTERS = useMemo<{ label: string; value: TaskPriority | 'all' }[]>(
    () => [
      { label: t('filterAll'), value: 'all' },
      { label: t('filterLow'), value: 'low' },
      { label: t('filterMedium'), value: 'medium' },
      { label: t('filterHigh'), value: 'high' },
    ],
    [t],
  )

  const STATUS_LABELS = useMemo(
    () => ({
      pending: t('statusPending'),
      in_progress: t('statusInProgress'),
      completed: t('statusCompleted'),
    }),
    [t],
  )

  const PRIORITY_LABELS = useMemo(
    () => ({
      low: t('priorityLow'),
      medium: t('priorityMedium'),
      high: t('priorityHigh'),
    }),
    [t],
  )

  const taskCount = tasks.length
  const taskWord = taskCount === 1 ? t('task') : t('tasks')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex h-14 items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">
              T
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">Task Manager</span>
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                {t('adminBadge')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LocaleSwitcher />
            <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <span className="hidden sm:inline">{t('signOut')}</span>
              <svg
                className="h-4 w-4 sm:hidden"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-label={t('signOut')}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {isAdmin ? t('allTasks') : t('myTasks')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {taskCount} {taskWord}
            </p>
          </div>
          {!isAdmin && (
            <Button onClick={openCreate}>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('newTask')}
            </Button>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveStatus(f.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeStatus === f.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {PRIORITY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActivePriority(f.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activePriority === f.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {(isError || deleteMutation.isError) && (
          <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {isError ? t(getApiErrorKey(error)) : t(getApiErrorKey(deleteMutation.error))}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3" role="img" aria-label={t('noTasksTitle')}>
              📋
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300">{t('noTasksTitle')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('noTasksSubtitle')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-4 sm:px-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                    {isAdmin && task.owner && (
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {t('owner')}:{' '}
                        <span className="font-medium text-gray-600 dark:text-gray-300">{task.owner.name}</span>
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 sm:truncate">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      label={STATUS_LABELS[task.status]}
                      className={STATUS_STYLES[task.status]}
                    />
                    <Badge
                      label={PRIORITY_LABELS[task.priority]}
                      className={PRIORITY_STYLES[task.priority]}
                    />
                    {task.due_date && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t('due')} {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                {!isAdmin && (
                  <div className="flex items-center gap-2 sm:self-center border-t border-gray-100 dark:border-gray-700 pt-3 sm:border-none sm:pt-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => openEdit(task)}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      isLoading={
                        deleteMutation.isPending &&
                        deleteMutation.variables === (task.id as string)
                      }
                      onClick={() => setConfirmDeleteId(task.id)}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {!isAdmin && (
        <>
          <Modal
            isOpen={modalOpen}
            onClose={closeModal}
            title={editingTask ? t('editTask') : t('createTask')}
          >
            <TaskForm task={editingTask} onClose={closeModal} />
          </Modal>

          <ConfirmModal
            isOpen={confirmDeleteId !== null}
            title={t('deleteTask')}
            message={t('deleteConfirm')}
            confirmLabel={t('delete')}
            cancelLabel={t('cancel')}
            isLoading={deleteMutation.isPending}
            onConfirm={confirmDelete}
            onCancel={() => setConfirmDeleteId(null)}
          />
        </>
      )}
    </div>
  )
}
