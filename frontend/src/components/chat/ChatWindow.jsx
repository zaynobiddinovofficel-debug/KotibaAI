import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import VoiceMessageBubble from './VoiceMessageBubble'

export default function ChatWindow({ messages, isTyping }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8 overflow-y-auto no-scrollbar">
        <div className="w-16 h-16 rounded-2xl bg-[#6C63FF]/10 flex items-center justify-center mb-4">
          <span className="text-3xl">🤖</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Salom! Men KotibaAI</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
          Vazifalar, eslatmalar va xarajatlar bo'yicha yordam beraman. Ovoz yoki matn bilan muloqot qilishingiz mumkin.
        </p>
        <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
          {[
            'Ertaga soat 10 da uchrashuv bor',
            'Bugun 150 ming so\'m sarfladim',
            'Faol vazifalarimni ko\'rsat'
          ].map((hint, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-600 dark:text-gray-300 text-center"
            >
              "{hint}"
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
      {messages.map((msg, idx) => {
        if (msg.role === 'user' && msg.isVoice) {
          return <VoiceMessageBubble key={msg.id || idx} message={msg} />
        }
        return (
          <MessageBubble
            key={msg.id || idx}
            message={msg}
            isLatest={idx === messages.length - 1 && msg.role === 'assistant'}
          />
        )
      })}
      {isTyping && (
        <div className="flex justify-start mb-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex gap-1.5 items-center h-5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500"
                  style={{
                    animation: 'wave-bar 1s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
