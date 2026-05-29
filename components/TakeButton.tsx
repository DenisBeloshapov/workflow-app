'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function TakeButton({ task, updateTaskLocal }: any) {
  const [loading, setLoading] = useState(false)

  const handleTake = async () => {
    if (loading) return
    setLoading(true)

    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      alert('Ошибка пользователя')
      setLoading(false)
      return
    }

    // ✅ берем имя из metadata
    const name =
      data.user.user_metadata?.name?.trim() ||
      data.user.user_metadata?.full_name?.trim() ||
      'Без имени'

    // 🔄 база - с проверкой текущего статуса (ATOMIC OPERATION)
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', task.id)
      .eq('status', 'created') // ✅ КРИТИЧНО: проверяем, что задача еще не взята!
      .select()
      .single()

    if (updateError) {
      console.error('TAKE ERROR:', updateError)
      alert('Ошибка обновления задачи')
      setLoading(false)
      return
    }

    // ❌ Если updated null - значит кто-то другой уже взял задачу
    if (!updated) {
      alert('Эта задача уже кем-то взята!')
      // Перезагружаем, чтобы увидеть актуальное состояние
      window.location.reload()
      setLoading(false)
      return
    }

    // ✅ мгновенный UI (только если обновление прошло успешно)
    updateTaskLocal(task.id, {
      status: 'taken',
      assigned_to: name,
    })

    setLoading(false)
  }

  return (
    <Button size="sm" onClick={handleTake} disabled={loading}>
      {loading ? '...' : 'Взять'}
    </Button>
  )
}
