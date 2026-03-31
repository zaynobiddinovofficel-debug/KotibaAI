function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function TaskItem({ task, onComplete, onEdit, onDelete }) {
  const formatDate = (d) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const remindLabels = {
    0: 'Vaqtida eslat',
    10: '10 daqiqa oldin',
    30: '30 daqiqa oldin',
    60: '1 soat oldin',
    1440: '1 kun oldin'
  }

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date()

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border transition-all ${
        task.completed
          ? 'border-gray-100 dark:border-gray-700 opacity-60'
          : isOverdue
          ? 'border-red-200 dark:border-red-900/50'
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete(task._id)}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-[#6C63FF]'
          }`}
          aria-label={task.completed ? 'Bajarilmagan deb belgilash' : 'Bajarildi deb belgilash'}
        >
          {task.completed && <CheckIcon />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-snug ${
              task.completed
                ? 'line-through text-gray-400'
                : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-snug">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {task.dueDate && (
              <span
                className={`text-[11px] rounded-lg px-2 py-0.5 ${
                  isOverdue
                    ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                    : 'text-[#6C63FF] bg-[#6C63FF]/10'
                }`}
              >
                📅 {formatDate(task.dueDate)}
                {isOverdue && ' — Muddati o\'tdi'}
              </span>
            )}
            {task.remindBeforeMinutes !== undefined && task.dueDate && !task.completed && (
              <span className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-0.5">
                🔔 {remindLabels[task.remindBeforeMinutes] || `${task.remindBeforeMinutes} daqiqa oldin`}
              </span>
            )}
            {task.isVoiceReminder && !task.completed && task.dueDate && (
              <span className="text-[11px] text-purple-600 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-0.5">
                🎙 Ovozli
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0 ml-1">
          {!task.completed && (
            <button
              onClick={() => onEdit(task)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#6C63FF] hover:bg-[#6C63FF]/10 transition-all"
              aria-label="Tahrirlash"
            >
              <EditIcon />
            </button>
          )}
          <button
            onClick={() => onDelete(task._id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            aria-label="O'chirish"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
