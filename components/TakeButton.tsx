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

    // ⚡ мгновенный UI
    updateTaskLocal(task.id, {
      status: 'taken',
      assigned_to: name,
    })

    // 🔄 база
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', task.id)

    if (updateError) {
      console.error(updateError)
      alert('Ошибка обновления задачи')
    }

    setLoading(false)
  }

  return (
    <Button size="sm" onClick={handleTake} disabled={loading}>
      {loading ? '...' : 'Взять'}
    </Button>
  )
}
