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

const CATEGORY_STYLES = {
  'Oziq-ovqat': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', icon: '🍎' },
  'Transport': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: '🚗' },
  'Kiyim': { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', icon: '👔' },
  "Sog'liq": { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', icon: '💊' },
  "Ta'lim": { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', icon: '📚' },
  "Ko'ngil ochar": { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', icon: '🎮' },
  'Boshqa': { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-400', icon: '📦' },
  'Umumiy': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', icon: '💰' }
}

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const catStyle = CATEGORY_STYLES[expense.category] || CATEGORY_STYLES['Boshqa']

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatAmount = (n) =>
    n ? n.toLocaleString('uz-UZ') : '0'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catStyle.bg}`}>
          <span className="text-xl">{catStyle.icon}</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {expense.description ? (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug truncate">
                  {expense.description}
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                  {expense.category}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${catStyle.bg} ${catStyle.text}`}>
                  {catStyle.icon} {expense.category}
                </span>
                <span className="text-[11px] text-gray-400">
                  {formatDate(expense.date || expense.createdAt)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="flex-shrink-0 text-right">
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {formatAmount(expense.amount)}
              </p>
              <p className="text-[10px] text-gray-400">so'm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-1 mt-2">
        <button
          onClick={() => onEdit(expense)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#6C63FF] hover:bg-[#6C63FF]/10 transition-all"
          aria-label="Tahrirlash"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(expense._id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          aria-label="O'chirish"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}
