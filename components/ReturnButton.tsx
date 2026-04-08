'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function ReturnButton({
  task,
  updateTaskLocal,
}: any) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleReturn = async () => {
    updateTaskLocal(task.id, {
      status: 'created',
      comment: (task.comment || '') + '\n\n🔁 Возврат: ' + reason,
      assigned_to: null,
    })

    await supabase
      .from('tasks')
      .update({
        status: 'created',
        comment: (task.comment || '') + '\n\n🔁 Возврат: ' + reason,
        assigned_to: null,
      })
      .eq('id', task.id)

    setOpen(false)
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Вернуть
      </Button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl w-[400px] space-y-3">

            <div className="text-sm font-medium">Причина возврата</div>

            <textarea
              className="w-full border p-2 rounded"
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>

              <Button onClick={handleReturn}>
                Подтвердить
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
