'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TakeButton({
  task,
  updateTaskLocal,
}: {
  task: any
  updateTaskLocal: (taskId: string, updates: any) => void
}) {
  const handleTake = async () => {
    const { data } = await supabase.auth.getUser()

    const name =
      data.user?.user_metadata?.name ||
      data.user?.email ||
      'Сотрудник'

    // ⚡ МГНОВЕННЫЙ UI
    updateTaskLocal(task.id, {
      status: 'taken',
      assigned_to: name,
    })

    // 💾 запись в БД
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', task.id)

    if (error) {
      alert('Ошибка')
      console.log(error)
    }
  }

  return (
    <Button size="sm" onClick={handleTake}>
      Взять
    </Button>
  )
}
