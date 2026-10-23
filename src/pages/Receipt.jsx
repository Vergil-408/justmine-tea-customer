import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { formatItemOptions } from '../utils/options.js'

const rupiah = (n) => `Rp${Number(n || 0).toLocaleString('id-ID')}`

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

  if (!order) {
    return (
      <div className="min-h-screen bg-background font-sans text-on-surface flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin mb-3" />
        <p className="text-sm text-on-surface-variant">Memuat struk pesanan…</p>
      </div>
    )
  }

  const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date()
  const tableNum = order.tableNumber || order.table
  const isPaid = order.paymentStatus === 'dibayar' || order.status === 'siap' || order.status === 'selesai'
  const isKasir = String(order.paymentMethod || '').toLowerCase().includes('kasir')
  const items = Array.isArray(order.items) ? order.items : []
  const itemsTotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 1), 0)
  const totalAmount = order.total ?? itemsTotal

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface pb-16">
      {/* Top Bar - hidden saat print */}
      <header className="print:hidden sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/50">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => navigate('/menu')}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-base font-semibold">E-Receipt</h1>
          <button
            type="button"
            onClick={() => window.print()}
            title="Cetak struk"
            aria-label="Cetak struk"
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Banner Status Cepat */}
        <div className="print:hidden rounded-2xl bg-secondary-container/60 border border-secondary/20 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary">Pesanan Berhasil Dibuat!</p>
            <p className="text-[11px] text-on-surface-variant truncate">
              {isKasir ? 'Silakan lakukan pembayaran di kasir' : 'Pembayaran telah diverifikasi'}
            </p>
          </div>
        </div>

        {/* Kotak Struk Digital bergaya Nota */}
        <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          {/* Header Struk */}
          <div className="p-5 text-center bg-gradient-to-b from-[#F7F9F5] to-white border-b border-dashed border-outline-variant">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-container text-primary mb-2">
              <span className="text-2xl">🍃</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-primary">Justmine Tea</h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Authentic Tea & Blends</p>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                title="Salin kode pesanan"
              >
                <span>#{order.orderCode}</span>
                <span className="text-[10px] text-on-surface-variant font-normal">
                  {copied ? '✓ Disalin' : '📋'}
                </span>
              </button>

              {tableNum && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[13px]">table_restaurant</span>
                  Meja {tableNum}
                </span>
              )}

              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPaid ? '✓ Lunas' : '⏳ Menunggu Kasir'}
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant mt-2">
              {date.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              ·{' '}
              {date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Rincian Item */}
          <div className="p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Rincian Item
            </p>
            <div className="divide-y divide-outline-variant/30">
              {items.map((item, idx) => {
                const itemOptions = formatItemOptions(item)
                const lineTotal = (item.price || 0) * (item.qty || 1)
                return (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-on-surface">
                          {item.qty}× {item.name}
                        </span>
                        {itemOptions && (
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                            {itemOptions}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-on-surface shrink-0">
                        {rupiah(lineTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ringkasan Biaya */}
          <div className="px-5 py-4 bg-surface-container-low/40 border-t border-dashed border-outline-variant space-y-2 text-sm">
            <div className="flex justify-between text-on-surface-variant text-xs">
              <span>Metode Pembayaran</span>
              <span className="font-semibold text-on-surface uppercase">
                {order.paymentMethod || 'QRIS'}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-1 border-t border-outline-variant/40">
              <span className="font-bold text-base text-on-surface">Total Pembayaran</span>
              <span className="font-bold text-lg text-primary">{rupiah(totalAmount)}</span>
            </div>
          </div>

          {/* Footer Struk */}
          <div className="p-4 text-center border-t border-dashed border-outline-variant text-[11px] text-on-surface-variant bg-[#FCFAF5]">
            <p className="font-medium">Terima kasih sudah memesan di Justmine Tea 🍵</p>
            <p className="text-[10px] text-outline mt-0.5">
              Simpan bukti ini atau tunjukkan nomor pesanan saat pengambilan.
            </p>
          </div>
        </div>

        {/* Aksi Navigasi (Hidden saat print) */}
        <div className="print:hidden space-y-2.5 pt-2">
          {/* Tombol Utama: Lacak Pesanan */}
          <button
            type="button"
            onClick={() => navigate(`/tracking/${order.id || orderId}`)}
            className="w-full bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">near_me</span>
            <span>Lacak Status Pesanan</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          {/* Tombol Cetak & Kembali */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-3 rounded-full border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Cetak / Simpan</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="py-2.5 px-3 rounded-full border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              <span>Pesan Lagi</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}