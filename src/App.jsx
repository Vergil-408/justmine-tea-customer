import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import Cart from './pages/Cart.jsx'
import Customize from './pages/Customize.jsx'
import Checkout from './pages/Checkout.jsx'
import Tracking from './pages/Tracking.jsx'
import Receipt from './pages/Receipt.jsx'
import History from './pages/History.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/auth/Login.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { TableProvider } from './context/TableContext.jsx'

export default function App() {
  return (
    <TableProvider>
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/customize/:id" element={<Customize />} />
        {/* Checkout sengaja tidak diproteksi: pesanan tamu (guest) diizinkan,
            lihat Checkout.jsx (userId: null) — cuma pesanan yang login dapat poin. */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/tracking/:orderId" element={<Tracking />} />
        <Route path="/receipt/:orderId" element={<Receipt />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </NotificationProvider>
    </TableProvider>
  )
}
