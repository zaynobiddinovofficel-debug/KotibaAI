import { useEffect } from 'react'
import { pushAPI } from '../services/api'
import { useApp } from '../context/AppContext'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const { showReminder } = useApp()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handler = (event) => {
      if (event.data?.type === 'REMINDER') {
        showReminder({
          text: event.data.text,
          isVoice: event.data.isVoiceReminder
        })
      }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [showReminder])

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const { data } = await pushAPI.getVapidKey()
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      })
      await pushAPI.subscribe(subscription.toJSON())
      return true
    } catch {
      return false
    }
  }

  return { subscribe }
}
