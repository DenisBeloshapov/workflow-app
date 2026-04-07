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

  // PAYMENT
  const [clients, setClients] = useState([
    { text: '', file: null as File | null },
  ])

  const updateClient = (index: number, field: string, value: any) => {
    const updated = [...clients]
    updated[index][field] = value
    setClients(updated)
  }

  const addClient = () => {
    setClients([...clients, { text: '', file: null }])
  }

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

    // ===== ОПЛАТА =====
    if (type === 'payment') {
      const { data: task } = await supabase
        .from('tasks')
        .insert({
          comment,
          status: 'created',
          type: 'payment',
        })
        .select()
        .single()

      if (!task) return

      for (const c of clients) {
        if (!c.text) continue

        const [body, ...nameParts] = c.text.trim().split(' ')
        const name = nameParts.join(' ')

        let filePath = null

        if (c.file) {
          const fileName =
            Date.now() + '_' + c.file.name.replace(/\s/g, '_')

          await supabase.storage
            .from('files')
            .upload('invoices/' + fileName, c.file)

          filePath = fileName
        }

        await supabase.from('task_items').insert({
          task_id: task.id,
          body_number: body,
          client_name: name,
          invoice_file: filePath,
        })
      }
    }

    location.reload()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать</Button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <div className="relative w-[580px]">

            {/* КРЕСТИК */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-50"
            >
              <X size={18} />
            </button>

            {/* ===== ВКЛАДКИ ===== */}
            <div className="relative h-[48px]">

              {/* ОФОРМЛЕНИЕ */}
              <div
                onClick={() => setType('registration')}
                className={`
                  absolute left-0 px-5 py-1 text-sm cursor-pointer border
                  ${type === 'registration'
                    ? 'top-0 bg-white z-20'
                    : 'top-2 bg-gray-200 z-10'}
                `}
                style={{
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  clipPath:
                    'polygon(0% 100%, 0% 30%, 10% 0%, 90% 0%, 100% 30%, 100% 100%)',
                }}
              >
                Оформление
              </div>

              {/* ОПЛАТА */}
              <div
                onClick={() => setType('payment')}
                className={`
                  absolute left-[160px] px-5 py-1 text-sm cursor-pointer border
                  ${type === 'payment'
                    ? 'top-0 bg-white z-20'
                    : 'top-2 bg-gray-200 z-10'}
                `}
                style={{
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  clipPath:
                    'polygon(0% 100%, 0% 30%, 10% 0%, 90% 0%, 100% 30%, 100% 100%)',
                }}
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
                  {clients.map((c, i) => (
                    <div key={i} className="space-y-2 border p-3 rounded-lg">
                      <input
                        placeholder="WB1234 Иванов Иван"
                        className="w-full border p-2 rounded"
                        value={c.text}
                        onChange={(e) =>
                          updateClient(i, 'text', e.target.value)
                        }
                      />

                      <input
                        type="file"
                        onChange={(e) =>
                          updateClient(i, 'file', e.target.files?.[0] || null)
                        }
                      />
                    </div>
                  ))}

                  <button
                    onClick={addClient}
                    className="text-sm text-[#0131FF]"
                  >
                    + Добавить
                  </button>

                  <textarea
                    placeholder="Комментарий"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setComment(e.target.value)}
                  />
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
