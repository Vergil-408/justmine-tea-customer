// Helper murni + penyimpanan localStorage untuk notifikasi status pesanan.

const NOTIF_KEY = 'justmine_notifications'
const SEEN_KEY = 'justmine_order_seen'

export const MAX_NOTIFICATIONS = 30
export const MAX_SEEN = 60
export const GUEST_WINDOW_MS = 12 * 60 * 60 * 1000 // pesanan tamu dipantau 12 jam terakhir
export const GUEST_MAX = 5 // dan maksimal 5 pesanan, supaya jumlah listener Firestore kecil

export const FINAL_STATUSES = ['selesai', 'dibatalkan']
export const isFinalStatus = (s) => FINAL_STATUSES.includes(s)

// Teks notifikasi per status. Status lain (mis. 'menunggu') tidak memicu notifikasi.
export function buildNotification(orderId, orderCode, status, now = Date.now()) {
  const code = orderCode ? `#${orderCode}` : 'kamu'
  const map = {
    diproses: { title: 'Pesanan sedang diproses', body: `Pesanan ${code} sedang dibuat.` },
    siap: { title: 'Pesanan siap diambil 🎉', body: `Pesanan ${code} sudah siap. Silakan ambil di counter.` },
    selesai: { title: 'Pesanan selesai', body: `Pesanan ${code} sudah selesai. Terima kasih sudah memesan!` },
    dibatalkan: { title: 'Pesanan dibatalkan', body: `Pesanan ${code} dibatalkan. Hubungi kasir kalau ada pertanyaan.` },
  }
  const m = map[status]
  if (!m) return null
  return {
    id: `${orderId}-${status}-${now}`,
    orderId,
    orderCode: orderCode || null,
    status,
    title: m.title,
    body: m.body,
    createdAt: now,
    read: false,
  }
}

// Order tamu yang masih relevan: terbaru, dalam jendela waktu, dibatasi jumlahnya.
// `list` = hasil getGuestOrderIds() (terbaru di depan).
export function recentGuestIds(list, now = Date.now()) {
  return (list || [])
    .filter((o) => o && o.id && now - (o.savedAt || 0) <= GUEST_WINDOW_MS)
    .slice(0, GUEST_MAX)
    .map((o) => o.id)
}

// Catat status terakhir yang sudah "dilihat" untuk suatu order. Entri yang diperbarui dipindah
// ke belakang; kalau melebihi MAX_SEEN, yang paling lama dibuang.
export function markSeen(seen, orderId, status) {
  const { [orderId]: _old, ...rest } = seen || {}
  const next = { ...rest, [orderId]: status }
  const keys = Object.keys(next)
  if (keys.length <= MAX_SEEN) return next
  return Object.fromEntries(keys.slice(keys.length - MAX_SEEN).map((k) => [k, next[k]]))
}

// Notifikasi hanya kalau status sebelumnya SUDAH dikenal dan berbeda.
// (prev === undefined = pertama kali melihat order ini -> dasar perbandingan, bukan kejadian.)
export const statusChanged = (prev, next) => prev !== undefined && prev !== next

export function timeAgo(ts, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - ts) / 1000))
  if (s < 60) return 'baru saja'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} mnt lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

/* ---------- localStorage (semua dibungkus try/catch) ---------- */

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn('Gagal menyimpan ke localStorage:', err)
  }
}

export const loadNotifications = () => {
  const v = read(NOTIF_KEY, [])
  return Array.isArray(v) ? v : []
}
export const saveNotifications = (list) => write(NOTIF_KEY, list.slice(0, MAX_NOTIFICATIONS))
export const loadSeen = () => {
  const v = read(SEEN_KEY, {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}
export const saveSeen = (seen) => write(SEEN_KEY, seen)
