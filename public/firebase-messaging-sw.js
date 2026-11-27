// Firebase Cloud Messaging Service Worker
// File ini HARUS ada di root public/ agar browser bisa mendaftarkannya sebagai Service Worker.

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDiQISTMea-z9H7Gdd5oR3hTrrTSJ6_VvM',
  authDomain: 'justmine-tea.firebaseapp.com',
  projectId: 'justmine-tea',
  storageBucket: 'justmine-tea.firebasestorage.app',
  messagingSenderId: '567738805461',
  appId: '1:567738805461:web:06b546c1d723eabfea865c',
})

const messaging = firebase.messaging()

// Handler untuk push notification saat tab/browser TERTUTUP atau di background.
// Notif ini muncul langsung di notification tray HP/desktop.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {}
  const notif = payload.notification || {}
  const title = data.title || notif.title || 'Justmine Tea'
  const body = data.body || notif.body || 'Ada update pesananmu.'

  self.registration.showNotification(title, {
    body,
    icon: notif.icon || '/icon.png',
    badge: '/icon.png',
    tag: data.orderId || 'justmine-notif', // tag sama = replace notif lama
    renotify: true,
    vibrate: [200, 100, 200],
    data,
    actions: [
      { action: 'track', title: 'Lihat Pesanan' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  })
})

// Klik notif → buka halaman tracking
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const orderId = event.notification.data?.orderId
  const url = orderId ? `/tracking/${orderId}` : '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Kalau tab app sudah buka, fokus ke sana
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'NAVIGATE', url })
          return
        }
      }
      // Kalau tidak ada tab, buka tab baru
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

