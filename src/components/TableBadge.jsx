import { useTable } from '../context/TableContext.jsx'

// Lencana nomor meja di header.
// - Jika belum ada meja (tanpa scan QR) -> mode Takeaway, klik untuk scan QR meja jika ingin Dine-in.
// - Jika terkunci dari Scan QR -> read-only dengan ikon gembok (tidak bisa diubah manual).
// - Jika input manual darurat -> masih bisa diklik untuk ubah/lepas ke Takeaway.
export default function TableBadge({ className = '' }) {
  const { table, isLocked, openScanner } = useTable()

  if (!table) {
    return (
      <button
        type="button"
        onClick={openScanner}
        className={`inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-xs font-bold px-2.5 py-1 active:scale-95 shadow-2xs ${className}`}
        aria-label="Mode Takeaway — Klik untuk Scan QR Meja"
        title="Mode saat ini Takeaway. Klik untuk scan QR jika makan di tempat"
      >
        <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
        <span>Takeaway • Scan QR</span>
      </button>
    )
  }

  if (isLocked) {
    return (
      <button
        type="button"
        onClick={openScanner}
        className={`inline-flex items-center gap-1 rounded-full bg-primary text-white text-xs font-bold px-2.5 py-1 hover:bg-primary-dark transition-all active:scale-95 shadow-xs ${className}`}
        aria-label={`Meja ${table} terverifikasi QR — klik untuk scan ulang QR meja`}
        title={`Meja ${table} (Terverifikasi QR). Klik untuk scan QR meja lain jika pindah meja`}
      >
        <span className="material-symbols-outlined text-[14px]">table_restaurant</span>
        <span>Meja {table}</span>
        <span className="material-symbols-outlined text-[12px] opacity-85">lock</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openScanner}
      className={`inline-flex items-center gap-1 rounded-full bg-primary text-white text-xs font-bold px-2.5 py-1 hover:bg-primary-dark transition-all active:scale-95 shadow-xs ${className}`}
      aria-label={`Meja ${table}, klik untuk ubah`}
      title="Klik untuk ubah atau ganti ke Takeaway"
    >
      <span className="material-symbols-outlined text-[14px]">table_restaurant</span>
      <span>Meja {table}</span>
      <span className="material-symbols-outlined text-[12px] opacity-70">edit</span>
    </button>
  )
}
