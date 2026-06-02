'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState, useCallback, memo } from 'react'
import { useOptimisticUpdate } from '@/lib/realtime-sync'
import { useTasksStore } from '@/lib/store'

interface TakeButtonProps {
  taskId: string
}

const TakeButton = memo(function TakeButton({ taskId }: TakeButtonProps) {
  const [loading, setLoading] = useState(false)
  const { updateTaskOptimistic } = useOptimisticUpdate()
  const task = useTasksStore((state) => state.getTask(taskId))

  const handleTake = useCallback(async () => {
    if (loading || !task) return
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        alert('Ошибка пользователя')
        return
      }

      const name =
        data.user.user_metadata?.name?.trim() ||
        data.user.user_metadata?.full_name?.trim() ||
        'Без имени'

      await updateTaskOptimistic(
        taskId,
        { status: 'taken', assigned_to: name },
        async () => {
          const { data: updated, error: updateError } = await supabase
            .from('tasks')
            .update({
              status: 'taken',
              assigned_to: name,
            })
            .eq('id', taskId)
            .eq('status', 'created')
            .select()
            .single()

          if (updateError || !updated) {
            throw new Error('Task already taken')
          }
        }
      )
    } catch (err) {
      console.error('TAKE ERROR:', err)
      alert('Ошибка при взятии задачи')
    } finally {
      setLoading(false)
    }
  }, [loading, task, taskId, updateTaskOptimistic])

  if (!task || task.status !== 'created') return null

  return (
    <Button size="sm" onClick={handleTake} disabled={loading}>
      {loading ? '...' : 'Взять'}
    </Button>
  )
})

export default TakeButton
