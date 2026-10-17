// Nomor meja dari QR (mis. https://alamat-app/?meja=25).
// Disimpan di sessionStorage: hilang sendiri saat tab ditutup, jadi tidak "nyangkut" ke hari berikutnya.
// Catatan: nilai ini datang dari URL, jadi bisa diketik sembarang orang. Server yang menjadi penentu
// kalau nanti perlu validasi daftar meja yang sah.

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
