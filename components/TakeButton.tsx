'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TakeButton({ taskId }: { taskId: string }) {
  const handleTake = async () => {
    const { data } = await supabase.auth.getUser()

    const name =
      data.user?.user_metadata?.name ||
      data.user?.email ||
      'Сотрудник'

    await supabase
      .from('tasks')
      .update({
        status: 'taken',
        assigned_to: name,
      })
      .eq('id', taskId)

    location.reload()
  }

  return <Button size="sm" onClick={handleTake}>Взять</Button>
}
