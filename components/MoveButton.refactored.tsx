'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState, useCallback } from 'react'
import { useOptimisticUpdate } from '@/lib/realtime-sync'
import { useTasksStore, Task } from '@/lib/store'

interface MoveButtonProps {
  taskId: string
  status: Task['status']
  label: string
}

export default function MoveButton({ taskId, status, label }: MoveButtonProps) {
  const [loading, setLoading] = useState(false)
  const { updateTaskOptimistic } = useOptimisticUpdate()
  const task = useTasksStore((state) => state.getTask(taskId))

  const handleMove = useCallback(async () => {
    if (loading || !task) return
    setLoading(true)

    try {
      // ✅ Optimistic update
      await updateTaskOptimistic(
        taskId,
        { status },
        async () => {
          const { data: updated, error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', taskId)
            .eq('status', task.status)
            .select()
            .single()

          if (error || !updated) {
            alert('Статус задачи был изменен другим пользователем')
            throw error || new Error('Status changed by another user')
          }
        }
      )
    } catch (err) {
      console.error('MOVE ERROR:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, task, taskId, status, updateTaskOptimistic])

  if (!task) return null

  return (
    <Button size="sm" onClick={handleMove} disabled={loading}>
      {loading ? '...' : label}
    </Button>
  )
}
