import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [reminders, setReminders] = useState([]) // active reminder toasts
  const [messages, setMessages] = useState([]) // chat messages
  const [isTyping, setIsTyping] = useState(false)

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { ...msg, id: msg.id || (Date.now() + Math.random()) }])
  }, [])

  const showReminder = useCallback((reminder) => {
    const id = Date.now()
    setReminders(prev => [...prev, { ...reminder, id }])
    setTimeout(() => {
      setReminders(prev => prev.filter(r => r.id !== id))
    }, 8000)
  }, [])

  const dismissReminder = useCallback((id) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{
      messages,
      setMessages,
      addMessage,
      isTyping,
      setIsTyping,
      reminders,
      showReminder,
      dismissReminder
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
