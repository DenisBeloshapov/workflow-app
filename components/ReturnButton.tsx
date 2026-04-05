'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function ReturnButton({ task }: { task: any }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    if (open) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const handleReturn = async () => {
    if (!reason) return

    setLoading(true)

    const newComment =
      (task.comment || '') +
      '\n\n🔁 Возврат: ' +
      reason

    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'taken',
        comment: newComment,
      })
      .eq('id', task.id)

    if (error) {
      console.log(error)
      alert('Ошибка возврата')
      setLoading(false)
      return
    }

    location.reload()
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        🔁 Вернуть
      </Button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white text-black p-6 rounded-2xl w-[400px] space-y-4 shadow-xl"
                >
                  <div className="text-lg font-semibold">
                    Возврат задачи
                  </div>

                  <textarea
                    placeholder="Причина возврата..."
                    className="w-full border p-2 rounded-lg bg-white text-black"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Отмена
                    </Button>

                    <Button onClick={handleReturn} disabled={loading}>
                      Подтвердить
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}