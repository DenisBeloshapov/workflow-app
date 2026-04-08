'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TakeButton({ taskId }: { taskId: string }) {
  const handleTake = async () => {
    const { data, error: userError } = await supabase.auth.getUser()

    if (userError || !data.user) {
      alert('Не авторизован')
      return
    }

    const name =
      data.user.user_metadata?.full_name || data.user.email

    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', taskId)

    if (error) {
      alert('Ошибка при взятии задачи')
      console.log(error)
      return
    }
  }

  return (
    <Button size="sm" onClick={handleTake}>
      Взять
    </Button>
  )
}
