'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function ReturnButton({ task }: any) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')

  const handleReturn = async () => {
    await supabase
      .from('tasks')
      .update({
        status: 'created',
        comment: (task.comment || '') + '\n\nВозврат: ' + comment,
      })
      .eq('id', task.id)

    location.reload()
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Вернуть
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl w-[300px] space-y-3">
            <textarea
              placeholder="Причина возврата"
              className="w-full border p-2 rounded"
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex justify-between">
              <Button onClick={() => setOpen(false)}>Отмена</Button>
              <Button onClick={handleReturn}>Отправить</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
