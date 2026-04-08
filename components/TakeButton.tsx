'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function TakeButton({ task, updateTaskLocal }: any) {
  const [loading, setLoading] = useState(false)

  const handleTake = async () => {
    if (loading) return
    setLoading(true)

    const { data } = await supabase.auth.getUser()
    const name = data.user?.user_metadata?.name || 'Сотрудник'

    // ⚡ мгновенно обновляем UI
    updateTaskLocal(task.id, {
      status: 'taken',
      assigned_to: name,
    })

    // 🔄 отправка в базу
    await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', task.id)

    setLoading(false)
  }

  return (
    <Button size="sm" onClick={handleTake} disabled={loading}>
      {loading ? '...' : 'Взять'}
    </Button>
  )
}
