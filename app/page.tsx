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

  supabase.auth.getUser().then(({ data }) => {
    if (!data.user) {
      window.location.href = '/login'
    } else {
      fetchTasks()
    }
  })
}, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'closed')
      .order('created_at', { ascending: false })

    setTasks(data || [])
  }

  const getDepartmentName = (dep: string) => {
    if (!dep) return ''
    if (dep.includes('payment')) return 'Оплата'
    if (dep.includes('registration')) return 'Оформление'
    if (dep.includes('passport')) return 'Паспорта'
    return dep
  }

  const filteredTasks =
    filter === 'all'
      ? tasks
      : tasks.filter((t) => t.department?.includes(filter))

  const newTasks = filteredTasks.filter((t) => t.status === 'created')
  const inWork = filteredTasks.filter((t) => t.status === 'taken')
  const done = filteredTasks.filter((t) => t.status === 'done')

  const TaskCard = ({ task }: any) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      style={{ zIndex: 0 }}
      className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm transition"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-black">
            {task.body_number} {task.client_name}
          </div>
        </div>

        <div
          className={
            'text-xs px-4 py-1.5 rounded-full font-medium backdrop-blur-lg border ' +
            (task.priority === 'high'
              ? 'bg-gradient-to-r from-red-400/60 to-red-500/40 text-white shadow-lg shadow-red-300/40'
              : task.priority === 'medium'
              ? 'bg-gradient-to-r from-yellow-300/70 to-yellow-400/50 text-white shadow-lg shadow-yellow-300/40'
              : 'bg-gradient-to-r from-green-300/70 to-green-400/50 text-white shadow-lg shadow-green-300/40')
          }
        >
          {task.priority === 'high'
            ? 'Срочно'
            : task.priority === 'medium'
            ? 'Средняя'
            : 'Низкая'}
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-2">
        {getDepartmentName(task.department)}
      </div>

      {task.comment && (
        <div className="mt-3 text-sm bg-gray-100 dark:bg-zinc-700 p-2 rounded-lg whitespace-pre-line text-black dark:text-white">
          {task.comment}
        </div>
      )}

      {task.assigned_to && (
        <div className="text-xs mt-1 font-medium text-[#0131FF]">
          👤 {task.assigned_to}
        </div>
      )}

      {/* 🔥 КНОПКИ */}
      <div className="mt-4 flex gap-3 flex-wrap items-center">

        {task.status === 'created' && (
          <TakeButton taskId={task.id} />
        )}

        {task.status === 'taken' && (
          <MoveButton taskId={task.id} status="done" label="Готово" />
        )}

        {task.status === 'done' && (
          <>
            <ReturnButton task={task} />
            <MoveButton taskId={task.id} status="closed" label="В архив" />
          </>
        )}

        {/* 📎 СКАЧАТЬ — ТЕПЕРЬ ВЕЗДЕ */}
        {task.file_url && (
          <button
            onClick={() => {
              const { data } = supabase.storage
                .from('files')
                .getPublicUrl('tasks/' + task.file_url)

              window.open(data.publicUrl, '_blank')
            }}
            className="text-sm text-[#0131FF] hover:underline"
          >
            📎 Скачать
          </button>
        )}

      </div>
    </motion.div>
  )

  const Column = ({ title, items }: any) => (
    <div className="relative p-4 rounded-2xl bg-gray-200 dark:bg-zinc-900 overflow-hidden">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#888_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </h2>

          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-300 dark:bg-zinc-700">
            {items.length}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((t: any) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:!bg-[#1A1A1A]">
      <div className="flex justify-between mb-6 items-center">
        <div>
          <h1 className="text-2xl font-semibold">Задачи</h1>
          <div className="text-sm text-gray-400">
            Управление процессами
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/archive">
            <button className="px-3 py-1.5 text-sm rounded-full border hover:bg-gray-200 dark:hover:bg-zinc-700 transition text-black dark:text-white">
              Архив
            </button>
          </Link>

          {mounted && (
            <button
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
              className="px-3 py-1.5 text-sm rounded-full border hover:bg-gray-200 dark:hover:bg-zinc-700 transition text-black dark:text-white"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
	<button
  onClick={async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }}
  className="px-3 py-1.5 text-sm rounded-full border hover:bg-gray-200 dark:hover:bg-zinc-700 transition text-black dark:text-white"
>
  Выйти
</button>

          <CreateTaskModal />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Все' },
          { key: 'payment', label: 'Оплата' },
          { key: 'registration', label: 'Оформление' },
          { key: 'passport', label: 'Паспорта' },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={
              'px-3 py-1.5 text-sm rounded-full border transition ' +
              (filter === btn.key
                ? 'bg-black text-white'
                : 'bg-white dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-black dark:text-white')
            }
          >
            {btn.label}
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