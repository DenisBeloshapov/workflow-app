'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'registration' | 'payment' | 'passport'>('registration')

  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')

  // ===== REGISTRATION / PASSPORT =====
  const [bulkText, setBulkText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // ===== PAYMENT =====
  const [paymentText, setPaymentText] = useState('')
  const [paymentFiles, setPaymentFiles] = useState<{ [key: number]: File | null }>({})
  const [uploadingMap, setUploadingMap] = useState<{ [key: number]: boolean }>({})

  const handleCreate = async () => {
    // ===== REGISTRATION / PASSPORT =====
    if (type === 'registration' || type === 'passport') {
      const lines = bulkText.split('\n').filter(Boolean)

      let filePath = null

      if (file) {
        setUploading(true)

        const fileName = Date.now() + '_' + file.name.replace(/\s/g, '_')

        await supabase.storage
          .from('files')
          .upload(`tasks/${fileName}`, file)

        filePath = fileName
        setUploading(false)
      }

      for (const line of lines) {
        const [body, ...nameParts] = line.trim().split(' ')
        const name = nameParts.join(' ')

        await supabase.from('tasks').insert({
          body_number: body,
          client_name: name,
          comment,
          priority,
          file_url: filePath,
          status: 'created',
          type,
        })
      }
    }

    // ===== PAYMENT =====
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

      const lines = paymentText.split('\n').filter(Boolean)

      let index = 0
      for (const line of lines) {
        const [body, ...nameParts] = line.trim().split(' ')
        const name = nameParts.join(' ')

        let filePath = null

        const file = paymentFiles[index]

        if (file) {
          setUploadingMap((prev) => ({ ...prev, [index]: true }))

          const fileName = Date.now() + '_' + file.name.replace(/\s/g, '_')

          await supabase.storage
            .from('files')
            .upload(`invoices/${fileName}`, file)

          filePath = fileName

          setUploadingMap((prev) => ({ ...prev, [index]: false }))
        }

        await supabase.from('task_items').insert({
          task_id: task.id,
          body_number: body,
          client_name: name,
          invoice_file: filePath,
        })

        index++
      }
    }

    location.reload()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать задачу</Button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-[520px] space-y-4">

            {/* ВЫБОР */}
            <div className="flex gap-2">
              {[
                { key: 'registration', label: 'Оформление' },
                { key: 'passport', label: 'Паспорта' },
                { key: 'payment', label: 'Оплата' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key as any)}
                  className={`px-3 py-1.5 text-sm rounded-full border ${
                    type === t.key
                      ? 'bg-black text-white'
                      : 'bg-white dark:bg-zinc-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ===== REGISTRATION / PASSPORT ===== */}
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
                  onChange={(e) => setComment(e.target.value)}
                />

                {/* ФАЙЛ */}
                <label className="text-[#0131FF] text-sm cursor-pointer">
                  📤 Загрузить файл
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                {uploading && (
                  <div className="text-xs text-gray-400">Загрузка...</div>
                )}

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

            {/* ===== PAYMENT ===== */}
            {type === 'payment' && (
              <>
                <textarea
                  placeholder="WB1234 Иванов Иван"
                  className="w-full border p-2 rounded"
                  value={paymentText}
                  onChange={(e) => setPaymentText(e.target.value)}
                />

                {paymentText.split('\n').filter(Boolean).map((_, i) => (
                  <div key={i}>
                    <label className="text-[#0131FF] text-sm cursor-pointer">
                      📤 Счет #{i + 1}
                      <input
                        type="file"
                        hidden
                        onChange={(e) =>
                          setPaymentFiles((prev) => ({
                            ...prev,
                            [i]: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>

                    {uploadingMap[i] && (
                      <div className="text-xs text-gray-400">
                        Загрузка...
                      </div>
                    )}
                  </div>
                ))}

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
