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

      // ===== TASKS =====
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

      // ===== TASK ITEMS =====
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
            console.log('⚠️ fallback polling ON')
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

  const TaskCard = ({ task }: any) => {
    const handleUploadCheck = async (itemId: string, file: File) => {
      updateTaskLocal(task.id, {
        task_items: task.task_items.map((i: any) =>
          i.id === itemId ? { ...i, loading: true } : i
        ),
      })

      const fileName = Date.now() + '_' + file.name.replace(/\s/g, '_')

      await supabase.storage.from('files').upload('checks/' + fileName, file)

      await supabase
        .from('task_items')
        .update({ check_file: fileName })
        .eq('id', itemId)

      updateTaskLocal(task.id, {
        task_items: task.task_items.map((i: any) =>
          i.id === itemId
            ? { ...i, check_file: fileName, loading: false }
            : i
        ),
      })
    }

    return (
      <motion.div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border">
        <div className="font-semibold">
          {task.body_number} {task.client_name}
        </div>

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
  }

  return <div />
}
