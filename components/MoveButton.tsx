'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function MoveButton({
  taskId,
  status,
  label,
}: {
  taskId: string
  status: string
  label: string
}) {
  const handleMove = async () => {
    await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    location.reload()
  }

  return (
    <Button size="sm" onClick={handleMove}>
      {label}
    </Button>
  )
}