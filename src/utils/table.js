// Nomor meja dari QR (mis. https://alamat-app/?meja=25).
// Disimpan di sessionStorage: hilang sendiri saat tab ditutup, jadi tidak "nyangkut" ke hari berikutnya.

const KEY = 'justmine_table'

// Hanya huruf/angka/strip, maksimal 6 karakter (mis. "25", "A3", "VIP-1"). Selain itu ditolak.
export function normalizeTable(value) {
  if (value == null) return null
  const s = String(value).trim()
  return /^[A-Za-z0-9-]{1,6}$/.test(s) ? s.toUpperCase() : null
}

export function readTableFromSearch(search) {
  try {
    return normalizeTable(new URLSearchParams(search).get('meja'))
  } catch {
    return null
  }
}

export function loadTable() {
  if (typeof window === 'undefined') return null
  try {
    return normalizeTable(window.sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function saveTable(table) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KEY, table)
  } catch (err) {
    console.warn('Gagal menyimpan nomor meja:', err)
  }
}

export function clearTableStorage() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(KEY)
  } catch (err) {
    console.warn('Gagal menghapus nomor meja:', err)
  }
}

/**
 * Parsing nomor meja dari berbagai input:
 * - URL lengkap (mis. https://customer-app.vercel.app/?meja=12)
 * - Path relatif (mis. /?meja=12 atau /menu?meja=A3)
 * - Teks format "Meja 12" atau "meja=12"
 * - String polos "12", "VIP-1", "A3"
 */
export function parseTableFromInput(input) {
  if (!input) return null
  const str = String(input).trim()

  // 1. Coba parse sebagai URL
  try {
    let url = null
    if (str.startsWith('http://') || str.startsWith('https://')) {
      url = new URL(str)
    } else if (str.includes('?')) {
      url = new URL(`https://dummy.local/${str.startsWith('/') ? str.slice(1) : str}`)
    }
    if (url) {
      const mejaParam = url.searchParams.get('meja')
      if (mejaParam) {
        const normalized = normalizeTable(mejaParam)
        if (normalized) return normalized
      }
    }
  } catch {
    // abaikan jika bukan URL valid
  }

  // 2. Format teks "meja 12", "meja=12", "meja:12", "meja-12"
  const matchMeja = str.match(/meja[\s=:-]*([A-Za-z0-9-]+)/i)
  if (matchMeja && matchMeja[1]) {
    const normalized = normalizeTable(matchMeja[1])
    if (normalized) return normalized
  }

  // 3. String polos (mis. "12", "A1", "VIP-1")
  return normalizeTable(str)
}
