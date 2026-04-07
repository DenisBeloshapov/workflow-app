'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaymentItems({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase
      .from('task_items')
      .select('*')
      .eq('task_id', taskId)

    setItems(data || [])
  }

  const uploadFile = async (
    id: string,
    file: File,
    type: 'invoice' | 'check'
  ) => {
    setLoadingId(id)

    const fileName = Date.now() + '_' + file.name

    const path =
      type === 'invoice' ? 'invoices/' : 'checks/'

    await supabase.storage
      .from('files')
      .upload(path + fileName, file)

    await supabase
      .from('task_items')
      .update({
        ...(type === 'invoice'
          ? { invoice_file: fileName }
          : { payment_file: fileName, is_paid: true }),
      })
      .eq('id', id)

    setLoadingId(null)
    fetchItems()
  }

  const addItem = async () => {
    await supabase.from('task_items').insert({
      task_id: taskId,
      body_number: '',
      client_name: '',
    })

    fetchItems()
  }

  const updateField = async (
    id: string,
    field: string,
    value: string
  ) => {
    await supabase
      .from('task_items')
      .update({ [field]: value })
      .eq('id', id)
  }

  const getUrl = (folder: string, file: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${folder}/${file}`

  return (
    <div className="mt-3 space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-gray-100 dark:bg-zinc-700 p-3 rounded-lg space-y-2"
        >
          {/* кузов + фио */}
          <input
            placeholder="Кузов ФИО"
            defaultValue={`${item.body_number} ${item.client_name}`}
            onBlur={(e) => {
              const [body, ...nameParts] =
                e.target.value.split(' ')
              updateField(item.id, 'body_number', body)
              updateField(item.id, 'client_name', nameParts.join(' '))
            }}
            className="w-full p-1 rounded border text-sm"
          />

          {/* счет */}
          <div className="flex gap-3 items-center text-xs">
            <label className="text-[#0131FF] cursor-pointer">
              📤 Загрузить счет
              <input
                type="file"
                hidden
                onChange={(e) =>
                  e.target.files &&
                  uploadFile(item.id, e.target.files[0], 'invoice')
                }
              />
            </label>

            {item.invoice_file && (
              <a
                href={getUrl('invoices', item.invoice_file)}
                target="_blank"
                className="text-[#0131FF]"
              >
                Скачать счет
              </a>
            )}
          </div>

          {/* чек */}
          <div className="flex gap-3 items-center text-xs">
            <label className="text-[#0131FF] cursor-pointer">
              📤 Загрузить чек
              <input
                type="file"
                hidden
                onChange={(e) =>
                  e.target.files &&
                  uploadFile(item.id, e.target.files[0], 'check')
                }
              />
            </label>

            {item.payment_file && (
              <a
                href={getUrl('checks', item.payment_file)}
                target="_blank"
                className="text-[#0131FF]"
              >
                Скачать чек
              </a>
            )}

            {item.is_paid && (
              <span className="text-green-600">✔</span>
            )}

            {loadingId === item.id && (
              <span className="text-gray-400">Загрузка...</span>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addItem}
        className="text-[#0131FF] text-sm"
      >
        + Добавить
      </button>
    </div>
  )
}
