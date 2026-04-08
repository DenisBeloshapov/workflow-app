'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TakeButton({
  task,
  updateTaskLocal,
}: {
  task: any
  updateTaskLocal: (id: string, updates: any) => void
}) {
  const handleTake = async () => {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      alert('Не авторизован')
      return
    }

    // 🔑 ВАЖНО: возвращаем твою старую логику имени
    const name =
      data.user.user_metadata?.name

    // ⚡ мгновенный UI
    updateTaskLocal(task.id, {
      status: 'taken',
      assigned_to: name,
    })

    // 💾 запись в базу
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', task.id)

    if (updateError) {
      alert('Ошибка при взятии задачи')
      console.log(updateError)
    }
  }

  return (
    <Button size="sm" onClick={handleTake}>
      Взять
    </Button>
  )
}
