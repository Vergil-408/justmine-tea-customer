// Riwayat pesanan untuk pengguna yang checkout TANPA login (tamu).
// Disimpan di localStorage milik browser ini saja — bukan di akun/cloud.
// Begitu user login, lebih baik pakai riwayat dari Firestore (per-akun, permanen).

const STORAGE_KEY = 'justmine_guest_orders'
const MAX_SAVED = 20 // batasi biar localStorage gak membengkak

/**
 * Simpan 1 order id tamu ke localStorage (dedupe otomatis, terbaru di depan).
 * @param {string} orderId - Firestore document id dari order
 * @param {string} [orderCode] - kode order (JT-xxxx) untuk referensi cepat
 */
export function addGuestOrder(orderId, orderCode) {
  if (!orderId || typeof window === 'undefined') return
  try {
    const existing = getGuestOrderIds()
    const filtered = existing.filter((o) => o.id !== orderId)
    const updated = [{ id: orderId, orderCode: orderCode || null, savedAt: Date.now() }, ...filtered].slice(0, MAX_SAVED)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn('Gagal menyimpan riwayat tamu ke localStorage:', err)
  }
}

/**
 * Ambil daftar order id tamu yang tersimpan di browser ini.
 * @returns {Array<{id: string, orderCode: string|null, savedAt: number}>}
 */
export function getGuestOrderIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('Gagal membaca riwayat tamu dari localStorage:', err)
    return []
  }
}

/** Hapus semua riwayat tamu di browser ini (opsional, misal tombol "bersihkan"). */
export function clearGuestOrders() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('Gagal menghapus riwayat tamu:', err)
  }
}
