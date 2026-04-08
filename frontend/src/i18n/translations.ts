export type Locale = 'en' | 'es'

export const translations = {
  en: {
    // Login
    appTagline: 'Sign in to your account',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    signIn: 'Sign in',
    loginFailed: 'Login failed',

    // Header
    signOut: 'Sign out',

    // Task list
    myTasks: 'My Tasks',
    newTask: 'New Task',
    noTasksTitle: 'No tasks yet',
    noTasksSubtitle: 'Create your first task to get started',
    deleteConfirm: 'Delete this task?',

    // Filters
    filterAll: 'All',
    filterPending: 'Pending',
    filterInProgress: 'In Progress',
    filterCompleted: 'Completed',

    // Task form
    editTask: 'Edit Task',
    createTask: 'New Task',
    titleLabel: 'Title *',
    titlePlaceholder: 'Fix the login bug',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Optional details...',
    statusLabel: 'Status',
    priorityLabel: 'Priority',
    dueDateLabel: 'Due Date',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    titleRequired: 'Title is required',

    // Status labels
    statusPending: 'Pending',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',

    // Priority labels
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',

    // Misc
    due: 'Due',
    task: 'task',
    tasks: 'tasks',
    unexpectedError: 'An unexpected error occurred'
  },
  es: {
    // Login
    appTagline: 'Iniciá sesión en tu cuenta',
    email: 'Correo electrónico',
    emailPlaceholder: 'usuario@ejemplo.com',
    password: 'Contraseña',
    signIn: 'Iniciar sesión',
    loginFailed: 'Error al iniciar sesión',

    // Header
    signOut: 'Cerrar sesión',

    // Task list
    myTasks: 'Mis tareas',
    newTask: 'Nueva tarea',
    noTasksTitle: 'Sin tareas aún',
    noTasksSubtitle: 'Creá tu primera tarea para empezar',
    deleteConfirm: '¿Eliminar esta tarea?',

    // Filters
    filterAll: 'Todas',
    filterPending: 'Pendiente',
    filterInProgress: 'En progreso',
    filterCompleted: 'Completada',

    // Task form
    editTask: 'Editar tarea',
    createTask: 'Nueva tarea',
    titleLabel: 'Título *',
    titlePlaceholder: 'Corregir el bug de login',
    descriptionLabel: 'Descripción',
    descriptionPlaceholder: 'Detalles opcionales...',
    statusLabel: 'Estado',
    priorityLabel: 'Prioridad',
    dueDateLabel: 'Fecha límite',
    edit: 'Editar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    saveChanges: 'Guardar cambios',
    titleRequired: 'El título es obligatorio',

    // Status labels
    statusPending: 'Pendiente',
    statusInProgress: 'En progreso',
    statusCompleted: 'Completada',

    // Priority labels
    priorityLow: 'Baja',
    priorityMedium: 'Media',
    priorityHigh: 'Alta',

    // Misc
    due: 'Vence',
    task: 'tarea',
    tasks: 'tareas',
    unexpectedError: 'Ocurrió un error inesperado'
  }
} satisfies Record<Locale, Record<string, string>>

export type TranslationKey = keyof typeof translations.en
