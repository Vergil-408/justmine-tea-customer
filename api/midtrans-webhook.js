// POST /api/midtrans-webhook  (diisi di dashboard Midtrans sebagai Payment Notification URL)
// 1) verifikasi signature  2) cek ulang status ke Midtrans  3) perbarui order (idempoten).
import { getAdmin } from './_lib/admin.js'
import { applyPaymentStatus } from './_lib/orders.js'
import { getTransactionStatus, mapPaymentStatus, verifySignature } from './_lib/midtrans.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan.' })

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    if (!verifySignature(body, process.env.MIDTRANS_SERVER_KEY)) {
      return res.status(403).json({ error: 'Signature tidak valid.' })
    }

    const { db, FieldValue } = getAdmin()
    const orderId = String(body.order_id)

    // Notifikasi uji dari dashboard memakai order_id palsu: balas 200 supaya tidak diulang terus.
    const exists = (await db.collection('orders').doc(orderId).get()).exists
    if (!exists) return res.status(200).json({ ok: true, ignored: 'order tidak dikenal' })

    // Jangan percaya isi notifikasi mentah: tanyakan statusnya langsung ke Midtrans.
    const status = await getTransactionStatus(orderId)
    if (!status || !status.transaction_status) return res.status(502).json({ error: 'Status Midtrans tidak terbaca.' })

    const result = await applyPaymentStatus(db, orderId, status, {
      mapStatus: mapPaymentStatus,
      serverTimestamp: FieldValue.serverTimestamp(),
    })
    if (!result.applied) console.warn('Webhook tidak menerapkan perubahan:', orderId, result.reason)
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    console.error('midtrans-webhook error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan di server.' }) // non-2xx -> Midtrans mencoba lagi
  }
}
