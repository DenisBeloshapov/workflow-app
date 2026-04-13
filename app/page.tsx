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

    let isRealtimeConnected = false

    const channel = supabase
      .channel('realtime-tasks')

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload: any) => {
          const newTask = payload.new as any
          const oldTask = payload.old as any

          setTasks((prev) => {
            if (payload.eventType === 'INSERT') {
              return [newTask, ...prev]
            }

            if (payload.eventType === 'UPDATE') {
              return prev.map((t) =>
                t.id === newTask?.id ? { ...t, ...newTask } : t
              )
            }

            if (payload.eventType === 'DELETE') {
              return prev.filter((t) => t.id !== oldTask?.id)
            }

            return prev
          })
        }
      )

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_items' },
        (payload: any) => {
          const newItem = payload.new as any
          const oldItem = payload.old as any

          setTasks((prev) =>
            prev.map((task) => {
              if (task.id !== (newItem?.task_id || oldItem?.task_id))
                return task

              let items = task.task_items || []

              if (payload.eventType === 'INSERT') {
                items = [...items, newItem]
              }

              if (payload.eventType === 'UPDATE') {
                items = items.map((i: any) =>
                  i.id === newItem?.id ? { ...i, ...newItem } : i
                )
              }

              if (payload.eventType === 'DELETE') {
                items = items.filter((i: any) => i.id !== oldItem?.id)
              }

              return { ...task, task_items: items }
            })
          )
        }
      )

      .subscribe((status) => {
        console.log('REALTIME STATUS:', status)

        if (status === 'SUBSCRIBED') {
          isRealtimeConnected = true
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!isRealtimeConnected) {
            setInterval(fetchTasks, 5000)
          }
        }
      })

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

  const TaskCard = ({ task }: any) => (
    <motion.div
      layout
      className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border"
    >
      <div className="font-semibold">
        {task.body_number} {task.client_name}
      </div>

      <div className="text-xs text-gray-400 mt-2">
        {getDepartmentName(task.type)}
      </div>

      {task.comment && (
        <div className="mt-2 text-sm">{task.comment}</div>
      )}

      {task.assigned_to && (
        <div className="text-xs mt-2 text-[#0131FF]">
          👤 {task.assigned_to}
        </div>
      )}

      <div className="mt-4 flex gap-2">
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

  const Column = ({ title, items }: any) => (
    <div className="p-4 rounded-2xl bg-gray-200 dark:bg-zinc-900">
      <h2 className="mb-3">{title}</h2>
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
        <CreateTaskModal />

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

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Column title="Новые" items={newTasks} />
        <Column title="В работе" items={inWork} />
        <Column title="Готово" items={done} />
      </div>
    </div>
  )
}
