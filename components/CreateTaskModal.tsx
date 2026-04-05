'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [comment, setComment] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [departments, setDepartments] = useState<string[]>([])
  const [priority, setPriority] = useState('low')

  const toggle = (value: string) => {
    setDepartments((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }

  const handleCreate = async () => {
    let filePath = null

    if (file) {
      const fileName = Date.now() + '_' + file.name.replace(/\s/g, '_')

      const { error } = await supabase.storage
        .from('files')
        .upload('tasks/' + fileName, file)

      if (error) {
        alert('Ошибка загрузки')
        return
      }

      filePath = fileName
    }

    // 🔥 массовый парсинг
    const rows = input.split('\n').map((row) => row.trim()).filter(Boolean)

    const tasksToInsert = rows.map((row) => {
      const parts = row.split(' ')
      const body = parts.shift() || ''
      const name = parts.join(' ')

      return {
        body_number: body,
        client_name: name,
        comment,
        department: departments.join(','),
        priority,
        file_url: filePath,
        status: 'created',
      }
    })

    await supabase.from('tasks').insert(tasksToInsert)

    location.reload()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Создать</Button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl w-[420px] space-y-4">

            {/* 🔥 МАССОВОЕ ПОЛЕ */}
            <textarea
              placeholder="Кузов ФИО (каждая строка = новая задача)"
              className="w-full border p-2 rounded bg-white text-black h-[120px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div>
              <div className="text-sm mb-1">Отделы:</div>
              <div className="flex gap-3">
                {[
                  { key: 'payment', label: 'Оплата' },
                  { key: 'registration', label: 'Оформление' },
                  { key: 'passport', label: 'Паспорта' },
                ].map((dep) => (
                  <label key={dep.key} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={departments.includes(dep.key)}
                      onChange={() => toggle(dep.key)}
                    />
                    {dep.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm mb-1">Приоритет:</div>
              <div className="flex gap-3">
                {[
                  { key: 'high', label: 'Срочно' },
                  { key: 'medium', label: 'Средняя' },
                  { key: 'low', label: 'Низкая' },
                ].map((p) => (
                  <label key={p.key} className="flex items-center gap-1 text-sm">
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

            <textarea
              placeholder="Комментарий"
              className="w-full border p-2 rounded bg-white text-black"
              onChange={(e) => setComment(e.target.value)}
            />

            <input
              type="file"
              className="text-black"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

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