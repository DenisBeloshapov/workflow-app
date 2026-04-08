'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TakeButton from '@/components/TakeButton'
import MoveButton from '@/components/MoveButton'
import CreateTaskModal from '@/components/CreateTaskModal'
import ReturnButton from '@/components/ReturnButton'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import Link from 'next/link'

export default function Page() {
  const [tasks, setTasks] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'closed')
      .order('created_at', { ascending: false })

    setTasks(data || [])
  }

  // ⚡ мгновенный UI
  const updateTaskLocal = (id: string, updates: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const getDepartmentName = (type: string) => {
    if (type === 'payment') return 'Оплата'
    if (type === 'registration') return 'Оформление'
    if (type === 'passport') return 'Паспорта'
    return ''
  }

  const filteredTasks =
    filter === 'all'
      ? tasks
      : tasks.filter((t) => t.type === filter)

  const newTasks = filteredTasks.filter((t) => t.status === 'created')
  const inWork = filteredTasks.filter((t) => t.status === 'taken')
  const done = filteredTasks.filter((t) => t.status === 'done')

  const TaskCard = ({ task }: any) => {
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
      if (task.type === 'payment') {
        supabase
          .from('task_items')
          .select('*')
          .eq('task_id', task.id)
          .then(({ data }) => setItems(data || []))
      }
    }, [])

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
      >
        <div className="flex justify-between items-start">
          <div className="font-semibold text-black dark:text-white">
            {task.body_number && task.client_name
              ? `${task.body_number} ${task.client_name}`
              : 'Задача'}
          </div>

          {/* приоритет */}
          {task.priority && (
            <div
              className={
                'text-xs px-3 py-1 rounded-full ' +
                (task.priority === 'high'
                  ? 'bg-red-400 text-white'
                  : task.priority === 'medium'
                  ? 'bg-yellow-400 text-white'
                  : 'bg-green-400 text-white')
              }
            >
              {task.priority === 'high'
                ? 'Срочно'
                : task.priority === 'medium'
                ? 'Средняя'
                : 'Низкая'}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 mt-2">
          {getDepartmentName(task.type)}
        </div>

        {/* комментарий */}
        {task.comment && (
          <div className="mt-2 text-sm bg-gray-100 dark:bg-zinc-700 p-2 rounded-lg whitespace-pre-line">
            {task.comment}
          </div>
        )}

        {/* файл */}
        {task.file_url && (
          <a
            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/tasks/${task.file_url}`}
            target="_blank"
            className="text-[#0131FF] text-sm mt-2 inline-block"
          >
            📥 Скачать файл
          </a>
        )}

        {/* ===== ОПЛАТА ===== */}
        {task.type === 'payment' && (
          <div className="mt-3 space-y-2">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="text-sm border rounded-lg p-2 bg-gray-100 dark:bg-zinc-700"
              >
                <div>
                  {item.body_number} {item.client_name}
                </div>

                <div className="flex gap-3 mt-1 text-xs">

                  {item.invoice_file && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/invoices/${item.invoice_file}`}
                      target="_blank"
                      className="text-[#0131FF]"
                    >
                      📥 счет
                    </a>
                  )}

                  <label className="text-[#0131FF] cursor-pointer">
                    📤 чек
                    <input
                      type="file"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const name =
                          Date.now() + '_' + file.name

                        await supabase.storage
                          .from('files')
                          .upload('checks/' + name, file)

                        await supabase
                          .from('task_items')
                          .update({ check_file: name })
                          .eq('id', item.id)

                      
                      }}
                    />
                  </label>

                  {item.check_file && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/checks/${item.check_file}`}
                      target="_blank"
                      className="text-green-600"
                    >
                      ✅ чек
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* сотрудник */}
        {task.assigned_to && (
          <div className="text-xs mt-2 text-[#0131FF]">
            👤 {task.assigned_to}
          </div>
        )}

        {/* кнопки */}
        <div className="mt-4 flex gap-2">
          {task.status === 'created' && (
            <TakeButton task={task} updateTaskLocal={updateTaskLocal} />
          )}

          {task.status === 'taken' && (
            <MoveButton taskId={task.id} status="done" label="Готово" />
          )}

          {task.status === 'done' && (
            <>
              <ReturnButton task={task} updateTaskLocal={updateTaskLocal} />
              <MoveButton taskId={task.id} status="closed" label="В архив" />
            </>
          )}
        </div>
      </motion.div>
    )
  }

  const Column = ({ title, items }: any) => (
    <div className="relative p-4 rounded-2xl bg-gray-200 dark:bg-zinc-900 overflow-hidden">

      {/* точки */}
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#888_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative z-10">
        <div className="flex justify-between mb-4">
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.href = '/login'
  }

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

          <CreateTaskModal />

          <Link href="/archive">
            <button className="px-3 py-1.5 text-sm rounded-full border text-black dark:text-white">
              Архив
            </button>
          </Link>

          {mounted && (
            <button
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
              className="px-3 py-1.5 text-sm rounded-full border text-black dark:text-white"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm rounded-full border text-black dark:text-white"
          >
            Выход
          </button>
        </div>
      </div>

      {/* фильтр */}
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
              'px-3 py-1.5 text-sm rounded-full border ' +
              (filter === btn.key
                ? 'bg-black text-white'
                : 'bg-white dark:bg-zinc-800 text-black dark:text-white')
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
