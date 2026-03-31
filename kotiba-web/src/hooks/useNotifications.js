import { useEffect, useRef, useCallback } from 'react'

// SSE orqali real-vaqt eslatmalar
export function useNotifications({ onReminderFired } = {}) {
  const esRef        = useRef(null)
  const reconnectRef = useRef(null)

  const connect = useCallback(() => {
    const token = localStorage.getItem('kotiba_token')
    if (!token) return

    // Eski ulanishni yopish
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const url = `http://localhost:3000/api/notifications/stream?token=${token}`
    const es  = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      console.log('[SSE] Ulandi')
    }

    // Eslatma yonganida
    es.addEventListener('reminder', (e) => {
      try {
        const reminder = JSON.parse(e.data)
        console.log('[SSE] Eslatma:', reminder)

        // Brauzer bildirishnomasi
        showBrowserNotification(reminder)

        // Callback chaqirish
        if (onReminderFired) onReminderFired(reminder)
      } catch {}
    })

    es.onerror = () => {
      console.warn('[SSE] Xato, 5s dan keyin qayta ulanish...')
      es.close()
      esRef.current = null
      reconnectRef.current = setTimeout(connect, 5000)
    }
  }, [onReminderFired])

  useEffect(() => {
    // Brauzer ruxsati so'rash
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    connect()

    return () => {
      if (esRef.current) esRef.current.close()
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [connect])
}

// Brauzer bildirishnomasi ko'rsatish
function showBrowserNotification(reminder) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  new Notification('Kotiba AI — Eslatma', {
    body: reminder.text || 'Eslatma vaqti keldi!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
  })
}
