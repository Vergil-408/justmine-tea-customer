// POST /api/sync-payment { orderId }
// Cadangan webhook: menanyakan status transaksi langsung ke Midtrans lalu memperbarui order.
// Aman dipanggil siapa saja karena yang diterapkan hanya status ASLI dari Midtrans, bukan dari pemanggil.
import { getAdmin } from './_lib/admin.js'
import { applyPaymentStatus } from './_lib/orders.js'
import { getTransactionStatus, mapPaymentStatus } from './_lib/midtrans.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan.' })

  try {
    const orderId = String(req.body?.orderId || '')
    if (!/^[A-Za-z0-9]{10,40}$/.test(orderId)) return res.status(400).json({ error: 'orderId tidak valid.' })

    const { db, FieldValue } = getAdmin()
    const snap = await db.collection('orders').doc(orderId).get()
    if (!snap.exists) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' })
    if (!snap.data().payment?.midtransOrderId) return res.status(200).json({ paymentStatus: snap.data().paymentStatus })

    const status = await getTransactionStatus(orderId)
    if (!status || !status.transaction_status) return res.status(200).json({ paymentStatus: snap.data().paymentStatus })

    const result = await applyPaymentStatus(db, orderId, status, {
      mapStatus: mapPaymentStatus,
      serverTimestamp: FieldValue.serverTimestamp(),
    })
    return res.status(200).json({ paymentStatus: result.paymentStatus || snap.data().paymentStatus })
  } catch (err) {
    console.error('sync-payment error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan di server.' })
  }
}
