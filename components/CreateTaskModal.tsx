'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'registration' | 'payment'>('registration')

  // ОБЩЕЕ
  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')

  // REGISTRATION
  const [bulkText, setBulkText] = useState('')

  const handleCreate = async () => {
    // ===== ОФОРМЛЕНИЕ =====
    if (type === 'registration') {
      const lines = bulkText.split('\n').filter(Boolean)

      for (const line of lines) {
        const [body, ...nameParts] = line.trim().split(' ')
        const name = nameParts.join(' ')

        await supabase.from('tasks').insert({
          body_number: body,
          client_name: name,
          comment,
          priority,
          status: 'created',
          type: 'registration',
        })
      }
    }

    // ===== ОПЛАТА (возвращаем старую логику) =====
    if (type === 'payment') {
      await supabase.from('tasks').insert({
        comment,
        priority,
        status: 'created',
        type: 'payment',
      })
    }

    location.reload()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать</Button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <div className="relative w-[560px]">

            {/* КРЕСТИК */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-50"
            >
              <X size={18} />
            </button>

            {/* ===== ВКЛАДКИ (как папка) ===== */}
            <div className="relative h-[40px]">
              {/* ОФОРМЛЕНИЕ */}
              <div
                onClick={() => setType('registration')}
                className={`
                  absolute left-0 top-0 px-4 py-1 text-sm cursor-pointer
                  rounded-t-md border
                  ${type === 'registration' ? 'bg-white z-20' : 'bg-gray-200 z-10'}
                `}
              >
                Оформление
              </div>

              {/* ОПЛАТА */}
              <div
                onClick={() => setType('payment')}
                className={`
                  absolute left-[140px] top-0 px-4 py-1 text-sm cursor-pointer
                  rounded-t-md border
                  ${type === 'payment' ? 'bg-white z-20' : 'bg-gray-200 z-10'}
                `}
              >
                Оплата
              </div>
            </div>

            {/* ===== ОСНОВНАЯ ПАПКА ===== */}
            <div className="bg-white border rounded-b-xl rounded-tr-xl p-5 space-y-4">

              {/* ===== ОФОРМЛЕНИЕ ===== */}
              {type === 'registration' && (
                <>
                  <textarea
                    placeholder="WB1234 Иванов Иван"
                    className="w-full border p-2 rounded"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />

                  <textarea
                    placeholder="Комментарий"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setComment(e.target.value)}
                  />

                  <div className="flex gap-4 text-sm">
                    {[
                      { key: 'high', label: 'Срочно' },
                      { key: 'medium', label: 'Средняя' },
                      { key: 'low', label: 'Низкая' },
                    ].map((p) => (
                      <label key={p.key} className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={priority === p.key}
                          onChange={() => setPriority(p.key)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* ===== ОПЛАТА ===== */}
              {type === 'payment' && (
                <>
                  <div className="text-sm text-gray-500">
                    Физики добавляются внутри задачи
                  </div>

                  <textarea
                    placeholder="Комментарий"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setComment(e.target.value)}
                  />

                  <div className="flex gap-4 text-sm">
                    {[
                      { key: 'high', label: 'Срочно' },
                      { key: 'medium', label: 'Средняя' },
                      { key: 'low', label: 'Низкая' },
                    ].map((p) => (
                      <label key={p.key} className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={priority === p.key}
                          onChange={() => setPriority(p.key)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* КНОПКИ */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Отмена
                </Button>

                <Button onClick={handleCreate}>
                  Создать
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
