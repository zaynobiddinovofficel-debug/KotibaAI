import { useState, useEffect } from 'react'

export default function MessageBubble({ message, isLatest }) {
  const isUser = message.role === 'user'
  const [displayText, setDisplayText] = useState(
    isUser || !isLatest ? message.content : ''
  )
  const [isTypingDone, setIsTypingDone] = useState(isUser || !isLatest)

  useEffect(() => {
    if (isUser || !isLatest) return
    if (displayText === message.content) {
      setIsTypingDone(true)
      return
    }

    let i = displayText.length
    const interval = setInterval(() => {
      if (i < message.content.length) {
        setDisplayText(message.content.slice(0, i + 1))
        i++
      } else {
        setIsTypingDone(true)
        clearInterval(interval)
      }
    }, 25)

    return () => clearInterval(interval)
  }, [message.content, isLatest, isUser])

  const timeStr = new Date(message.timestamp || Date.now()).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[75%]">
          <div className="bg-[#6C63FF] text-white rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">{timeStr}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[80%]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {displayText}
            {!isTypingDone && <span className="typing-cursor" />}
          </p>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">{timeStr}</p>
      </div>
    </div>
  )
}
