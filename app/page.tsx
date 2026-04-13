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

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      fetchTasks()
    }

    checkUser()

    // ✅ стабильный realtime
    const channel = supabase
      .channel('tasks-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_items' },
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
      .select(`*, task_items(*)`)
      .neq('status', 'closed')
      .order('created_at', { ascending: false })

    setTasks(data || [])
  }

  const updateTaskLocal = (taskId: string, updates: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )
  }

  const updateItemLocal = (taskId: string, itemId: string, updates: any) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              task_items: t.task_items.map((i: any) =>
                i.id === itemId ? { ...i, ...updates } : i
              ),
            }
          : t
      )
    )
  }

  const getDepartmentName = (dep: string) => {
    if (!dep) return ''
    if (dep.includes('payment')) return 'Оплата'
    if (dep.includes('registration')) return 'Оформление'
    if (dep.includes('passport')) return 'Паспорта'
    return dep
  }

  const filteredTasks =
    filter === 'all' ? tasks : tasks.filter((t) => t.type === filter)

  const newTasks = filteredTasks.filter((t) => t.status === 'created')
  const inWork = filteredTasks.filter((t) => t.status === 'taken')
  const done = filteredTasks.filter((t) => t.status === 'done')

  const TaskCard = ({ task }: any) => {
    const markPaid = async (itemId: string) => {
      // ⚡ мгновенно
      updateItemLocal(task.id, itemId, { is_paid: true })

      // 💾 база
      await supabase
        .from('task_items')
        .update({ is_paid: true })
        .eq('id', itemId)
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border shadow-sm"
      >
        <div className="flex justify-between">
          <div className="font-semibold">
            {task.body_number} {task.client_name}
          </div>

          <div className="text-xs">
            {task.priority === 'high'
              ? '🔴 Срочно'
              : task.priority === 'medium'
              ? '🟡 Средняя'
              : '🟢 Низкая'}
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-1">
          {getDepartmentName(task.type)}
        </div>

        {task.comment && (
          <div className="mt-2 text-sm bg-gray-100 dark:bg-zinc-700 p-2 rounded">
            {task.comment}
          </div>
        )}

        {/* возврат */}
        {task.return_comment && (
          <div className="mt-2 text-xs text-red-500">
            ↩ {task.return_comment}
          </div>
        )}

        {/* PAYMENT */}
        {task.type === 'payment' && (
          <div className="mt-3 space-y-2">
            {task.task_items?.map((item: any) => (
              <div
                key={item.id}
                className="border rounded p-2 text-sm bg-white dark:bg-zinc-900"
              >
                <div>
                  {item.body_number} {item.client_name}
                </div>

                <div className="mt-2">
                  {!item.is_paid ? (
                    <button
                      onClick={() => markPaid(item.id)}
                      className="text-[#0131FF]"
                    >
                      ✔ Отметить как оплачено
                    </button>
                  ) : (
                    <span className="text-green-600">
                      ✅ Оплачено
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {task.assigned_to && (
          <div className="text-xs mt-2 text-[#0131FF]">
            👤 {task.assigned_to}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {task.status === 'created' && (
            <TakeButton task={task} updateTaskLocal={updateTaskLocal} />
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
              <ReturnButton task={task} updateTaskLocal={updateTaskLocal} />
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
  }

  const Column = ({ title, items }: any) => (
    <div className="p-4 rounded-2xl bg-gray-200 dark:bg-zinc-900">
      <div className="flex justify-between mb-3">
        <h2>{title}</h2>
        <span>{items.length}</span>
      </div>

      <div className="space-y-3">
        {items.map((t: any) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl">Задачи</h1>

        <div className="flex gap-2">
          <CreateTaskModal />

          <Link href="/archive">
            <button className="border px-3 py-1 rounded">
              Архив
            </button>
          </Link>

          {mounted && (
            <button
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
              className="border px-3 py-1 rounded"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'payment', 'registration', 'passport'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="border px-3 py-1 rounded"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Column title="Новые" items={newTasks} />
        <Column title="В работе" items={inWork} />
        <Column title="Готово" items={done} />
      </div>
    </div>
  )
}
