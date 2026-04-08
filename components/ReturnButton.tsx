'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function ReturnButton({ task, updateTaskLocal }: any) {
  const handleReturn = async () => {
    updateTaskLocal(task.id, { status: 'taken' })

    await supabase
      .from('tasks')
      .update({ status: 'taken' })
      .eq('id', task.id)
  }

  return (
    <Button size="sm" variant="outline" onClick={handleReturn}>
      Вернуть
    </Button>
  )
}
