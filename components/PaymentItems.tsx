'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaymentItems({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<any[]>([])

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

  const uploadCheck = async (id: string, file: File) => {
    const fileName = Date.now() + '_' + file.name

    await supabase.storage
      .from('files')
      .upload('checks/' + fileName, file)

    await supabase
      .from('task_items')
      .update({
        payment_file: fileName,
        is_paid: true,
      })
      .eq('id', id)

    fetchItems()
  }

  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="text-sm bg-gray-100 dark:bg-zinc-700 p-2 rounded"
        >
          <div>
            {item.body_number} {item.client_name}
          </div>

          {/* счет */}
          {item.invoice_file && (
            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/invoices/${item.invoice_file}`}
              target="_blank"
              className="text-[#0131FF] text-xs"
            >
              Скачать счет
            </a>
          )}

          {/* чек */}
          {!item.payment_file ? (
            <input
              type="file"
              onChange={(e) =>
                e.target.files &&
                uploadCheck(item.id, e.target.files[0])
              }
            />
          ) : (
            <div className="text-green-600 text-xs">
              ✔ Оплачено
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
