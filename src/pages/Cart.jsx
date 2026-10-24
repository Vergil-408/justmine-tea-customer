import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatRupiah } from '../utils/formatPrice.js'
import { formatItemOptions } from '../utils/options.js'
import BottomNav from '../components/BottomNav.jsx'
import DesktopNav from '../components/DesktopNav.jsx'

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, removeItem, updateQty, subtotal } = useCart()

  return (
    <div className="app-shell">
      <DesktopNav />
      <div className="topbar">
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>←</span>
        <h1>Keranjang</h1>
        <span style={{ visibility: 'hidden' }}>x</span>
      </div>

      <div style={{ padding: '0 20px' }}>
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined icon" style={{ fontSize: 40 }}>shopping_bag</span>
            <p>Keranjang kamu masih kosong.</p>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/menu')}>
              Lihat Menu
            </button>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.cartId} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 14 }}>{item.name}</strong>
                      {item.isBundle && (
                        <span style={{ fontSize: 10, background: '#e8f3ed', color: '#316342', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          Bundling
                        </span>
                      )}
                    </div>
                    {formatItemOptions(item) && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                        {formatItemOptions(item)}
                      </p>
                    )}
                  </div>
                  <span
                    className="material-symbols-outlined"
                    style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 18 }}
                    onClick={() => removeItem(item.cartId)}
                  >
                    delete
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <div className="stepper">
                    <button onClick={() => updateQty(item.cartId, item.qty - 1)}>−</button>
                    <span style={{ fontWeight: 700 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.cartId, item.qty + 1)}>+</button>
                  </div>
                  <span className="price-tag">{formatRupiah(item.price * item.qty)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="bottom-fixed">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
            <strong style={{ color: 'var(--color-sage-dark)' }}>{formatRupiah(subtotal)}</strong>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              if (!user) {
                navigate('/login', { state: { from: '/checkout', promptSignup: true } })
              } else {
                navigate('/checkout')
              }
            }}
          >
            Lanjut ke Pembayaran · {formatRupiah(subtotal)}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Cart;
