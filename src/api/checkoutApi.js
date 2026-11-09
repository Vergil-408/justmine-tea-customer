// Pemanggil endpoint server (folder api/ di Vercel).
// Browser sengaja TIDAK mengirim harga: server menghitung ulang dari id menu + id pilihan.
import { auth } from './firebase.js'

async function postJson(path, payload, headers = {}) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Terjadi kesalahan. Coba lagi.')
    err.status = res.status
    throw err
  }
  return data
}

/**
 * @param {{ items: Array, tableNumber: string, paymentMethod: 'qris'|'kasir', clientRequestId: string, user: object|null, customerName?: string }} p
 * @returns {Promise<{ orderId, orderCode, total, paymentMethod, paymentStatus, qrUrl, expiresAt, sandbox }>}
 */
export async function requestCreateOrder({ items, tableNumber, paymentMethod, clientRequestId, user, customerName }) {
  const headers = {}

  // Ambil Firebase IdToken secara aman tanpa risiko crash jika user bukan instance lengkap
  try {
    const targetUser = (user && typeof user.getIdToken === 'function')
      ? user
      : (auth?.currentUser && typeof auth.currentUser.getIdToken === 'function')
        ? auth.currentUser
        : null

    if (targetUser) {
      const token = await targetUser.getIdToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }
  } catch (tokenErr) {
    console.warn('Gagal memperoleh token auth:', tokenErr)
  }

  return postJson(
    '/api/create-order',
    {
      items: items.map((i) => ({
        id: i.id,
        qty: i.qty,
        selectedOptions: i.selectedOptions || [],
        isBundle: !!i.isBundle,
        bundleSlots: i.bundleSlots || null,
      })),
      tableNumber,
      paymentMethod,
      clientRequestId,
      customerName: (customerName || user?.displayName || user?.email?.split('@')[0] || 'Pelanggan').trim(),
    },
    headers
  )
}

/** Meminta server mengecek status pembayaran ke Midtrans (cadangan kalau webhook belum masuk). */
export function syncPayment(orderId) {
  return postJson('/api/sync-payment', { orderId })
}
