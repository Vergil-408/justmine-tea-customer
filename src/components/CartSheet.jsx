import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useCartSheet } from '../context/CartSheetContext.jsx'
import { formatItemOptions } from '../utils/options.js'

export default function CartSheet() {
    const { isOpen, close } = useCartSheet()
    const { items, removeItem, updateQty, subtotal } = useCart()
    const navigate = useNavigate()

    if (!isOpen) return null

    function handleCheckout() {
        close()
        navigate('/checkout')
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={close} />

            {/* Panel: bottom sheet di mobile, modal tengah di desktop */}
            <div className="relative z-10 w-full lg:max-w-md bg-background rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-surface-container-high">
                    <h2 className="text-lg font-bold">Keranjang</h2>
                    <button onClick={close} aria-label="Tutup keranjang" className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-[40px] text-outline">shopping_bag</span>
                            <p className="text-on-surface-variant text-sm mt-2">Keranjang kamu masih kosong.</p>
                            <button
                                onClick={() => { close(); navigate('/menu') }}
                                className="mt-4 bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold"
                            >
                                Lihat Menu
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {items.map((item) => {
                                const optionsText = formatItemOptions(item)
                                return (
                                    <div key={item.cartId} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-3.5 shadow-sm">
                                        <div className="flex justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                                                {optionsText && (
                                                    <p className="text-xs text-on-surface-variant mt-0.5">{optionsText}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.cartId)}
                                                aria-label={`Hapus ${item.name}`}
                                                className="text-on-surface-variant shrink-0"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2.5">
                                            <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-1 py-1">
                                                <button
                                                    onClick={() => updateQty(item.cartId, item.qty - 1)}
                                                    aria-label="Kurangi jumlah"
                                                    className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-sm font-bold"
                                                >
                                                    −
                                                </button>
                                                <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                                                <button
                                                    onClick={() => updateQty(item.cartId, item.qty + 1)}
                                                    aria-label="Tambah jumlah"
                                                    className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-sm font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="font-bold text-primary-container">Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="px-5 pt-3 pb-6 border-t border-surface-container-high">
                        <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="text-on-surface-variant">Subtotal</span>
                            <span className="font-semibold">Rp{subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mb-3">
                            Pastikan pesanan sudah benar sebelum melanjutkan ke pembayaran.
                        </p>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-primary hover:bg-primary-container text-on-primary py-3.5 rounded-full text-sm font-semibold"
                        >
                            Konfirmasi Pesanan · Rp{subtotal.toLocaleString('id-ID')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
