import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { formatItemOptions } from '../utils/options.js'

const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

export default function Receipt() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() })
    })
    return () => unsub()
  }, [orderId])

  function copyCode() {
    if (!order?.orderCode) return
    navigator.clipboard?.writeText(order.orderCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleShareReceipt = async () => {
    if (!order) return
    const url = window.location.href
    const title = `E-Receipt Justmine Tea #${order.orderCode || order.id}`
    const text = `🍵 *E-RECEIPT JUSTMINE TEA*\n` +
      `ID Pesanan: #${order.orderCode || order.id}\n` +
      `Atas Nama: ${order.customerName || order.userName || 'Pelanggan'}\n` +
      `Meja: ${tableNum ? `Meja ${tableNum}` : 'Take-Away'}\n` +
      `Total: ${rupiah(totalAmount)}\n` +
      `Status: ${isPaid ? 'Lunas / Paid' : 'Menunggu Kasir'}\n\n` +
      `Lihat struk digital selengkapnya:\n${url}`

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share error:', err)
      }
    }
    // Fallback WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] font-sans text-neutral-800 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-primary animate-spin mb-3" />
        <p className="text-sm text-neutral-600">Memuat struk pesanan…</p>
      </div>
    )
  }

  const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date()
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const tableNum = order.tableNumber || order.table
  const isPaid = order.paymentStatus === 'dibayar' || order.status === 'siap' || order.status === 'selesai'
  const items = Array.isArray(order.items) ? order.items : []
  const itemsTotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 1), 0)
  const totalAmount = order.total ?? itemsTotal
  const pointsEarned = Math.floor(totalAmount / 1000)

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-neutral-900 pb-16 print:bg-white print:p-0">
      {/* Top Bar - hidden saat print */}
      <header className="print:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-[420px] mx-auto h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Kembali ke Menu"
            onClick={() => navigate('/menu')}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-700"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-sm font-bold tracking-wider uppercase text-neutral-800">E-Receipt Digital</h1>
          <button
            type="button"
            onClick={() => window.print()}
            title="Cetak struk"
            aria-label="Cetak struk"
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-700"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
          </button>
        </div>
      </header>

      <main className="max-w-[420px] mx-auto px-4 pt-4">
        {/* ================= STRUK THERMAL 80MM CARD ================= */}
        <div className="w-full max-w-[360px] mx-auto bg-white border border-neutral-300 shadow-md p-5 font-mono text-neutral-900 leading-tight print:shadow-none print:border-none print:p-0 print:max-w-none print:w-[78mm]">
          {/* Logo & Identitas Brand */}
          <div className="text-center pb-2">
            <div className="w-9 h-9 mx-auto rounded-full border border-neutral-400 flex items-center justify-center text-base mb-1.5 shadow-xs">
              🍃
            </div>
            <h2 className="font-extrabold text-base tracking-[0.22em] text-black uppercase">
              JUSTMINE TEA
            </h2>
            <p className="text-[9px] tracking-[0.18em] font-semibold text-neutral-700 uppercase mt-0.5">
              ARTISANAL BOTANICAL INFUSION
            </p>
            <div className="text-[10px] text-neutral-600 mt-2 space-y-0.5 leading-snug">
              <p>Justmine Tea Atelier - Outlet Pamulang</p>
              <p>Jl. Surya Kencana No. 1, Pamulang Barat</p>
              <p>TANGERANG SELATAN, BANTEN</p>
              <p>TEL : (021) 7412-889</p>
            </div>
          </div>

          {/* Nomor Meja / Tipe Pesanan */}
          <div className="py-2.5 text-center border-t border-dashed border-neutral-400 my-1">
            <span className="text-xl font-black tracking-widest text-black">
              {tableNum ? `TABLE - ${String(tableNum).padStart(2, '0')}` : 'TAKE-AWAY'}
            </span>
          </div>

          {/* Header Metadata: ID Pesanan, Tanggal, Jam, Kasir, Atas Nama (PAX REMOVED) */}
          <div className="border-t border-dashed border-neutral-400 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="font-bold">ID Pesanan :</span>
              <button
                type="button"
                onClick={copyCode}
                title="Salin ID Pesanan"
                className="font-extrabold tracking-wider text-black hover:underline cursor-pointer"
              >
                #{order.orderCode || order.id} {copied ? '✓' : ''}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span>Date       :</span>
              <span>{formattedDate} &nbsp; {formattedTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Kasir      :</span>
              <div className="flex items-center gap-2">
                <span>{order.cashierName || 'David / Kasir'}</span>
                <span className="font-bold text-[10px] uppercase">
                  {tableNum ? 'DINE-IN' : 'TAKE-AWAY'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Atas Nama  :</span>
              <span className="font-bold">
                {order.customerName || order.userName || order.buyerName || 'Pelanggan'}
              </span>
            </div>
          </div>

          {/* Daftar Item Pesanan & Kustomisasi */}
          <div className="border-t border-dashed border-neutral-400 py-2.5 space-y-2.5 text-[11px]">
            {items.map((item, idx) => {
              const lineTotal = (item.price || 0) * (item.qty || 1)
              const options = formatItemOptions(item)
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="font-bold shrink-0">{item.qty}</span>
                      <span className="font-bold text-black uppercase truncate">{item.name}</span>
                    </div>
                    <span className="font-bold shrink-0 text-black">
                      {lineTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {options && (
                    <p className="text-[10px] text-neutral-600 pl-4 leading-tight">
                      - {options} {item.qty > 1 ? `(${item.qty}x @${Math.round(item.price / 1000)}k)` : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Subtotal, Pajak/PB1, & TOTAL */}
          <div className="border-t border-dashed border-neutral-400 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal :</span>
              <span>{itemsTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>PB1 (Pajak Resto 0%) :</span>
              <span>0</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Service Charge (0%) :</span>
              <span>0</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-dashed border-neutral-400 text-sm font-black">
              <span className="tracking-wider text-black">TOTAL &nbsp; :</span>
              <span className="text-base font-black text-black">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Rincian Pembayaran */}
          <div className="border-t border-dashed border-neutral-400 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between items-center">
              <span>Metode Bayar:</span>
              <span className="font-bold">{order.paymentMethod || 'QRIS Dinamis (BCA/Gopay)'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Status      :</span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider border ${
                  isPaid
                    ? 'border-black text-black bg-neutral-100'
                    : 'border-amber-700 text-amber-800 bg-amber-50'
                }`}
              >
                {isPaid ? 'LUNAS / PAID' : 'MENUNGGU KASIR'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Ref Transaksi:</span>
              <span className="text-[10px] font-mono text-neutral-700">
                TRX-JM-{order.orderCode || order.id}
              </span>
            </div>
          </div>

          {/* Promo & Poin Loyalty (Tanpa QR Code) */}
          <div className="border-t border-dashed border-neutral-400 py-2.5 text-center space-y-1">
            <p className="text-[11px] font-bold text-black">
              Dapatkan {pointsEarned} Poin Melati untuk transaksi ini!
            </p>
            <p className="text-[9.5px] text-neutral-600 leading-tight italic">
              Tunjukkan struk digital ini ke Barista untuk klaim poin member.
            </p>
            <p className="text-[9px] font-black tracking-[0.14em] text-neutral-800 uppercase mt-1">
              MADE FROM AUTHENTIC BOTANICAL HARVEST!
            </p>
          </div>

          {/* Footer Ucapan Terima Kasih */}
          <div className="border-t border-dashed border-neutral-400 pt-3 pb-1 text-center space-y-1">
            <p className="text-[11px] italic font-serif text-neutral-800">
              &lsquo;Nikmati jeda teh terbaik Anda&rsquo;
            </p>
            <p className="text-[10px] text-neutral-700">
              Terima kasih atas kunjungan Anda di Justmine Tea.
            </p>
            <p className="text-[8px] tracking-widest text-neutral-400 uppercase pt-1">
              POS VERSION 4.2.1 • CLOUD SYNCED
            </p>
          </div>
        </div>

        {/* ================= TOMBOL AKSI DI LUAR STRUK (PRINT:HIDDEN) ================= */}
        <div className="print:hidden max-w-[360px] mx-auto mt-4 space-y-2.5">
          {/* Dua Tombol Utama Sesuai Desain Mockup */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-3 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Cetak Thermal (80mm)</span>
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              className="w-full py-3 px-3 rounded-xl bg-[#0F5A47] hover:bg-[#0c4839] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-center"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span className="leading-tight">Kirim via WhatsApp / Email</span>
            </button>
          </div>

          {/* Tombol Lacak Status Pesanan */}
          <button
            type="button"
            onClick={() => navigate(`/tracking/${order.id || orderId}`)}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">near_me</span>
            <span>Lacak Status Pesanan</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          {/* Tombol Pesan Lagi */}
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Kembali ke Menu</span>
          </button>
        </div>
      </main>
    </div>
  )
}