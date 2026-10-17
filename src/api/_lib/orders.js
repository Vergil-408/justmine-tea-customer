// Logika order di sisi server. Menerima `db` sebagai argumen supaya bisa dites tanpa Firebase.

// Tanggal (yyyymmdd) menurut WIB, dipakai untuk reset nomor order harian.
export function jakartaDateKey(now = Date.now()) {
  return new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
}

export const formatOrderCode = (n) => `JT-${String(n).padStart(4, '0')}`

/**
 * Membuat order dengan nomor harian berurutan dan anti-dobel (clientRequestId), dalam SATU transaction.
 * buildOrder(orderCode) -> field order (tanpa orderCode/createdAt).
 * Mengembalikan { replay, orderId, orderCode? }. replay=true berarti permintaan yang sama pernah diproses.
 */
export async function createOrderTx(db, { clientRequestId, dateKey, buildOrder, serverTimestamp }) {
  const reqRef = db.collection('orderRequests').doc(clientRequestId)
  const counterRef = db.collection('counters').doc(`orders-${dateKey}`)
  const orderRef = db.collection('orders').doc()

  return db.runTransaction(async (tx) => {
    const reqSnap = await tx.get(reqRef)
    if (reqSnap.exists) return { replay: true, orderId: reqSnap.data().orderId }

    const counterSnap = await tx.get(counterRef)
    const next = (counterSnap.exists ? counterSnap.data().last || 0 : 0) + 1
    const orderCode = formatOrderCode(next)

    tx.set(counterRef, { last: next })
    tx.set(orderRef, { ...buildOrder(orderCode), orderCode, createdAt: serverTimestamp })
    tx.set(reqRef, { orderId: orderRef.id, createdAt: serverTimestamp })
    return { replay: false, orderId: orderRef.id, orderCode }
  })
}

/**
 * Menerapkan status transaksi Midtrans (hasil GET status / webhook) ke order.
 * - tidak pernah menurunkan order yang sudah 'dibayar'
 * - menolak kalau nominal tidak sama dengan total order
 * - kedaluwarsa/gagal pada order yang masih 'menunggu' -> order ikut 'dibatalkan'
 */
export async function applyPaymentStatus(db, orderId, statusData, { mapStatus, serverTimestamp }) {
  const ref = db.collection('orders').doc(orderId)
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return { applied: false, reason: 'order tidak ditemukan' }
    const order = snap.data()

    if (order.paymentStatus === 'dibayar') return { applied: false, reason: 'sudah dibayar', paymentStatus: 'dibayar' }

    const next = mapStatus(statusData.transaction_status, statusData.fraud_status)
    if (!next) return { applied: false, reason: `status diabaikan: ${statusData.transaction_status}` }

    if (statusData.gross_amount != null && Number(statusData.gross_amount) !== Number(order.total)) {
      return { applied: false, reason: 'nominal tidak cocok' }
    }

    const patch = {
      paymentStatus: next,
      'payment.transactionStatus': statusData.transaction_status,
      'payment.updatedAt': serverTimestamp,
    }
    if (next === 'dibayar') patch.paidAt = serverTimestamp
    if ((next === 'kedaluwarsa' || next === 'gagal') && order.status === 'menunggu') patch.status = 'dibatalkan'

    tx.update(ref, patch)
    return { applied: true, paymentStatus: next }
  })
}
