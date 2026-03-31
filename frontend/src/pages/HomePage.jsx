import { useState, useEffect, useRef, useCallback } from 'react'
import { conversationAPI, assistantAPI, tasksAPI, expensesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useVoice } from '../hooks/useVoice'
import ChatWindow from '../components/chat/ChatWindow'
import ChatComposer from '../components/chat/ChatComposer'

export default function HomePage() {
  const { user } = useAuth()
  const { messages, setMessages, addMessage, isTyping, setIsTyping } = useApp()
  const [summary, setSummary] = useState({ tasks: 0, monthlyExpenses: 0 })
  const spokenRef = useRef(new Set())

  useEffect(() => {
    // Load conversation history on mount (only if messages are empty)
    if (messages.length === 0) {
      conversationAPI.getHistory()
        .then(res => {
          if (res.data && res.data.length > 0) {
            setMessages(res.data.map(m => ({ ...m, id: Math.random() })))
          }
        })
        .catch(() => {})
    }

    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const [tasksRes, expRes] = await Promise.all([
        tasksAPI.getAll('active'),
        expensesAPI.getSummary()
      ])
      setSummary({
        tasks: Array.isArray(tasksRes.data) ? tasksRes.data.length : 0,
        monthlyExpenses: expRes.data?.monthly?.total || 0
      })
    } catch {}
  }

  // Separate voice instance just for speaking
  const { speak } = useVoice({ onResult: () => {}, onSilence: () => {} })

  const speakOnce = useCallback((msgId, text) => {
    if (user?.preferences?.voiceReminders && !spokenRef.current.has(msgId)) {
      spokenRef.current.add(msgId)
      speak(text)
    }
  }, [user, speak])

  const handleSendText = async (text) => {
    const userMsg = {
      role: 'user',
      content: text,
      isVoice: false,
      timestamp: new Date(),
      id: Math.random()
    }
    addMessage(userMsg)
    setIsTyping(true)

    try {
      const res = await assistantAPI.respond(text)
      const assistantMsg = {
        role: 'assistant',
        content: res.data.assistant_reply || res.data.reply || 'Tushundim.',
        isVoice: false,
        timestamp: new Date(),
        id: Math.random()
      }
      addMessage(assistantMsg)
      speakOnce(assistantMsg.id, assistantMsg.content)
      loadSummary()
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: 'Kechirasiz, hozir javob bera olmayman. Iltimos, keyinroq urinib ko\'ring.',
        isVoice: false,
        timestamp: new Date(),
        id: Math.random()
      }
      addMessage(errorMsg)
    } finally {
      setIsTyping(false)
    }
  }

  const handleVoiceResult = async (data) => {
    // Add voice message bubble (NOT text bubble)
    const userMsg = {
      role: 'user',
      content: data.transcript || '',
      isVoice: true,
      timestamp: new Date(),
      id: Math.random()
    }
    addMessage(userMsg)

    if (data.assistant_reply) {
      const assistantMsg = {
        role: 'assistant',
        content: data.assistant_reply,
        isVoice: false,
        timestamp: new Date(),
        id: Math.random()
      }
      addMessage(assistantMsg)
      speakOnce(assistantMsg.id, assistantMsg.content)
      loadSummary()
    } else if (data.transcript && !data.assistant_reply) {
      // If only transcript was returned, send it to assistant
      handleSendText(data.transcript)
    }
  }

  const formatMoney = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)} mln`
    if (n >= 1000) return `${(n / 1000).toFixed(0)} ming`
    return n.toString()
  }

  const firstName = user?.name?.split(' ')[0] || 'Do\'stim'

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Content area between fixed header (56px) and bottom nav (60px) + composer */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          paddingTop: '56px',
          paddingBottom: 'calc(60px + 72px + env(safe-area-inset-bottom))',
          height: '100dvh'
        }}
      >
        {/* Greeting + summary (not scrollable) */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2">
          {/* Greeting card */}
          <div className="bg-gradient-to-r from-[#6C63FF] to-[#8B85FF] rounded-2xl px-4 py-4 text-white shadow-md shadow-[#6C63FF]/20">
            <p className="text-sm opacity-80 mb-0.5">Salom, {firstName}! 👋</p>
            <p className="text-base font-semibold">Bugun nima qilishimiz kerak?</p>
          </div>

          {/* Quick summary */}
          <div className="flex gap-2 mt-2.5">
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <span className="text-lg flex-shrink-0">✅</span>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400">Faol vazifa</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{summary.tasks} ta</p>
              </div>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <span className="text-lg flex-shrink-0">💳</span>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400">Bu oy</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatMoney(summary.monthlyExpenses)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat area (scrollable) */}
        <ChatWindow messages={messages} isTyping={isTyping} />
      </div>

      {/* Composer pinned above bottom nav */}
      <div
        className="fixed left-0 right-0 z-30"
        style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
      >
        <ChatComposer
          onSendText={handleSendText}
          onVoiceResult={handleVoiceResult}
          onSilence={() => {}}
          disabled={isTyping}
        />
      </div>
    </div>
  )
}
