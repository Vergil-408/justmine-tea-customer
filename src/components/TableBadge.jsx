import { useTable } from '../context/TableContext.jsx'

// Lencana nomor meja di header.
// Jika belum ada meja -> tampil tombol "Scan Meja".
// Jika sudah ada -> tampil "Meja 25" dengan opsi ubah/lepas saat diklik.
export default function TableBadge({ className = '' }) {
  const { table, openScanner } = useTable()

  if (!table) {
    return (
      <button
        type="button"
        onClick={openScanner}
        className={`inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-xs font-bold px-2.5 py-1 active:scale-95 shadow-2xs ${className}`}
        aria-label="Scan QR Meja"
        title="Klik untuk scan QR meja atau pilih nomor meja"
      >
        <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
        <span>Scan Meja</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openScanner}
      className={`inline-flex items-center gap-1 rounded-full bg-primary text-white text-xs font-bold px-2.5 py-1 hover:bg-primary-dark transition-all active:scale-95 shadow-xs ${className}`}
      aria-label={`Meja ${table}, klik untuk ubah`}
      title="Klik untuk ubah atau lepas nomor meja"
    >
      <span className="material-symbols-outlined text-[14px]">table_restaurant</span>
      <span>Meja {table}</span>
      <span className="material-symbols-outlined text-[12px] opacity-70">edit</span>
    </button>
  )
}
