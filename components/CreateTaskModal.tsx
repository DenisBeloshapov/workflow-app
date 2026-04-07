'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string | null>(null)

  // ОБЩЕЕ
  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')

  // REGISTRATION
  const [bulkText, setBulkText] = useState('')

  // PAYMENT
  const [paymentList, setPaymentList] = useState('')
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  const handleCreate = async () => {
    // создаем задачу
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
      let filePath = null

      if (invoiceFile) {
        const fileName =
          Date.now() + '_' + invoiceFile.name.replace(/\s/g, '_')

        await supabase.storage
          .from('files')
          .upload('invoices/' + fileName, invoiceFile)

        filePath = fileName
      }

      const lines = paymentList.split('\n').filter(Boolean)

      for (const line of lines) {
        const [body, ...nameParts] = line.trim().split(' ')
        const name = nameParts.join(' ')

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
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl w-[500px] space-y-4">

            {/* ВЫБОР ТИПА */}
            {!type && (
              <div className="flex gap-4">
                {[
                  { key: 'payment', label: 'Оплата' },
                  { key: 'registration', label: 'Оформление' },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setType(item.key)}
                    className="relative cursor-pointer"
                  >
                    <div className="absolute -top-2 left-3 bg-white px-2 text-xs border rounded-t-md">
                      {item.label}
                    </div>

                    <div className="w-36 h-24 bg-gray-100 border rounded-xl flex items-center justify-center hover:bg-gray-200 transition">
                      📁
                    </div>
                  </div>
                ))}
              </div>
            )}

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
    <div className="text-sm text-gray-500">
      Список физиков будет добавлен внутри задачи
    </div>

    <textarea
      placeholder="Комментарий"
      className="w-full border p-2 rounded"
      onChange={(e) => setComment(e.target.value)}
    />
  </>
)}

            {/* КНОПКИ */}
            {type && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Отмена
                </Button>

                <Button onClick={handleCreate}>
                  Создать
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
