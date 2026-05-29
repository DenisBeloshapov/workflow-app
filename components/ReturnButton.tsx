'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ReturnButton({ task, updateTaskLocal }: any) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleReturn = async () => {
    if (loading) return
    setLoading(true)

    try {
      // 🔄 база - с проверкой статуса (ATOMIC OPERATION)
      const { data: updated, error } = await supabase
        .from('tasks')
        .update({
          status: 'taken',
          return_comment: comment,
        })
        .eq('id', task.id)
        .eq('status', 'done') // ✅ Проверяем, что задача в статусе 'done'
        .select()
        .single()

      if (error) {
        console.error('RETURN ERROR:', error)
        alert('Ошибка обновления задачи')
        setLoading(false)
        return
      }

      // ❌ Если updated null - статус уже изменился
      if (!updated) {
        alert('Статус задачи был изменен другим пользователем. Перезагружаю...')
        window.location.reload()
        setLoading(false)
        return
      }

      // ✅ локально сразу (после успешного обновления)
      updateTaskLocal(task.id, {
        status: 'taken',
        return_comment: comment,
      })

      setLoading(false)
      setOpen(false)
      setComment('')
    } catch (err) {
      console.error('UNEXPECTED ERROR:', err)
      alert('Неожиданная ошибка')
      setLoading(false)
    }
  }

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

              <div className="font-medium text-sm">
                Причина возврата
              </div>

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
