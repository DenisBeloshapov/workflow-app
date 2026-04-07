'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'payment' | 'registration'>('registration')

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
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <div className="relative w-[560px]">

            {/* ❌ КРЕСТИК */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-50"
            >
              <X size={18} />
            </button>

            {/* ===== ВКЛАДКИ (ПАПКИ) ===== */}
            <div className="relative h-[50px]">

              {/* ОФОРМЛЕНИЕ */}
              <div
                onClick={() => setType('registration')}
                className={`
                  absolute left-0 px-6 py-1 text-sm border
                  ${type === 'registration'
                    ? 'top-0 bg-white z-20'
                    : 'top-2 bg-gray-200 z-10'}
                `}
                style={{
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                  clipPath:
                    'polygon(0% 100%, 0% 35%, 12% 0%, 88% 0%, 100% 35%, 100% 100%)',
                }}
              >
                Оформление
              </div>

              {/* ОПЛАТА */}
              <div
                onClick={() => setType('payment')}
                className={`
                  absolute left-[170px] px-6 py-1 text-sm border
                  ${type === 'payment'
                    ? 'top-0 bg-white z-20'
                    : 'top-2 bg-gray-200 z-10'}
                `}
                style={{
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                  clipPath:
                    'polygon(0% 100%, 0% 35%, 12% 0%, 88% 0%, 100% 35%, 100% 100%)',
                }}
              >
                Оплата
              </div>
            </div>

            {/* ===== ОСНОВНАЯ ПАНЕЛЬ ===== */}
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
