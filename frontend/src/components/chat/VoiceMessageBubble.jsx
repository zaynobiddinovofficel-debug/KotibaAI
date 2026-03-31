function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

export default function VoiceMessageBubble({ message }) {
  const timeStr = new Date(message.timestamp || Date.now()).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[75%]">
        <div className="bg-[#6C63FF] text-white rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-3 min-w-[160px]">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MicIcon />
          </div>
          <div className="flex items-end gap-[3px] h-5 flex-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="wave-bar w-[3px] bg-white/80 rounded-full"
                style={{ height: '4px', animationDelay: `${(i - 1) * 0.1}s` }}
              />
            ))}
          </div>
          <span className="text-xs opacity-80 flex-shrink-0">Ovoz</span>
        </div>
        <p className="text-[10px] text-gray-400 text-right mt-1">{timeStr}</p>
      </div>
    </div>
  )
}
