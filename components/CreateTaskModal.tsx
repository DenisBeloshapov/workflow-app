'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string | null>(null)

  // ОБЩЕЕ
  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState('low')

  // REGISTRATION
  const [bulkText, setBulkText] = useState('')

  const handleCreate = async () => {
    if (!type) return

    // ===== ОФОРМЛЕНИЕ =====
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

    // ===== ОПЛАТА =====
    if (type === 'payment') {
      await supabase.from('tasks').insert({
        comment,
        priority,
        status: 'created',
        type: 'payment',
      })
    }

    location.reload()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать</Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* МОДАЛКА */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#f8f6f2] text-black p-6 rounded-2xl w-[520px] shadow-2xl"
            >
              {/* КРЕСТИК */}
              <button
                onClick={() => {
                  setOpen(false)
                  setType(null)
                }}
                className="absolute top-4 right-4 opacity-60 hover:opacity-100 transition"
              >
                <X size={18} />
              </button>

              {/* ===== ВКЛАДКИ ===== */}
              {!type && (
                <div className="relative h-[140px]">

                  {[
                    { key: 'registration', label: 'Оформление' },
                    { key: 'payment', label: 'Оплата' },
                  ].map((tab, i) => (
                    <motion.div
                      key={tab.key}
                      onClick={() => setType(tab.key)}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`
                        absolute top-0 w-[220px] h-[120px]
                        bg-white rounded-xl shadow-md cursor-pointer
                        flex items-center justify-center
                        hover:scale-[1.03] transition
                      `}
                      style={{
                        left: i * 120,
                        zIndex: 10 - i,
                      }}
                    >
                      {/* ЯЗЫЧОК */}
                      <div className="absolute -top-3 left-6 bg-white px-3 py-1 text-xs rounded-t-md shadow-sm border">
                        {tab.label}
                      </div>

                      <div className="text-3xl opacity-70">📁</div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ===== ОФОРМЛЕНИЕ ===== */}
              {type === 'registration' && (
                <div className="space-y-4 mt-2">
                  <textarea
                    placeholder="WB1234 Иванов Иван"
                    className="w-full border p-2 rounded-lg bg-white"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />

                  <textarea
                    placeholder="Комментарий"
                    className="w-full border p-2 rounded-lg bg-white"
                    onChange={(e) => setComment(e.target.value)}
                  />

                  <div className="flex gap-4 text-sm">
                    {[
                      { key: 'high', label: 'Срочно' },
                      { key: 'medium', label: 'Средняя' },
                      { key: 'low', label: 'Низкая' },
                    ].map((p) => (
                      <label key={p.key} className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={priority === p.key}
                          onChange={() => setPriority(p.key)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== ОПЛАТА ===== */}
              {type === 'payment' && (
                <div className="space-y-4 mt-2">
                  <div className="text-sm text-gray-500">
                    Физики добавляются внутри задачи
                  </div>

                  <textarea
                    placeholder="Комментарий"
                    className="w-full border p-2 rounded-lg bg-white"
                    onChange={(e) => setComment(e.target.value)}
                  />

                  <div className="flex gap-4 text-sm">
                    {[
                      { key: 'high', label: 'Срочно' },
                      { key: 'medium', label: 'Средняя' },
                      { key: 'low', label: 'Низкая' },
                    ].map((p) => (
                      <label key={p.key} className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={priority === p.key}
                          onChange={() => setPriority(p.key)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== КНОПКИ ===== */}
              {type && (
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setType(null)}
                  >
                    Назад
                  </Button>

                  <Button onClick={handleCreate}>
                    Создать
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
