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

  // 📎 файл
  const [file, setFile] = useState<File | null>(null)
  const [fileLoading, setFileLoading] = useState(false)

  // PAYMENT
  const [items, setItems] = useState<any[]>([
    { text: '', invoice: null, loading: false },
  ])

  const updateItem = (index: number, field: string, value: any) => {
    const copy = [...items]
    copy[index][field] = value
    setItems(copy)
  }

  const addItem = () => {
    setItems([...items, { text: '', invoice: null, loading: false }])
  }

  const resetForm = () => {
    setComment('')
    setPriority('low')
    setBulkText('')
    setFile(null)
    setItems([{ text: '', invoice: null, loading: false }])
  }

  const handleCreate = async () => {
    // ===== ОФОРМЛЕНИЕ / ПАСПОРТА =====
    if (type === 'registration' || type === 'passport') {
      const lines = bulkText.split('\n').filter(Boolean)

      let filePath = null

      if (file) {
        setFileLoading(true)

        const fileName = Date.now() + '_' + file.name.replace(/\s/g, '_')

        const { error } = await supabase.storage
          .from('files')
          .upload('docs/' + fileName, file)

        if (!error) filePath = fileName

        setFileLoading(false)
      }

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
          file: filePath,
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

          if (!error) filePath = fileName

          updateItem(i, 'loading', false)
        }

        await supabase.from('task_items').insert({
          task_id: task.id,
          body_number: body,
          client_name: name,
          invoice_file: filePath,
        })
      }
    }

    // ✅ ЗАКРЫВАЕМ + СБРАСЫВАЕМ
    resetForm()
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать</Button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl w-[520px] space-y-4">

            {/* ТИП */}
            <div className="flex gap-2">
              {[
                { key: 'registration', label: 'Оформление' },
                { key: 'payment', label: 'Оплата' },
                { key: 'passport', label: 'Паспорта' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setType(btn.key as any)}
                  className={
                    'px-3 py-1.5 text-sm rounded-full border ' +
                    (type === btn.key ? 'bg-black text-white' : 'bg-white')
                  }
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* ===== ОФОРМЛЕНИЕ / ПАСПОРТА ===== */}
            {(type === 'registration' || type === 'passport') && (
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <label className="text-[#0131FF] text-sm cursor-pointer">
                  📤 Загрузить файл
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                {fileLoading && (
                  <div className="text-xs text-gray-400">
                    Загрузка файла...
                  </div>
                )}

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
                      <div className="text-xs text-gray-400">
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreate}>Создать</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
