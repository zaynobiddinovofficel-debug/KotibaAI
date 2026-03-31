self.addEventListener('push', event => {
  if (!event.data) return
  try {
    const data = JSON.parse(event.data.text())
    event.waitUntil(
      self.registration.showNotification(data.title || 'KotibaAI', {
        body: data.body || data.reminderText || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          taskId: data.taskId,
          isVoiceReminder: data.isVoiceReminder,
          reminderText: data.body || data.reminderText
        }
      })
    )
  } catch {}
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      clientList.forEach(client => {
        client.postMessage({
          type: 'REMINDER',
          text: event.notification.data?.reminderText,
          isVoiceReminder: event.notification.data?.isVoiceReminder
        })
      })

      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return clients.openWindow('/')
    })
  )
})

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})
