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
        const task: Task = {
          ...newData,
          task_items: undefined,
        }
        addTask(task)
      } else if (eventType === 'UPDATE') {
        updateTask(newData.id, newData)
      } else if (eventType === 'DELETE') {
        deleteTask(oldData.id)
      }
    },
    [addTask, updateTask, deleteTask]
  )

  // ✅ Handle task_items table changes
  const handleTaskItemsChange = useCallback(
    (payload: RealtimePayload) => {
      const { eventType, new: newData, old: oldData } = payload

      if (eventType === 'INSERT') {
        addTaskItem(newData as TaskItem)
      } else if (eventType === 'UPDATE') {
        updateTaskItem(newData.task_id, newData.id, newData)
      } else if (eventType === 'DELETE') {
        deleteTaskItem(oldData.task_id, oldData.id)
      }
    },
    [addTaskItem, updateTaskItem, deleteTaskItem]
  )

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
 */
export function useOptimisticUpdate() {
  const { updateTask, updateTaskItem } = useTasksStore()

  const updateTaskOptimistic = useCallback(
    async (
      taskId: string,
      updates: Partial<Task>,
      dbUpdate: () => Promise<any>
    ) => {
      updateTask(taskId, updates)
      try {
        await dbUpdate()
      } catch (error) {
        console.error('Optimistic update failed:', error)
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
      updateTaskItem(taskId, itemId, updates)
      try {
        await dbUpdate()
      } catch (error) {
        console.error('Optimistic item update failed:', error)
      }
    },
    [updateTaskItem]
  )

  return { updateTaskOptimistic, updateItemOptimistic }
}
