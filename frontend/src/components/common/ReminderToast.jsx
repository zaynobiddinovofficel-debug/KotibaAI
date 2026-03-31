import { useApp } from '../../context/AppContext'

export default function ReminderToast() {
  const { reminders, dismissReminder } = useApp()

  if (reminders.length === 0) return null

  return (
    <div className="fixed top-16 left-4 right-4 z-50 flex flex-col gap-2">
      {reminders.map(r => (
        <div
          key={r.id}
          className="bg-[#6C63FF] text-white rounded-2xl p-4 shadow-xl flex items-start gap-3"
          style={{ animation: 'slideDown 0.3s ease-out' }}
        >
          <div className="text-xl flex-shrink-0">{r.isVoice ? '🔔' : '⏰'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium opacity-80 mb-1">Eslatma</div>
            <div className="text-sm font-semibold leading-snug">{r.text}</div>
          </div>
          <button
            onClick={() => dismissReminder(r.id)}
            className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20"
            aria-label="Yopish"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
