import { useState, useCallback } from 'react'
import { useVoice } from '../../hooks/useVoice'

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export default function ChatComposer({ onSendText, onVoiceResult, onSilence, disabled }) {
  const [text, setText] = useState('')

  const handleVoiceResult = useCallback((data) => {
    onVoiceResult?.(data)
  }, [onVoiceResult])

  const { recording, processing, startRecording, stopRecording } = useVoice({
    onResult: handleVoiceResult,
    onSilence: onSilence
  })

  const handleSend = () => {
    if (!text.trim() || disabled) return
    onSendText?.(text.trim())
    setText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoicePress = (e) => {
    e.preventDefault()
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="flex items-end gap-2">
        {/* Voice button */}
        <button
          onPointerDown={(e) => { e.preventDefault(); startRecording() }}
          onPointerUp={(e) => { e.preventDefault(); stopRecording() }}
          onPointerLeave={(e) => { if (recording) { e.preventDefault(); stopRecording() } }}
          onClick={handleVoicePress}
          disabled={processing || disabled}
          className={`w-11 h-11 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all ${
            recording
              ? 'bg-red-500 text-white voice-pulse'
              : 'bg-[#6C63FF]/10 text-[#6C63FF] hover:bg-[#6C63FF]/20 active:bg-[#6C63FF]/30'
          } ${processing || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label={recording ? 'To\'xtatish' : 'Ovoz yozish'}
        >
          {processing ? (
            <div className="w-4 h-4 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
          ) : recording ? (
            <StopIcon />
          ) : (
            <MicIcon />
          )}
        </button>

        {/* Text input area */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2.5 flex items-end gap-2 min-h-[44px]">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Yozing yoki ovoz bering..."
            rows={1}
            disabled={recording || processing || disabled}
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none leading-relaxed max-h-20 self-center"
            style={{ fieldSizing: 'content' }}
          />
          {text.trim() && (
            <button
              onClick={handleSend}
              disabled={disabled}
              className="flex-shrink-0 w-8 h-8 bg-[#6C63FF] rounded-xl flex items-center justify-center text-white hover:bg-[#5A52E0] transition-colors disabled:opacity-50"
              aria-label="Yuborish"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>
      {recording && (
        <p className="text-xs text-red-500 text-center mt-2">
          Ovoz yozilmoqda... Tugash uchun tugmani qo'yib yuboring
        </p>
      )}
    </div>
  )
}
