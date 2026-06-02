'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import CreateTaskModal from '@/components/CreateTaskModal'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRealtimeSync } from '@/lib/realtime-sync'
import { useTasksStore, Task } from '@/lib/store'
import Column from '@/components/Column.refactored'

export default function Page() {
  const [filter, setFilter] = useState<'all' | Task['type']>('all')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // ✅ Initialize realtime sync
  const { setupRealtimeSync } = useRealtimeSync()

  const {
    setTasks,
    getFilteredTasks,
    getTasksByStatus,
  } = useTasksStore()

  // ✅ Initial load
  useEffect(() => {
    setMounted(true)

    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/login'
        return
      }

      // Fetch initial tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`*, task_items(*)`)
        .neq('status', 'closed')
        .order('created_at', { ascending: false })

      if (tasksData) {
        setTasks(tasksData as Task[])
      }
    }

    init()
  }, [])

  // ✅ Get filtered tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'all') {
      return getFilteredTasks()
    }
    return getFilteredTasks(undefined, filter)
  }, [filter, getFilteredTasks])

  // ✅ Memoized status groups
  const newTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'created').map((t) => t.id),
    [filteredTasks]
  )

  const inWorkTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'taken').map((t) => t.id),
    [filteredTasks]
  )

  const doneTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'done').map((t) => t.id),
    [filteredTasks]
  )

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [])

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:!bg-[#1A1A1A]">
      {/* Header */}
      <div className="flex justify-between mb-6 items-center">
        <div>
          <h1 className="text-2xl font-semibold">Задачи</h1>
          <div className="text-sm text-gray-400">
            Управление процессами
          </div>
        </div>

        <div className="flex gap-2">
          <CreateTaskModal />

          <Link href="/archive">
            <button className="px-3 py-1.5 text-sm rounded-full border hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
              Архив
            </button>
          </Link>

          {mounted && (
            <button
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
              className="px-3 py-1.5 text-sm rounded-full border hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm rounded-full border hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Все' },
          { key: 'payment', label: 'Оплата' },
          { key: 'registration', label: 'Оформление' },
          { key: 'passport', label: 'Паспорта' },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key as any)}
            className={
              'px-3 py-1.5 text-sm rounded-full border transition ' +
              (filter === btn.key
                ? 'bg-black text-white'
                : 'bg-white dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700')
            }
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-6">
        <Column title="Новые" taskIds={newTasks} />
        <Column title="В работе" taskIds={inWorkTasks} />
        <Column title="Готово" taskIds={doneTasks} />
      </div>
    </div>
  )
}
