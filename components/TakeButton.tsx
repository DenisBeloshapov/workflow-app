'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { getUserName } from '@/lib/getUserName'

export default function TakeButton({
  task,
  updateTaskLocal,
}: {
  task: any
  updateTaskLocal: (id: string, updates: any) => void
}) {
  const handleTake = async () => {
    const { data } = await supabase.auth.getUser()

    const name = getUserName(data.user)

    updateTaskLocal(task.id, {
      status: 'taken',
      assigned_to: name,
    })

    await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', task.id)
  }

  return <Button size="sm" onClick={handleTake}>Взять</Button>
}
