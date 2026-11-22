// POST /api/send-push
// Dipanggil oleh Admin app ketika status order berubah.
// Ambil FCM token pelanggan dari Firestore → kirim push notification via Firebase Admin Messaging.

import { getAdmin } from './_lib/admin.js'
import { getMessaging } from 'firebase-admin/messaging'

const STATUS_NOTIF = {
  diproses: {
    title: 'Pesanan sedang diproses ☕',
    body: (code) => `Pesanan #${code} sedang dibuat oleh barista.`,
  },
  siap: {
    title: 'Pesanan siap diambil 🎉',
    body: (code) => `Pesanan #${code} sudah siap! Silakan ambil di counter.`,
  },
  selesai: {
    title: 'Pesanan selesai ✅',
    body: (code) => `Pesanan #${code} selesai. Terima kasih sudah memesan!`,
  },
  dibatalkan: {
    title: 'Pesanan dibatalkan ❌',
    body: (code) => `Pesanan #${code} dibatalkan. Hubungi kasir jika ada pertanyaan.`,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan.' })

  try {
    const { orderId, orderCode, status, userId } = req.body || {}

    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId dan status wajib diisi.' })
    }

    const notifTemplate = STATUS_NOTIF[status]
    if (!notifTemplate) {
      // Status tidak memerlukan notifikasi (misal 'menunggu')
      return res.status(200).json({ sent: false, reason: 'Status tidak memerlukan notifikasi.' })
    }

    const { db } = getAdmin()

    // Ambil FCM token dari Firestore
    let fcmToken = null

    if (userId) {
      const userSnap = await db.collection('users').doc(userId).get()
      if (userSnap.exists) {
        fcmToken = userSnap.data().fcmToken || null
      }
    }

    // Jika tidak ada userId, coba ambil dari data order
    if (!fcmToken) {
      const orderSnap = await db.collection('orders').doc(orderId).get()
      if (orderSnap.exists) {
        const orderData = orderSnap.data()
        const uid = orderData.userId
        if (uid) {
          const userSnap = await db.collection('users').doc(uid).get()
          if (userSnap.exists) {
            fcmToken = userSnap.data().fcmToken || null
          }
        }
      }
    }

    if (!fcmToken) {
      return res.status(200).json({ sent: false, reason: 'FCM token tidak ditemukan untuk pelanggan ini.' })
    }

    const code = orderCode || orderId.slice(0, 8)
    const messaging = getMessaging()

    await messaging.send({
      token: fcmToken,
      notification: {
        title: notifTemplate.title,
        body: notifTemplate.body(code),
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/icon.png',
          tag: orderId,
          renotify: true,
          vibrate: [200, 100, 200],
          actions: [
            { action: 'track', title: 'Lihat Pesanan' },
          ],
        },
        fcmOptions: {
          link: `/tracking/${orderId}`,
        },
      },
      data: {
        orderId,
        orderCode: code,
        status,
        type: 'order_status',
      },
    })

    return res.status(200).json({ sent: true })
  } catch (err) {
    // Token invalid/expired — tidak perlu crash
    if (err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token') {
      return res.status(200).json({ sent: false, reason: 'Token FCM tidak valid atau sudah expired.' })
    }
    console.error('send-push error:', err)
    return res.status(500).json({ error: 'Gagal mengirim push notification.' })
  }
}

