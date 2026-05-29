'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function MoveButton({
  task,
  status,
  label,
  updateTaskLocal,
}: any) {
  const [loading, setLoading] = useState(false)

  const handleMove = async () => {
    if (loading) return
    setLoading(true)

    try {
      // 🔄 база - с проверкой текущего статуса (ATOMIC OPERATION)
      const { data: updated, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', task.id)
        .eq('status', task.status) // ✅ Проверяем, что статус не изменился кем-то другим
        .select()
        .single()

      if (error) {
        console.error('MOVE ERROR:', error)
        alert('Ошибка обновления задачи')
        setLoading(false)
        return
      }

      // ❌ Если updated null - значит статус уже изменился
      if (!updated) {
        alert('Статус задачи был изменен другим пользователем. Перезагружаю...')
        window.location.reload()
        setLoading(false)
        return
      }

      // ✅ мгновенно (только если обновление успешно)
      updateTaskLocal(task.id, { status })
    } catch (err) {
      console.error('UNEXPECTED ERROR:', err)
      alert('Неожиданная ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={handleMove} disabled={loading}>
      {loading ? '...' : label}
    </Button>
  )
}
