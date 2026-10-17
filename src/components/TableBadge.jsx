import { useTable } from '../context/TableContext.jsx'

// Lencana "Meja 25" di header. Tidak tampil kalau belum ada nomor meja.
export default function TableBadge({ className = '' }) {
  const { table } = useTable()
  if (!table) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-primary text-white text-xs font-bold px-2.5 py-1 ${className}`}>
      <span className="material-symbols-outlined text-[14px]">table_restaurant</span>
      Meja {table}
    </span>
  )
}
