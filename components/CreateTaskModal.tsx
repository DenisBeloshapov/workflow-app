'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string | null>('registration')

  // ОБЩЕЕ
  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')

  // REGISTRATION
  const [bulkText, setBulkText] = useState('')

  // PAYMENT
  const [items, setItems] = useState<any[]>([
    { body: '', name: '', invoice: null },
  ])

  const updateItem = (index: number, field: string, value: any) => {
    const copy = [...items]
    copy[index][field] = value
    setItems(copy)
  }

  const addItem = () => {
    setItems([...items, { body: '', name: '', invoice: null }])
  }

  const handleCreate = async () => {
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        type,
        comment,
        priority,
        status: 'created',
      })
      .select()
      .single()

    if (!task) return

    // ===== REGISTRATION =====
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

    // ===== PAYMENT =====
    if (type === 'payment') {
      for (const item of items) {
        let filePath = null

        if (item.invoice) {
          const fileName =
            Date.now() + '_' + item.invoice.name.replace(/\s/g, '_')

          await supabase.storage
            .from('files')
            .upload('invoices/' + fileName, item.invoice)

          filePath = fileName
        }

        await supabase.from('task_items').insert({
          task_id: task.id,
          body_number: item.body,
          client_name: item.name,
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
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl w-[520px] space-y-4">

            {/* ===== ВЫБОР ТИПА (НОВЫЙ UI) ===== */}
            <div className="flex gap-2">
              {[
                { key: 'registration', label: 'Оформление' },
                { key: 'payment', label: 'Оплата' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setType(btn.key)}
                  className={
                    'px-3 py-1.5 text-sm rounded-full border transition ' +
                    (type === btn.key
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-200 text-black')
                  }
                >
                  {btn.label}
                </button>
              ))}
            </div>

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

                <div className="flex gap-3">
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

            {/* ===== ОПЛАТА ===== */}
            {type === 'payment' && (
              <>
                {items.map((item, i) => (
                  <div key={i} className="space-y-2 border p-3 rounded">

                    <input
                      placeholder="Кузов"
                      className="w-full border p-1 rounded"
                      onChange={(e) =>
                        updateItem(i, 'body', e.target.value)
                      }
                    />

                    <input
                      placeholder="ФИО"
                      className="w-full border p-1 rounded"
                      onChange={(e) =>
                        updateItem(i, 'name', e.target.value)
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

            {/* КНОПКИ */}
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
