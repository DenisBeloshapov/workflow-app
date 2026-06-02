'use client'

import { memo, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import TakeButton from './TakeButton.refactored'
import MoveButton from './MoveButton.refactored'
import ReturnButton from './ReturnButton.refactored'
import { useTasksStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

interface TaskCardProps {
  taskId: string
}

const TaskCard = memo(function TaskCard({ taskId }: TaskCardProps) {
  const task = useTasksStore((state) => state.getTask(taskId))
  const taskItems = useTasksStore((state) => state.getTaskItems(taskId))

  if (!task) return null

  const getDepartmentName = useCallback((type: string) => {
    if (type.includes('payment')) return 'Оплата'
    if (type.includes('registration')) return 'Оформление'
    if (type.includes('passport')) return 'Паспорта'
    return type
  }, [])

  const markAsPaid = useCallback(
    async (itemId: string) => {
      useTasksStore.setState((state) => ({
        taskItemsByTaskId: {
          ...state.taskItemsByTaskId,
          [taskId]: (state.taskItemsByTaskId[taskId] || []).map((item) =>
            item.id === itemId ? { ...item, is_paid: true } : item
          ),
        },
      }))

      try {
        await supabase
          .from('task_items')
          .update({ is_paid: true })
          .eq('id', itemId)
      } catch (error) {
        console.error('Mark as paid error:', error)
      }
    },
    [taskId]
  )

  const priorityColor = useMemo(() => {
    if (task.priority === 'high') return 'bg-red-500/80 text-white'
    if (task.priority === 'medium') return 'bg-yellow-400/80 text-white'
    return 'bg-green-400/80 text-white'
  }, [task.priority])

  const priorityLabel = useMemo(() => {
    if (task.priority === 'high') return 'Срочно'
    if (task.priority === 'medium') return 'Средняя'
    return 'Низкая'
  }, [task.priority])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
    >
      <div className="flex justify-between items-start">
        <div className="font-semibold text-black dark:text-white">
          {task.body_number} {task.client_name}
        </div>

        <div className={`text-xs px-4 py-1.5 rounded-full font-medium ${priorityColor}`}>
          {priorityLabel}
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-2">{getDepartmentName(task.type)}</div>

      {task.comment && (
        <div className="mt-3 text-sm bg-gray-100 dark:bg-zinc-700 p-2 rounded-lg whitespace-pre-line">
          {task.comment}
        </div>
      )}

      {(task.type === 'registration' || task.type === 'passport') && task.file && (
        <a
          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/docs/${task.file}`}
          target="_blank"
          className="text-[#0131FF] text-sm mt-2 inline-block"
        >
          📥 Скачать файл
        </a>
      )}

      {task.return_comment && (
        <div className="mt-2 text-xs text-red-500">↩ Причина возврата: {task.return_comment}</div>
      )}

      {task.type === 'payment' && taskItems.length > 0 && (
        <div className="mt-3 space-y-2">
          {taskItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-2 text-sm bg-white dark:bg-zinc-900"
            >
              <div className="font-medium">
                {item.body_number} {item.client_name}
              </div>

              <div className="flex gap-3 mt-2 flex-wrap items-center">
                {item.invoice_file && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/invoices/${item.invoice_file}`}
                    target="_blank"
                    className="text-[#0131FF]"
                  >
                    📥 Счет
                  </a>
                )}

                {!item.is_paid && (
                  <button
                    onClick={() => markAsPaid(item.id)}
                    className="text-sm px-2 py-1 rounded bg-green-500 text-white"
                  >
                    Отметить оплаченным
                  </button>
                )}

                {item.is_paid && (
                  <span className="text-green-600 text-sm">✅ Оплачено</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {task.assigned_to && (
        <div className="text-xs mt-2 font-medium text-[#0131FF]">👤 {task.assigned_to}</div>
      )}

      <div className="mt-4 flex gap-2">
        {task.status === 'created' && <TakeButton taskId={taskId} />}

        {task.status === 'taken' && (
          <MoveButton taskId={taskId} status="done" label="Готово" />
        )}

        {task.status === 'done' && (
          <>
            <ReturnButton taskId={taskId} />
            <MoveButton taskId={taskId} status="closed" label="В архив" />
          </>
        )}
      </div>
    </motion.div>
  )
})

export default TaskCard
