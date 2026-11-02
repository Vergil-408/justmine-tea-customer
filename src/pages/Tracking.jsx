import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { formatItemOptions, getItemOptionLines } from '../utils/options.js'
import TeaLoader from '../components/TeaLoader.jsx'

const STEPS = [
  { key: 'diproses', label: 'Diproses', icon: 'local_cafe' },
  { key: 'siap', label: 'Siap Diambil', icon: 'notifications_active' },
  { key: 'selesai', label: 'Selesai', icon: 'task_alt' },
]

const PAYMENT_INFO = {
  qris: { label: 'QRIS', icon: 'qr_code_2' },
  QRIS: { label: 'QRIS', icon: 'qr_code_2' },
  kasir: { label: 'Bayar Kasir', icon: 'payments' },
  cash: { label: 'Tunai', icon: 'payments' },
  'Cash on Pickup': { label: 'Tunai', icon: 'payments' },
  'E-Wallet': { label: 'E-Wallet', icon: 'account_balance_wallet' },
}

const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

export default function Tracking() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [queuePosition, setQueuePosition] = useState(null)
  const [copied, setCopied] = useState(false)

  // Dengarkan status pesanan ini secara real-time
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() })
      }
    })
    return () => unsub()
  }, [orderId])

  // Hitung posisi antrean: pesanan lain yang masih menunggu/diproses (FIFO)
  useEffect(() => {
    if (!order) return
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['menunggu', 'diproses'])
    )
    const unsub = onSnapshot(q, (snap) => {
      const getTimestamp = (d) => {
        const val = d.createdAt || d.submittedAt
        if (val?.toDate) return val.toDate().getTime()
        if (val instanceof Date) return val.getTime()
        if (typeof val === 'number') return val
        if (typeof val === 'string') {
          const parsed = Date.parse(val)
          if (!isNaN(parsed)) return parsed
        }
        return Date.now()
      }

      const activeList = snap.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          orderCode: data.orderCode || '',
          time: getTimestamp(data),
        }
      })

      activeList.sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time
        return (a.orderCode || '').localeCompare(b.orderCode || '')
      })

      const idx = activeList.findIndex((item) => item.id === order.id)
      setQueuePosition(idx >= 0 ? idx + 1 : activeList.length || 1)
    })
    return () => unsub()
  }, [order])

  function copyOrderCode() {
    if (!order?.orderCode) return
    navigator.clipboard?.writeText(order.orderCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  if (!order) {
    return (
      <TeaLoader
        fullScreen
        message="Memuat status pesananmu..."
        submessage="Menghubungkan ke sistem dapur Justmine Tea..."
      />
    )
  }

  const isCancelled = order.status === 'dibatalkan'
  const isDone = order.status === 'selesai'
  const isReady = order.status === 'siap'
  const isProcessing = order.status === 'diproses' || order.status === 'menunggu'

  // Hitung index tahap aktif (0: diproses, 1: siap, 2: selesai)
  const currentIndex = isDone
    ? 2
    : isReady
    ? 1
    : isProcessing
    ? 0
    : 0

  const estimateMinutes = queuePosition ? queuePosition * 4 : null
  const itemsTotal = (order.items || []).reduce(
    (sum, it) => sum + (it.price || 0) * (it.qty || 1),
    0
  )
  const paymentInfo = PAYMENT_INFO[order.paymentMethod] || {
    label: order.paymentMethod || 'Pembayaran',
    icon: 'credit_card',
  }

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      {/* Top Bar Header Elegan */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-outline-variant/40">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
            aria-label="Kembali ke menu"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="font-serif font-bold text-base sm:text-lg text-on-surface">
            Lacak Pesanan
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Live Update</span>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-5">
        {/* ================= CARD 1: HERO STATUS PESANAN ================= */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 sm:p-7 shadow-xs text-center space-y-6">
          {/* Metadata Chips: Kode Pesanan, Pemesan, Meja, Metode Bayar */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Tombol Salin Kode Pesanan */}
            <button
              type="button"
              onClick={copyOrderCode}
              title="Salin kode pesanan"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/70 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>#{order.orderCode || order.id?.slice(0, 8)}</span>
              {copied && <span className="text-[10px] text-primary font-bold">(Tersalin)</span>}
            </button>

            {/* Nama Pemesan */}
            {(order.customerName || order.userName) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold">
                <span className="material-symbols-outlined text-[15px]">person</span>
                <span>{order.customerName || order.userName}</span>
              </span>
            )}

            {/* Nomor Meja / Tipe Pesanan */}
            {order.tableNumber ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                <span className="material-symbols-outlined text-[15px]">table_restaurant</span>
                <span>Meja {order.tableNumber}</span>
              </span>
            ) : order.orderType ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                <span className="material-symbols-outlined text-[15px]">takeout_dining</span>
                <span className="capitalize">{order.orderType}</span>
              </span>
            ) : null}

            {/* Metode Pembayaran */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px]">
                {paymentInfo.icon}
              </span>
              <span>{paymentInfo.label}</span>
            </span>
          </div>

          {/* Stepper Progress Modern (3 Tahap) */}
          {!isCancelled && (
            <div className="pt-2 px-2 sm:px-6">
              <div className="relative flex items-center justify-between">
                {/* Garis Track Latar Belakang */}
                <div
                  className="absolute left-6 right-6 top-5 sm:top-6 h-0.5 bg-outline-variant/60 -z-0"
                  aria-hidden="true"
                />

                {/* Garis Progres Aktif */}
                <div
                  className="absolute left-6 top-5 sm:top-6 h-0.5 bg-primary transition-all duration-500 -z-0"
                  style={{
                    width: `calc((100% - 3rem) * ${
                      currentIndex === 2 ? 1 : currentIndex === 1 ? 0.5 : 0
                    })`,
                  }}
                  aria-hidden="true"
                />

                {/* Node Stepper */}
                {STEPS.map((s, idx) => {
                  const done = isDone || idx < currentIndex
                  const active = !isDone && idx === currentIndex

                  return (
                    <div key={s.key} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          done
                            ? 'bg-primary text-on-primary shadow-sm'
                            : active
                            ? 'bg-primary text-on-primary ring-4 ring-primary/20 shadow-md scale-105'
                            : 'bg-surface-container border border-outline-variant text-outline'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                          {done && !active ? 'check' : s.icon}
                        </span>
                      </div>
                      <span
                        className={`text-xs mt-2.5 text-center tracking-tight transition-colors ${
                          active
                            ? 'text-primary font-bold'
                            : done
                            ? 'text-on-surface font-semibold'
                            : 'text-on-surface-variant font-medium'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Banner Status Dinamis Sesuai Tahap */}
          {isProcessing && (
            <div className="rounded-2xl bg-surface-container-low/80 border border-outline-variant/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">soup_kitchen</span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-on-surface">Minuman Sedang Disiapkan</h4>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Barista kami sedang meracik pesananmu dengan takaran segar.
                  </p>
                </div>
              </div>

              {queuePosition != null && (
                <div className="flex items-center gap-3 self-end sm:self-auto border-t sm:border-t-0 sm:border-l border-outline-variant/50 pt-2 sm:pt-0 sm:pl-4 shrink-0">
                  <div className="text-right sm:text-center">
                    <span className="block text-[10px] text-on-surface-variant uppercase font-semibold">Antrean</span>
                    <span className="text-sm font-black text-primary">#{queuePosition}</span>
                  </div>
                  {estimateMinutes && (
                    <div className="text-right sm:text-center border-l border-outline-variant/50 pl-3">
                      <span className="block text-[10px] text-on-surface-variant uppercase font-semibold">Estimasi</span>
                      <span className="text-sm font-bold text-tertiary">~{estimateMinutes} mnt</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isReady && (
            <div className="rounded-2xl bg-secondary-container/70 border border-primary/20 p-4 sm:p-5 flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 animate-bounce">
                <span className="material-symbols-outlined text-[24px]">storefront</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-secondary-container">Pesanan Siap Diambil!</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tunjukkan kode <span className="font-bold text-primary">#{order.orderCode}</span> ke counter bar Justmine Tea.
                </p>
              </div>
            </div>
          )}

          {isDone && (
            <div className="rounded-2xl bg-surface-container-low border border-outline-variant/60 p-4 sm:p-5 flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Pesanan Telah Selesai</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Terima kasih telah memesan. Semoga harimu tenang dan segar bersama Justmine Tea!
                </p>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="rounded-2xl bg-error/10 border border-error/20 p-4 sm:p-5 flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-error/20 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">cancel</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-error">Pesanan Dibatalkan</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Pesanan ini telah dibatalkan oleh kasir atau sistem. Silakan tanyakan ke staf bila ada kendala.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ================= CARD 2: RINCIAN PESANAN ================= */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary">receipt</span>
              <h3 className="font-serif font-bold text-base">Rincian Pesanan</h3>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              {(order.items || []).length} menu
            </span>
          </div>

          <div className="space-y-3 divide-y divide-outline-variant/30">
            {(order.items || []).map((item, idx) => {
              const lineTotal = (item.price || 0) * (item.qty || 1)
              const optionLines = getItemOptionLines(item)

              return (
                <div key={idx} className={`flex justify-between items-start gap-3 ${idx > 0 ? 'pt-3' : ''}`}>
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-surface-container text-xs font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                      {item.qty}×
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface leading-tight">
                        {item.name}
                      </p>
                      {optionLines.length > 0 && (
                        <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-primary/30">
                          {optionLines.map((line, lIdx) => (
                            <p key={lIdx} className="text-xs text-on-surface-variant leading-tight">
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-on-surface shrink-0">
                    {rupiah(lineTotal)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Garis Batas & Total */}
          <div className="pt-3 border-t border-dashed border-outline-variant/80 flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface">Total Pembayaran</span>
            <span className="text-lg font-black text-primary">
              {rupiah(order.total ?? itemsTotal)}
            </span>
          </div>
        </section>

        {/* ================= AKSI TOMBOL BAWAH ================= */}
        <div className="space-y-2.5 pt-1">
          <Link
            to={`/receipt/${order.id}`}
            className="w-full bg-surface-container-lowest hover:bg-surface-container-low border border-primary text-primary font-bold py-3.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>Lihat E-Receipt Digital</span>
            <span className="material-symbols-outlined text-[18px] opacity-70 ml-auto">arrow_forward</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-semibold py-3.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[20px]">local_cafe</span>
            <span>Pesan Menu Lain</span>
          </button>
        </div>
      </main>
    </div>
  )
}
