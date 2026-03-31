import TaskItem from './TaskItem'
import { SkeletonCard } from '../common/LoadingSpinner'

export default function TaskList({ tasks, loading, onComplete, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <span className="text-2xl">✅</span>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vazifalar yo'q</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Yangi vazifa qo'shing</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map(task => (
        <TaskItem
          key={task._id}
          task={task}
          onComplete={onComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
