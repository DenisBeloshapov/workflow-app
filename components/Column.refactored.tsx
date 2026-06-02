'use client'

import { memo, useMemo } from 'react'
import TaskCard from './TaskCard.refactored'

interface ColumnProps {
  title: string
  taskIds: string[]
}

const Column = memo(function Column({ title, taskIds }: ColumnProps) {
  const taskCount = useMemo(() => taskIds.length, [taskIds.length])

  return (
    <div className="relative p-4 rounded-2xl bg-gray-200 dark:bg-zinc-900 overflow-hidden">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#888_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </h2>

          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-300 dark:bg-zinc-700">
            {taskCount}
          </span>
        </div>

        <div className="space-y-3">
          {taskIds.map((taskId) => (
            <TaskCard key={taskId} taskId={taskId} />
          ))}
        </div>
      </div>
    </div>
  )
})

export default Column
