import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase.js'

export default function Receipt() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() })
    })
    return () => unsub()
  }, [orderId])

  if (!order) return <div className="app-shell"><p style={{ padding: 20 }}>Memuat struk...</p></div>

  const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date()

  return (
    <div className="app-shell">
      <div className="topbar">
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>←</span>
        <h1>E-Receipt</h1>
        <span style={{ visibility: 'hidden' }}>x</span>
      </div>

      <div style={{ padding: '10px 20px' }}>
        <div className="receipt-box">
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 22 }}>🍃</div>
            <strong>Justmine Tea</strong>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              #{order.orderCode} · {date.toLocaleDateString('id-ID')} {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="receipt-divider" />

          {order.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{item.qty}× {item.name}</span>
                <span>Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
              </div>
              {item.detail && (
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0 12px' }}>
                  Base: {item.detail.base} · Manis: {item.detail.sweetness} · Es: {item.detail.ice} · Susu: {item.detail.milk}
                  {item.detail.toppings.length > 0 && ` · Topping: ${item.detail.toppings.join(', ')}`}
                </p>
              )}
            </div>
          ))}

          <div className="receipt-divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span>
            <span>Rp{order.total.toLocaleString('id-ID')}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
            Metode: {order.paymentMethod}
          </p>

          <div className="receipt-divider" />
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
            Terima kasih sudah memesan di Justmine Tea 🍵
          </p>
        </div>
      </div>
    </div>
  )
}