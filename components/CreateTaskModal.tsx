'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type Client = {
  text: string
  file: File | null
}

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'registration' | 'payment'>('registration')

  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')

  const [bulkText, setBulkText] = useState('')

  const [clients, setClients] = useState<Client[]>([
    { text: '', file: null },
  ])

  const updateClient = (
    index: number,
    field: 'text' | 'file',
    value: string | File | null
  ) => {
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

        let filePath: string | null = null

        if (c.file) {
          const fileName =
            Date.now() + '_' + c.file.name.replace(/\s/g, '_')

          const { error } = await supabase.storage
            .from('files')
            .upload('invoices/' + fileName, c.file, {
              upsert: true,
            })

          if (!error) filePath = fileName
        }

        await supabase.from('task_items').insert({
          task_id: task.id,
          body_number: body,
          client_name: name,
          invoice_file: filePath,
          is_paid: false,
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

            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-50"
            >
              <X size={18} />
            </button>

            {/* ВКЛАДКИ */}
            <div className="relative h-[48px]">
              {[
                { key: 'registration', label: 'Оформление' },
                { key: 'payment', label: 'Оплата' },
              ].map((tab, i) => (
                <div
                  key={tab.key}
                  onClick={() => setType(tab.key as any)}
                  className={`
                    absolute px-5 py-1 text-sm border cursor-pointer
                    ${type === tab.key ? 'top-0 bg-white z-20' : 'top-2 bg-gray-200 z-10'}
                  `}
                  style={{
                    left: i * 160,
                    clipPath:
                      'polygon(0% 100%, 0% 30%, 10% 0%, 90% 0%, 100% 30%, 100% 100%)',
                  }}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {/* ОСНОВА */}
            <div className="bg-white border rounded-b-xl rounded-tr-xl p-5 space-y-4">

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
                    {['high', 'medium', 'low'].map((p) => (
                      <label key={p}>
                        <input
                          type="radio"
                          checked={priority === p}
                          onChange={() => setPriority(p)}
                        />{' '}
                        {p}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {type === 'payment' && (
                <>
                  {clients.map((c, i) => (
                    <div key={i} className="border p-3 rounded-lg space-y-2">
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

              <div className="flex justify-between">
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
