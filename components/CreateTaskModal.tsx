'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'registration' | 'payment' | 'passport'>('registration')

  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')
  const [bulkText, setBulkText] = useState('')

  const [items, setItems] = useState([
    { text: '', invoice: null as File | null, loading: false },
  ])

  const updateItem = (i: number, field: string, value: any) => {
    const copy = [...items]
    copy[i][field] = value
    setItems(copy)
  }

  const addItem = () => {
    setItems([...items, { text: '', invoice: null, loading: false }])
  }

  const handleCreate = async () => {
    // ===== ОФОРМЛЕНИЕ / ПАСПОРТА =====
    if (type !== 'payment') {
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
          type,
        })
      }

      setOpen(false)
      return
    }

    // ===== ОПЛАТА =====
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        type: 'payment',
        comment,
        status: 'created',
      })
      .select()
      .single()

    if (!task) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.text) continue

      const [body, ...nameParts] = item.text.trim().split(' ')
      const name = nameParts.join(' ')

      let filePath = null

      if (item.invoice) {
        const fileName = Date.now() + '_' + item.invoice.name.replace(/\s/g, '_')

        await supabase.storage
          .from('files')
          .upload('invoices/' + fileName, item.invoice)

        filePath = fileName
      }

      await supabase.from('task_items').insert({
        task_id: task.id,
        body_number: body,
        client_name: name,
        invoice_file: filePath,
      })
    }

    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать</Button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white p-5 rounded-xl w-[520px] space-y-4">

            {/* переключатель */}
            <div className="flex gap-2">
              {[
                { key: 'registration', label: 'Оформление' },
                { key: 'payment', label: 'Оплата' },
                { key: 'passport', label: 'Паспорта' },
              ].map((b) => (
                <button
                  key={b.key}
                  onClick={() => setType(b.key as any)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    type === b.key
                      ? 'bg-black text-white'
                      : 'bg-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* оформление / паспорта */}
            {type !== 'payment' && (
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

                <div className="flex gap-3">
                  {['high', 'medium', 'low'].map((p) => (
                    <label key={p}>
                      <input
                        type="radio"
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                      /> {p}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* ===== ОПЛАТА ===== */}
            {type === 'payment' && (
              <>
                {items.map((item, i) => (
                  <div key={i} className="border p-3 rounded space-y-2">

                    <input
                      placeholder="WB1234 Иванов Иван"
                      className="w-full border p-2 rounded"
                      value={item.text}
                      onChange={(e) =>
                        updateItem(i, 'text', e.target.value)
                      }
                    />

                    <label className="text-[#0131FF] text-sm cursor-pointer">
                      📤 Загрузить счет
                      <input
                        type="file"
                        hidden
                        onChange={(e) =>
                          updateItem(i, 'invoice', e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                ))}

                <button
                  onClick={addItem}
                  className="text-[#0131FF] text-sm"
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
      )}
    </>
  )
}
