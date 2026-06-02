import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/react'

export interface Task {
  id: string
  body_number: string
  client_name: string
  comment?: string
  priority: 'high' | 'medium' | 'low'
  status: 'created' | 'taken' | 'done' | 'closed'
  type: 'payment' | 'registration' | 'passport'
  file?: string
  assigned_to?: string
  return_comment?: string
  created_at: string
  task_items?: TaskItem[]
}

export interface TaskItem {
  id: string
  task_id: string
  body_number: string
  client_name: string
  invoice_file?: string
  is_paid: boolean
  created_at: string
}

export interface TasksState {
  // Normalized state
  tasksById: Record<string, Task>
  taskIds: string[]
  taskItemsByTaskId: Record<string, TaskItem[]>

  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void

  // Task items actions
  addTaskItem: (item: TaskItem) => void
  updateTaskItem: (taskId: string, itemId: string, updates: Partial<TaskItem>) => void
  deleteTaskItem: (taskId: string, itemId: string) => void

  // Getters
  getTask: (taskId: string) => Task | undefined
  getTasksByStatus: (status: Task['status']) => Task[]
  getTasksByType: (type: Task['type']) => Task[]
  getFilteredTasks: (status?: Task['status'], type?: Task['type']) => Task[]
  getTaskItems: (taskId: string) => TaskItem[]
}

// ✅ Zustand store with automatic subscriptions
export const useTasksStore = create<TasksState>()(
  subscribeWithSelector((set, get) => ({
    tasksById: {},
    taskIds: [],
    taskItemsByTaskId: {},

    // ✅ Replace entire state (for initial load)
    setTasks: (tasks: Task[]) =>
      set((state) => {
        const tasksById: Record<string, Task> = {}
        const taskIds: string[] = []
        const taskItemsByTaskId: Record<string, TaskItem[]> = {}

        tasks.forEach((task) => {
          tasksById[task.id] = { ...task, task_items: undefined }
          taskIds.push(task.id)

          if (task.task_items && task.task_items.length > 0) {
            taskItemsByTaskId[task.id] = task.task_items
          }
        })

        return { tasksById, taskIds, taskItemsByTaskId }
      }),

    // ✅ Add new task (optimistic update)
    addTask: (task: Task) =>
      set((state) => {
        if (state.tasksById[task.id]) return state // Prevent duplicates

        return {
          tasksById: {
            ...state.tasksById,
            [task.id]: { ...task, task_items: undefined },
          },
          taskIds: [task.id, ...state.taskIds],
        }
      }),

    // ✅ Update task fields (patch, not full replace)
    updateTask: (taskId: string, updates: Partial<Task>) =>
      set((state) => {
        if (!state.tasksById[taskId]) return state

        return {
          tasksById: {
            ...state.tasksById,
            [taskId]: {
              ...state.tasksById[taskId],
              ...updates,
            },
          },
        }
      }),

    // ✅ Delete task
    deleteTask: (taskId: string) =>
      set((state) => {
        const { [taskId]: _, ...remainingTasks } = state.tasksById
        const { [taskId]: __, ...remainingItems } = state.taskItemsByTaskId

        return {
          tasksById: remainingTasks,
          taskIds: state.taskIds.filter((id) => id !== taskId),
          taskItemsByTaskId: remainingItems,
        }
      }),

    // ✅ Add task item (nested)
    addTaskItem: (item: TaskItem) =>
      set((state) => {
        const items = state.taskItemsByTaskId[item.task_id] || []

        // Prevent duplicates
        if (items.find((i) => i.id === item.id)) return state

        return {
          taskItemsByTaskId: {
            ...state.taskItemsByTaskId,
            [item.task_id]: [...items, item],
          },
        }
      }),

    // ✅ Update task item
    updateTaskItem: (taskId: string, itemId: string, updates: Partial<TaskItem>) =>
      set((state) => {
        const items = state.taskItemsByTaskId[taskId]
        if (!items) return state

        return {
          taskItemsByTaskId: {
            ...state.taskItemsByTaskId,
            [taskId]: items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          },
        }
      }),

    // ✅ Delete task item
    deleteTaskItem: (taskId: string, itemId: string) =>
      set((state) => {
        const items = state.taskItemsByTaskId[taskId]
        if (!items) return state

        return {
          taskItemsByTaskId: {
            ...state.taskItemsByTaskId,
            [taskId]: items.filter((item) => item.id !== itemId),
          },
        }
      }),

    // ✅ Getters (selectors)
    getTask: (taskId: string) => get().tasksById[taskId],

    getTasksByStatus: (status: Task['status']) => {
      const { tasksById, taskIds } = get()
      return taskIds
        .map((id) => tasksById[id])
        .filter((task) => task.status === status)
    },

    getTasksByType: (type: Task['type']) => {
      const { tasksById, taskIds } = get()
      return taskIds
        .map((id) => tasksById[id])
        .filter((task) => task.type === type)
    },

    getFilteredTasks: (status?: Task['status'], type?: Task['type']) => {
      const { tasksById, taskIds } = get()
      return taskIds
        .map((id) => tasksById[id])
        .filter((task) => {
          if (status && task.status !== status) return false
          if (type && task.type !== type) return false
          return true
        })
    },

    getTaskItems: (taskId: string) => get().taskItemsByTaskId[taskId] || [],
  }))
)
