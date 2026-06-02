'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useOptimisticUpdate } from '@/lib/realtime-sync'
import { useTasksStore } from '@/lib/store'

interface ReturnButtonProps {
  taskId: string
}

export default function ReturnButton({ taskId }: ReturnButtonProps) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { updateTaskOptimistic } = useOptimisticUpdate()
  const task = useTasksStore((state) => state.getTask(taskId))

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleReturn = useCallback(async () => {
    if (loading || !task) return
    setLoading(true)

    try {
      // ✅ Optimistic update
      await updateTaskOptimistic(
        taskId,
        { status: 'taken', return_comment: comment },
        async () => {
          const { data: updated, error } = await supabase
            .from('tasks')
            .update({
              status: 'taken',
              return_comment: comment,
            })
            .eq('id', taskId)
            .eq('status', 'done')
            .select()
            .single()

          if (error || !updated) {
            alert('Статус задачи был изменен другим пользователем')
            throw error || new Error('Status changed by another user')
          }
        }
      )

      setOpen(false)
      setComment('')
    } catch (err) {
      console.error('RETURN ERROR:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, task, taskId, comment, updateTaskOptimistic])

  if (!task || task.status !== 'done') return null

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Вернуть
      </Button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl w-[400px] space-y-4">
              <div className="font-medium text-sm">Причина возврата</div>

              <textarea
                className="w-full border p-2 rounded text-sm"
                placeholder="Введите причину..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Отмена
                </Button>

                <Button onClick={handleReturn} disabled={loading}>
                  {loading ? '...' : 'Вернуть'}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
