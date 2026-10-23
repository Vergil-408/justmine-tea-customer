import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { requestCreateOrder, syncPayment } from '../api/checkoutApi.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTable } from '../context/TableContext.jsx'
import { addGuestOrder } from '../utils/guestOrders.js'
import { formatItemOptions } from '../utils/options.js'

const METHODS = [
  { key: 'qris', label: 'QRIS', hint: 'Scan kode QR untuk membayar', icon: 'qr_code_2' },
  { key: 'kasir', label: 'Bayar di kasir', hint: 'Bayar saat mengambil pesanan', icon: 'payments' },
]

const SANDBOX_GUIDE = 'https://docs.midtrans.com/docs/testing-payment-on-sandbox'
const POLL_MS = 5000

const rupiah = (n) => `Rp${Number(n || 0).toLocaleString('id-ID')}`
const newRequestId = () => crypto.randomUUID()

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Shell({ title, onBack, children }) {
  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/50">
        <div className="max-w-xl mx-auto h-14 px-4 flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              aria-label="Kembali"
              onClick={onBack}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <h1 className="text-base font-semibold">{title}</h1>
        </div>
      </header>
      {children}
    </div>
  )
}

const cardCls = 'bg-surface-container-lowest border border-outline-variant/50 shadow-sm rounded-2xl p-4'

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const { table } = useTable()
  const navigate = useNavigate()

  const [method, setMethod] = useState('qris')
  const [stage, setStage] = useState('form') // 'form' | 'qris' | 'success' | 'expired'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null) // { orderId, orderCode, total, qrUrl, expiresAt }
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [copied, setCopied] = useState(false)
  const requestIdRef = useRef(newRequestId())

  // Setelah QRIS dibuat: dengarkan status order secara real-time + cek ke Midtrans tiap beberapa detik
  // (cadangan kalau webhook belum masuk, misalnya saat dites di localhost).
  useEffect(() => {
    if (stage !== 'qris' || !order) return undefined
    const unsub = onSnapshot(
      doc(db, 'orders', order.orderId),
      (snap) => {
        const status = snap.data()?.paymentStatus
        if (status === 'dibayar') setStage('success')
        else if (status === 'kedaluwarsa' || status === 'gagal') setStage('expired')
      },
      (err) => console.warn('Gagal memantau pembayaran:', err)
    )
    const poll = setInterval(() => syncPayment(order.orderId).catch(() => {}), POLL_MS)
    return () => {
      unsub()
      clearInterval(poll)
    }
  }, [stage, order])

  // Hitung mundur tampilan (kedaluwarsa yang sebenarnya diputuskan Midtrans).
  useEffect(() => {
    if (stage !== 'qris' || !order?.expiresAt) return undefined
    const tick = () => setSecondsLeft(Math.round((order.expiresAt - Date.now()) / 1000))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [stage, order])

  // Pembayaran berhasil: kosongkan keranjang lalu ke halaman struk.
  useEffect(() => {
    if (stage !== 'success' || !order) return undefined
    clearCart()
    const t = setTimeout(() => navigate(`/receipt/${order.orderId}`, { replace: true }), 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, order])

  async function handlePay() {
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const result = await requestCreateOrder({
        items,
        tableNumber: table,
        paymentMethod: method,
        clientRequestId: requestIdRef.current,
        user,
      })
      if (!user) addGuestOrder(result.orderId, result.orderCode) // riwayat & notifikasi tamu
      setOrder(result)

      if (method === 'kasir') {
        clearCart()
        navigate(`/receipt/${result.orderId}`, { replace: true })
      } else {
        setStage('qris')
      }
    } catch (err) {
      setError(err.message)
      if (err.status && err.status < 500 && err.status !== 401) requestIdRef.current = newRequestId()
    } finally {
      setSubmitting(false)
    }
  }

  function retryPayment() {
    requestIdRef.current = newRequestId()
    setOrder(null)
    setError('')
    setStage('form')
  }

  async function copyQrUrl() {
    try {
      await navigator.clipboard.writeText(order.qrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Gagal menyalin. Tekan lama gambar QR untuk membuka alamatnya.')
    }
  }

  /* ---------------- QRIS ---------------- */
  if (stage === 'qris' && order) {
    return (
      <Shell title="Bayar dengan QRIS" onBack={() => setStage('form')}>
        <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
          <div className={`${cardCls} flex flex-col items-center gap-3 text-center`}>
            <span className="text-xs font-bold text-on-surface-variant tracking-wide">#{order.orderCode}</span>
            {order.qrUrl ? (
              <img src={order.qrUrl} alt="Kode QRIS untuk pembayaran" className="w-56 h-56 bg-white rounded-xl border border-outline-variant/50 p-2" />
            ) : (
              <p className="text-sm text-error">Kode QR belum tersedia. Kembali lalu coba lagi.</p>
            )}
            <p className="text-2xl font-bold">{rupiah(order.total)}</p>
            <p className="text-sm text-on-surface-variant">
              {secondsLeft > 0 ? `Menunggu pembayaran · berlaku ${formatTime(secondsLeft)}` : 'Menunggu konfirmasi pembayaran…'}
            </p>
            <div className="w-6 h-6 rounded-full border-2 border-outline-variant border-t-primary animate-spin" aria-hidden="true" />
          </div>

          <div className="rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm space-y-2">
            <p className="font-bold">Mode uji (Midtrans Sandbox)</p>
            <p>
              Ini kode uji, <strong>jangan dibayar dengan e-wallet atau m-banking asli</strong>. Untuk membayar:
              salin alamat gambar QR, lalu tempel di QRIS Simulator Midtrans.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={copyQrUrl} disabled={!order.qrUrl} className="px-3 py-2 rounded-full bg-primary text-white text-xs font-semibold disabled:opacity-50">
                {copied ? 'Tersalin ✓' : 'Salin alamat QR'}
              </button>
              <a href={SANDBOX_GUIDE} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-full border border-amber-400 text-xs font-semibold">
                Panduan bayar di sandbox
              </a>
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
          <p className="text-[11px] text-on-surface-variant text-center">
            Halaman ini berpindah sendiri setelah pembayaran terkonfirmasi. Kalau kamu keluar, pesanan tetap ada dan kedaluwarsa otomatis bila tidak dibayar.
          </p>
        </main>
      </Shell>
    )
  }

  /* ---------------- Berhasil ---------------- */
  if (stage === 'success') {
    return (
      <Shell title="Pembayaran">
        <main className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">check</span>
          </div>
          <h2 className="text-xl font-bold">Pembayaran berhasil!</h2>
          <p className="text-sm text-on-surface-variant">Menyiapkan struk pesanan…</p>
        </main>
      </Shell>
    )
  }

  /* ---------------- Kedaluwarsa / gagal ---------------- */
  if (stage === 'expired') {
    return (
      <Shell title="Pembayaran">
        <main className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-[44px] text-error">timer_off</span>
          <h2 className="text-xl font-bold">Pembayaran tidak selesai</h2>
          <p className="text-sm text-on-surface-variant">Kode QR sudah kedaluwarsa atau pembayaran gagal. Keranjangmu masih utuh.</p>
          <button type="button" onClick={retryPayment} className="mt-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold">
            Buat pembayaran baru
          </button>
        </main>
      </Shell>
    )
  }

  /* ---------------- Form ---------------- */
  if (items.length === 0) {
    return (
      <Shell title="Pembayaran" onBack={() => navigate('/menu')}>
        <main className="max-w-xl mx-auto px-4 py-16 text-center">
          <span className="material-symbols-outlined text-[40px] text-outline">shopping_bag</span>
          <p className="text-sm text-on-surface-variant mt-2">Keranjang kamu masih kosong.</p>
          <button type="button" onClick={() => navigate('/menu')} className="mt-4 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold">
            Lihat Menu
          </button>
        </main>
      </Shell>
    )
  }

  const canPay = !!table && !authLoading && !submitting

  return (
    <Shell title="Pembayaran" onBack={() => navigate(-1)}>
      <main className="max-w-xl mx-auto px-4 pt-4 pb-40 space-y-4">
        <section className={cardCls} aria-label="Nomor meja">
          {table ? (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container">table_restaurant</span>
              <div>
                <p className="text-xs text-on-surface-variant">Pesanan diantar ke</p>
                <p className="font-bold">Meja {table}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-error">qr_code_scanner</span>
              <div>
                <p className="font-bold text-sm">Scan QR di mejamu dulu</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Nomor meja diperlukan supaya pesanan bisa diantar. Scan QR yang ada di mejamu, lalu kembali ke halaman ini.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={cardCls} aria-label="Ringkasan pesanan">
          <h2 className="text-sm font-bold mb-3">Ringkasan</h2>
          <div className="space-y-3">
            {items.map((item) => {
              const opts = formatItemOptions(item)
              return (
                <div key={item.cartId} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.qty}× {item.name}</p>
                    {opts && <p className="text-xs text-on-surface-variant mt-0.5">{opts}</p>}
                  </div>
                  <span className="shrink-0">{rupiah(item.price * item.qty)}</span>
                </div>
              )
            })}
          </div>
          <div className="border-t border-dashed border-outline-variant mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-tertiary">{rupiah(subtotal)}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">Total final dihitung ulang oleh server saat pesanan dibuat.</p>
        </section>

        <section className={cardCls} aria-label="Metode pembayaran">
          <h2 className="text-sm font-bold mb-3">Metode pembayaran</h2>
          <div className="flex flex-col gap-2" role="radiogroup">
            {METHODS.map((m) => {
              const on = method === m.key
              return (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setMethod(m.key)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${on ? 'bg-secondary-container text-on-secondary-container border-primary' : 'bg-surface-container-lowest border-outline-variant'}`}
                >
                  <span className="material-symbols-outlined text-[22px]">{m.icon}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-on-surface-variant">{m.hint}</span>
                  </span>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? 'border-primary' : 'border-outline'}`}>
                    {on && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {error && <p role="alert" className="text-sm text-error font-medium">{error}</p>}
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-outline-variant/50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-xl mx-auto px-4 pt-3 pb-5">
          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay}
            className="w-full bg-primary hover:bg-primary-container text-white disabled:bg-surface-container-high disabled:text-outline py-3.5 rounded-full text-sm font-semibold"
          >
            {submitting
              ? 'Memproses…'
              : !table
                ? 'Scan QR meja dulu'
                : method === 'qris'
                  ? `Bayar dengan QRIS · ${rupiah(subtotal)}`
                  : `Pesan · bayar di kasir · ${rupiah(subtotal)}`}
          </button>
        </div>
      </div>
    </Shell>
  )
}
