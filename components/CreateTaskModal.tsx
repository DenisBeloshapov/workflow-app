'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type Item = {
  text: string
  invoice: File | null
  loading: boolean
}

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'registration' | 'payment' | 'passport'>('registration')

  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')
  const [bulkText, setBulkText] = useState('')

  const [items, setItems] = useState<Item[]>([
    { text: '', invoice: null, loading: false },
  ])

  const updateItem = (
    index: number,
    field: 'text' | 'invoice' | 'loading',
    value: string | File | null | boolean
  ) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        [field]: value,
      }
      return copy
    })
  }

  const addItem = () => {
    setItems((prev) => [...prev, { text: '', invoice: null, loading: false }])
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
        updateItem(i, 'loading', true)

        const fileName =
          Date.now() + '_' + item.invoice.name.replace(/\s/g, '_')

        const { error } = await supabase.storage
          .from('files')
          .upload('invoices/' + fileName, item.invoice)

        updateItem(i, 'loading', false)

        if (!error) {
          filePath = fileName
        }
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

            {/* ФИЛЬТРЫ */}
            <div className="flex gap-2">
              {[
                { key: 'registration', label: 'Оформление' },
                { key: 'payment', label: 'Оплата' },
                { key: 'passport', label: 'Паспорта' },
              ].map((b) => (
                <button
                  key={b.key}
                  onClick={() => setType(b.key as any)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition ${
                    type === b.key
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* ===== ОФОРМЛЕНИЕ / ПАСПОРТА ===== */}
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
                  {[
                    { key: 'high', label: 'Срочно' },
                    { key: 'medium', label: 'Средняя' },
                    { key: 'low', label: 'Низкая' },
                  ].map((p) => (
                    <label key={p.key}>
                      <input
                        type="radio"
                        checked={priority === p.key}
                        onChange={() => setPriority(p.key)}
                      />{' '}
                      {p.label}
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
                          updateItem(
                            i,
                            'invoice',
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </label>

                    {item.loading && (
                      <div className="text-xs text-gray-500">
                        Загрузка...
                      </div>
                    )}
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
