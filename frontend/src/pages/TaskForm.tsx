import { useForm } from 'react-hook-form'
import { Button, Input, Select } from '@/components/ui'
import { toDateInputValue, getApiErrorMessage } from '@/utils'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { useLang } from '@/context/LangContext'
import type { Task, TaskStatus, TaskPriority } from '@/types'

interface TaskFormProps {
  task: Task | null
  onClose: () => void
}

interface FormValues {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string
}

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const { t } = useLang()
  const isEditing = !!task

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'pending',
      priority: task?.priority ?? 'medium',
      due_date: toDateInputValue(task?.due_date),
    },
  })

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const isPending = createTask.isPending || updateTask.isPending || isSubmitting

  const STATUS_OPTIONS = [
    { value: 'pending', label: t('statusPending') },
    { value: 'in_progress', label: t('statusInProgress') },
    { value: 'completed', label: t('statusCompleted') },
  ]

  const PRIORITY_OPTIONS = [
    { value: 'low', label: t('priorityLow') },
    { value: 'medium', label: t('priorityMedium') },
    { value: 'high', label: t('priorityHigh') },
  ]

  const onSubmit = async (values: FormValues) => {
    createTask.reset()
    updateTask.reset()

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      status: values.status,
      priority: values.priority,
      due_date: values.due_date || undefined,
    }

    if (isEditing) {
      await updateTask.mutateAsync({ id: task.id, payload })
    } else {
      await createTask.mutateAsync(payload)
    }
    onClose()
  }

  const serverError =
    (createTask.error || updateTask.error) &&
    getApiErrorMessage(createTask.error ?? updateTask.error)

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      noValidate
      className="space-y-4"
    >
      <Input
        label={t('titleLabel')}
        placeholder={t('titlePlaceholder')}
        autoFocus
        error={errors.title?.message}
        {...register('title', { required: t('titleRequired') })}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{t('descriptionLabel')}</label>
        <textarea
          rows={3}
          placeholder={t('descriptionPlaceholder')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label={t('statusLabel')}
          options={STATUS_OPTIONS}
          {...register('status')}
        />
        <Select
          label={t('priorityLabel')}
          options={PRIORITY_OPTIONS}
          {...register('priority')}
        />
      </div>

      <Input label={t('dueDateLabel')} type="date" {...register('due_date')} />

      {serverError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
          {t('cancel')}
        </Button>
        <Button type="submit" isLoading={isPending}>
          {isEditing ? t('saveChanges') : t('createTask')}
        </Button>
      </div>
    </form>
  )
}
