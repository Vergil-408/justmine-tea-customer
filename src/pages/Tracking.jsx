import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore'
import { db } from '../api/firebase.js'

const steps = [
  { key: 'menunggu', label: 'Menunggu', icon: '⏳' },
  { key: 'diproses', label: 'Diproses', icon: '🍵' },
  { key: 'siap', label: 'Siap Diambil', icon: '🔔' },
]

const paymentIcons = {
  QRIS: '📱',
  'E-Wallet': '💳',
  'Cash on Pickup': '💵',
}

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

  // Hitung posisi antrean: pesanan lain yang masih menunggu/diproses berdasarkan urutan kronologis submit (FIFO)
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
        // Fallback ke waktu sekarang agar pesanan baru tidak menempati nomor 1 di depan pesanan yang sudah ada
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

      // Urutkan secara kronologis (yang submit lebih dulu berada di antrian awal)
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
    if (!order) return
    navigator.clipboard?.writeText(order.orderCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  if (!order) {
    return (
      <div className="app-shell">
        <div className="topbar"><h1>Tracking</h1><span /></div>
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minHeight: '50vh', justifyContent: 'center' }}>
          <div className="payment-spinner" />
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Memuat data pesanan...</p>
        </div>
      </div>
    )
  }

  const isCancelled = order.status === 'dibatalkan'
  const isDone = order.status === 'selesai'
  // Buat progress bar: 'selesai' dianggap sama kayak sudah lewat semua step.
  const currentIndex = isDone ? steps.length : steps.findIndex((s) => s.key === order.status)
  const estimateMinutes = queuePosition ? queuePosition * 4 : null
  const itemsTotal = order.items.reduce((sum, it) => sum + it.price * it.qty, 0)

  return (
    <div className="app-shell">
      <div className="topbar">
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>←</span>
        <h1>Lacak Pesanan</h1>
        <span style={{ visibility: 'hidden' }}>x</span>
      </div>

      <div style={{ padding: '10px 20px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button className="order-code-row" onClick={copyOrderCode}>
              #{order.orderCode} {copied ? '✓ Tersalin' : '⧉'}
            </button>
            {(order.customerName || order.userName) && (
              <span className="payment-method-chip" style={{ background: '#EAF1E8', color: '#3F6B3E', fontWeight: 600 }}>
                👤 {order.customerName || order.userName}
              </span>
            )}
            {order.paymentMethod && (
              <span className="payment-method-chip">
                {paymentIcons[order.paymentMethod] || '💰'} {order.paymentMethod}
              </span>
            )}
            {!order.userId && <span className="guest-order-badge">👤 Tamu</span>}
          </div>

          <span className={`status-badge status-${order.status}`}>
            {isDone ? 'Selesai' : isCancelled ? 'Dibatalkan' : steps.find((s) => s.key === order.status)?.label}
          </span>

          {!isCancelled && (
            <div className="progress-track">
              {steps.map((s, i) => (
                <div key={s.key} className={`progress-step ${i < currentIndex ? 'done' : ''} ${i === currentIndex ? 'active' : ''}`}>
                  {i > 0 && <div className="progress-line" />}
                  <div className="progress-dot">{i < currentIndex ? '✓' : s.icon}</div>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {isCancelled && (
            <div className="ready-celebrate">
              <span className="emoji">😔</span>
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                Pesanan ini dibatalkan. Hubungi kasir kalau ada pertanyaan.
              </p>
            </div>
          )}

          {!isCancelled && !isDone && order.status !== 'siap' && queuePosition && (
            <div style={{ marginTop: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Posisi antrean</p>
              <h2 style={{ color: 'var(--color-sage-dark)', margin: '2px 0' }}>#{queuePosition}</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                Estimasi ~{estimateMinutes} menit
              </p>
            </div>
          )}

          {order.status === 'siap' && (
            <div className="ready-celebrate">
              <span className="emoji">🎉</span>
              <p style={{ margin: 0, color: 'var(--color-green-status)', fontWeight: 700 }}>
                Pesanan siap diambil di counter!
              </p>
            </div>
          )}
        </div>

        <div className="section-title" style={{ padding: 0, marginLeft: 0, marginTop: 20 }}>Detail Pesanan</div>
        <div className="card">
          {order.items.map((item, idx) => (
            <div key={idx} className="option-row">
              <div>
                <div>{item.qty}× {item.name}</div>
                {item.detail && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    {item.detail.base} · {item.detail.sweetness} · {item.detail.ice}
                  </p>
                )}
              </div>
              <span>Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
            </div>
          ))}
          <div className="receipt-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-sage-dark)' }}>Rp{(order.total ?? itemsTotal).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <Link to={`/receipt/${order.id}`} style={{ textDecoration: 'none' }}>
          <button className="btn-outline" style={{ marginTop: 16 }}>🧾 Lihat E-Receipt</button>
        </Link>
      </div>
    </div>
  )
}
