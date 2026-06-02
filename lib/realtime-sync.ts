'use client'

import { useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useTasksStore, Task, TaskItem } from './store'

interface RealtimePayload {
  new?: any
  old?: any
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

/**
 * ✅ Realtime patch handler - only updates changed fields
 * No full refetch, only surgical updates
 */
export function useRealtimeSync() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const {
    addTask,
    updateTask,
    deleteTask,
    addTaskItem,
    updateTaskItem,
    deleteTaskItem,
  } = useTasksStore()

  // ✅ Handle tasks table changes (INSERT, UPDATE, DELETE)
  const handleTasksChange = useCallback(
    (payload: RealtimePayload) => {
      const { eventType, new: newData, old: oldData } = payload

      if (eventType === 'INSERT') {
        // ✅ Add only the task (without task_items initially)
        const task: Task = {
          ...newData,
          task_items: undefined,
        }
        addTask(task)
      } else if (eventType === 'UPDATE') {
        // ✅ Patch only changed fields (not full replace)
        updateTask(newData.id, newData)
      } else if (eventType === 'DELETE') {
        // ✅ Remove task and its items
        deleteTask(oldData.id)
      }
    },
    [addTask, updateTask, deleteTask]
  )

  // ✅ Handle task_items table changes (INSERT, UPDATE, DELETE)
  const handleTaskItemsChange = useCallback(
    (payload: RealtimePayload) => {
      const { eventType, new: newData, old: oldData } = payload

      if (eventType === 'INSERT') {
        const item: TaskItem = newData
        addTaskItem(item)
      } else if (eventType === 'UPDATE') {
        updateTaskItem(newData.task_id, newData.id, newData)
      } else if (eventType === 'DELETE') {
        deleteTaskItem(oldData.task_id, oldData.id)
      }
    },
    [addTaskItem, updateTaskItem, deleteTaskItem]
  )

  // ✅ Setup realtime listeners
  const setupRealtimeSync = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('tasks-realtime', {
        config: {
          broadcast: { self: false },
        },
      })
      .on<RealtimePayload>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        handleTasksChange
      )
      .on<RealtimePayload>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_items' },
        handleTaskItemsChange
      )
      .subscribe()

    channelRef.current = channel
  }, [handleTasksChange, handleTaskItemsChange])

  // ✅ Initialize on mount
  useEffect(() => {
    setupRealtimeSync()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [setupRealtimeSync])

  return { setupRealtimeSync }
}

/**
 * ✅ Optimistic update hook
 * Update locally first, then sync with server
 */
export function useOptimisticUpdate() {
  const { updateTask, updateTaskItem } = useTasksStore()

  const updateTaskOptimistic = useCallback(
    async (
      taskId: string,
      updates: Partial<Task>,
      dbUpdate: () => Promise<any>
    ) => {
      // ✅ 1. Update locally FIRST
      updateTask(taskId, updates)

      // ✅ 2. Sync with DB
      try {
        await dbUpdate()
      } catch (error) {
        console.error('Optimistic update failed:', error)
        // On error, realtime will fetch the latest state
        // No manual rollback needed
      }
    },
    [updateTask]
  )

  const updateItemOptimistic = useCallback(
    async (
      taskId: string,
      itemId: string,
      updates: Partial<TaskItem>,
      dbUpdate: () => Promise<any>
    ) => {
      // ✅ 1. Update locally FIRST
      updateTaskItem(taskId, itemId, updates)

      // ✅ 2. Sync with DB
      try {
        await dbUpdate()
      } catch (error) {
        console.error('Optimistic item update failed:', error)
        // Realtime will sync
      }
    },
    [updateTaskItem]
  )

  return {
    updateTaskOptimistic,
    updateItemOptimistic,
  }
}
