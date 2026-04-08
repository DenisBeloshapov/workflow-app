'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'registration' | 'payment' | 'passport'>('registration')

  const [loading, setLoading] = useState(false)

  // ОБЩЕЕ
  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')

  // REGISTRATION / PASSPORT
  const [bulkText, setBulkText] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // PAYMENT
  const [paymentText, setPaymentText] = useState('')
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  const handleCreate = async () => {
    setLoading(true)

    // ===== ОФОРМЛЕНИЕ / ПАСПОРТА =====
    if (type === 'registration' || type === 'passport') {
      let filePath = null

      if (file) {
        const fileName = Date.now() + '_' + file.name.replace(/\s/g, '_')

        await supabase.storage
          .from('files')
          .upload('tasks/' + fileName, file)

        filePath = fileName
      }

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
          file_url: filePath,
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

      let filePath = null

      if (invoiceFile) {
        const fileName =
          Date.now() + '_' + invoiceFile.name.replace(/\s/g, '_')

        await supabase.storage
          .from('files')
          .upload('invoices/' + fileName, invoiceFile)

        filePath = fileName
      }

      const lines = paymentText.split('\n').filter(Boolean)

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

    setLoading(false)
    location.reload()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать</Button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-[520px] space-y-4">

            {/* ВЫБОР ОТДЕЛА */}
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
                    'px-3 py-1.5 text-sm rounded-full border transition ' +
                    (type === btn.key
                      ? 'bg-black text-white'
                      : 'bg-white dark:bg-zinc-800 text-black dark:text-white')
                  }
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* ===== ОФОРМЛЕНИЕ ===== */}
            {(type === 'registration' || type === 'passport') && (
              <>
                <textarea
                  placeholder="WB1234 Иванов Иван"
                  className="w-full border p-2 rounded bg-white text-black"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />

                <label className="text-[#0131FF] text-sm cursor-pointer">
                  📤 Загрузить файл
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      setFile(e.target.files?.[0] || null)
                    }
                  />
                </label>

                <textarea
                  placeholder="Комментарий"
                  className="w-full border p-2 rounded"
                  onChange={(e) => setComment(e.target.value)}
                />

                <div className="flex gap-3 text-sm">
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
                <textarea
                  placeholder="WB1234 Иванов Иван"
                  className="w-full border p-2 rounded"
                  value={paymentText}
                  onChange={(e) => setPaymentText(e.target.value)}
                />

                <label className="text-[#0131FF] text-sm cursor-pointer">
                  📤 Загрузить счет
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      setInvoiceFile(e.target.files?.[0] || null)
                    }
                  />
                </label>

                <textarea
                  placeholder="Комментарий"
                  className="w-full border p-2 rounded"
                  onChange={(e) => setComment(e.target.value)}
                />
              </>
            )}

            {/* КНОПКИ */}
            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>

              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Создание...' : 'Создать'}
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
