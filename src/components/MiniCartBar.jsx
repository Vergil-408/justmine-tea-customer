import { useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useCartSheet } from '../context/CartSheetContext.jsx'

// Halaman yang sudah punya bar/aksi keranjang sendiri: Menu punya bar melayang,
// Customize/Checkout/Cart punya bar tombol di bawah. Di sana MiniCartBar disembunyikan
// supaya tidak bertumpuk atau menutupi tombol.
const HIDDEN_PREFIXES = ['/menu', '/customize', '/checkout', '/cart', '/login']

export default function MiniCartBar() {
    const { items, subtotal } = useCart()
    const { open, isOpen } = useCartSheet()
    const { pathname } = useLocation()
    const count = items.reduce((sum, i) => sum + i.qty, 0)

    if (count === 0 || isOpen) return null
    if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

    return (
        <button
            onClick={open}
            className="lg:hidden fixed left-4 right-4 bottom-20 z-30 bg-primary text-on-primary rounded-2xl shadow-lg px-4 py-3.5 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
            <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                <span className="text-sm font-semibold">
                    {count} produk · Rp{subtotal.toLocaleString('id-ID')}
                </span>
            </div>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
    )
}
