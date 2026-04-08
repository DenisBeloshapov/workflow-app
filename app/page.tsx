'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TakeButton from '@/components/TakeButton'
import MoveButton from '@/components/MoveButton'
import CreateTaskModal from '@/components/CreateTaskModal'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import ReturnButton from '@/components/ReturnButton'

export default function Page() {
  const [tasks, setTasks] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchTasks()

    const channel = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'closed')
      .order('created_at', { ascending: false })

    setTasks(data || [])
  }

  // 🔥 OPTIMISTIC UPDATE
  const updateTaskLocal = (taskId: string, updates: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )
  }

  const filteredTasks =
    filter === 'all'
      ? tasks
      : tasks.filter((t) => t.type === filter)

  const newTasks = filteredTasks.filter((t) => t.status === 'created')
  const inWork = filteredTasks.filter((t) => t.status === 'taken')
  const done = filteredTasks.filter((t) => t.status === 'done')

  const TaskCard = ({ task }: any) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border"
    >
      <div className="font-semibold text-black dark:text-white">
        {task.body_number} — {task.client_name}
      </div>

      <div className="text-xs text-gray-400 mt-2">
        {task.type}
      </div>

      <div className="mt-4 flex gap-2">
        {task.status === 'created' && (
          <TakeButton
            task={task}
            updateTaskLocal={updateTaskLocal}
          />
        )}

        {task.status === 'taken' && (
          <MoveButton
            task={task}
            status="done"
            label="Готово"
            updateTaskLocal={updateTaskLocal}
          />
        )}

        {task.status === 'done' && (
          <>
            <ReturnButton
              task={task}
              updateTaskLocal={updateTaskLocal}
            />
            <MoveButton
              task={task}
              status="closed"
              label="В архив"
              updateTaskLocal={updateTaskLocal}
            />
          </>
        )}
      </div>
    </motion.div>
  )

  const Column = ({ title, items }: any) => (
    <div className="p-4 rounded-2xl bg-gray-200 dark:bg-zinc-900">
      <h2 className="text-sm mb-4">
        {title} ({items.length})
      </h2>

      <div className="space-y-3">
        {items.map((t: any) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-[#1A1A1A]">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl">Задачи</h1>

        <div className="flex gap-2">
          <Link href="/archive">
            <button>Архив</button>
          </Link>

          {mounted && (
            <button
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          <CreateTaskModal />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'payment', 'registration', 'passport'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Column title="Новые" items={newTasks} />
        <Column title="В работе" items={inWork} />
        <Column title="Готово" items={done} />
      </div>
    </div>
  )
}
