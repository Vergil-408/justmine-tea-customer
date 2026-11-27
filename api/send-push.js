// POST /api/send-push
// Dipanggil oleh Admin app ketika status order berubah.
// Memverifikasi ID token staff, lalu mengambil FCM token pelanggan dari order / user doc → kirim push via Firebase Admin Messaging.

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

function applyCors(req, res) {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res) {
  applyCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan.' })

  try {
    const { db, auth } = getAdmin()

    // Verifikasi otorisasi staff (owner / kasir)
    const authz = req.headers.authorization || ''
    if (!authz.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Otorisasi admin diperlukan.' })
    }
    let decoded
    try {
      decoded = await auth.verifyIdToken(authz.slice(7))
    } catch {
      return res.status(401).json({ error: 'Token admin tidak valid.' })
    }
    const adminSnap = await db.collection('admins').doc(decoded.uid).get()
    const role = adminSnap.exists ? adminSnap.data()?.role : null
    if (role !== 'owner' && role !== 'kasir') {
      return res.status(403).json({ error: 'Hanya staff yang dapat mengirim notifikasi.' })
    }

    const { orderId, orderCode, status, userId } = req.body || {}
    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId dan status wajib diisi.' })
    }

    const notifTemplate = STATUS_NOTIF[status]
    if (!notifTemplate) {
      return res.status(200).json({ sent: false, reason: 'Status tidak memerlukan notifikasi.' })
    }

    // Ambil FCM token: prioritaskan dari dokumen order (mendukung Guest & Member), lalu fallback ke users/{uid}
    let fcmToken = null
    let resolvedUid = userId || null

    const orderSnap = await db.collection('orders').doc(orderId).get()
    if (orderSnap.exists) {
      const orderData = orderSnap.data() || {}
      fcmToken = orderData.fcmToken || null
      if (!resolvedUid && orderData.userId) resolvedUid = orderData.userId
    }

    if (!fcmToken && resolvedUid) {
      const userSnap = await db.collection('users').doc(resolvedUid).get()
      if (userSnap.exists) {
        fcmToken = userSnap.data()?.fcmToken || null
      }
    }

    if (!fcmToken) {
      return res.status(200).json({ sent: false, reason: 'FCM token tidak ditemukan untuk pelanggan ini.' })
    }

    const code = orderCode || orderId.slice(0, 8)
    const title = notifTemplate.title
    const body = notifTemplate.body(code)
    const messaging = getMessaging()

    // Kirim data-only payload agar Service Worker onBackgroundMessage selalu menanganinya tanpa konflik/duplikasi
    await messaging.send({
      token: fcmToken,
      data: {
        title,
        body,
        orderId: String(orderId),
        orderCode: String(code),
        status: String(status),
        type: 'order_status',
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        fcmOptions: {
          link: `/tracking/${orderId}`,
        },
      },
    })

    return res.status(200).json({ sent: true })
  } catch (err) {
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      return res.status(200).json({ sent: false, reason: 'Token FCM tidak valid atau sudah expired.' })
    }
    console.error('send-push error:', err)
    return res.status(500).json({ error: 'Gagal mengirim push notification.' })
  }
}
