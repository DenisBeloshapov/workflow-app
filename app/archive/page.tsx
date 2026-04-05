'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ArchivePage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'closed')
      .order('created_at', { ascending: false })

    setTasks(data || [])
  }

  const filtered = tasks.filter((t) =>
    t.body_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl">Архив задач</h1>

        <Link href="/">
          <button className="border px-3 py-1 rounded">
            ← Назад
          </button>
        </Link>
      </div>

      <input
        placeholder="Поиск по кузову..."
        className="border p-2 mb-4 w-full rounded"
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-3">
        {filtered.map((task: any) => (
          <div
            key={task.id}
            className="border p-3 rounded bg-white"
          >
            <div className="font-medium">
              {task.body_number}
            </div>

            <div className="text-sm text-gray-500">
              {task.client_name}
            </div>

            <div className="text-xs text-gray-400 mt-1">
              {task.department}
            </div>

            {task.assigned_to && (
              <div className="text-xs text-blue-500">
                👤 {task.assigned_to}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}