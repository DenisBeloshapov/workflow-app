'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function MoveButton({
  task,
  status,
  label,
  updateTaskLocal,
}: any) {
  const [loading, setLoading] = useState(false)

  const handleMove = async () => {
    if (loading) return
    setLoading(true)

    // ⚡ мгновенно
    updateTaskLocal(task.id, { status })

    // 🔄 база
    await supabase
      .from('tasks')
      .update({ status })
      .eq('id', task.id)

    setLoading(false)
  }

  return (
    <Button size="sm" onClick={handleMove} disabled={loading}>
      {loading ? '...' : label}
    </Button>
  )
}
