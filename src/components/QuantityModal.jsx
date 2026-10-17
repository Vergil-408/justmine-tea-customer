import { useState, useEffect } from 'react'
import { getBasePrice } from '../utils/options.js'

function PhotoPlaceholder({ className = '' }) {
    return (
        <div className={`bg-surface-container flex items-center justify-center text-outline ${className}`}>
            <span className="material-symbols-outlined text-[28px]">image</span>
        </div>
    )
}

// Dipakai untuk menu yang TIDAK punya opsi kustomisasi (resolveOptions kosong).
export default function QuantityModal({ item, onClose, onConfirm }) {
    const [qty, setQty] = useState(1)

    // Reset qty tiap kali modal dibuka dengan item baru
    useEffect(() => {
        if (item) setQty(1)
    }, [item])

    if (!item) return null

    const unitPrice = getBasePrice(item)
    const total = unitPrice * qty

    return (
        <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative z-10 w-full lg:max-w-sm bg-background rounded-t-3xl lg:rounded-3xl shadow-2xl p-6">
                <div className="flex justify-end mb-4">
                    <button onClick={onClose} aria-label="Tutup" className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <PhotoPlaceholder className="w-full h-full" />
                    )}
                </div>

                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{item.desc}</p>

                <div className="flex items-center justify-between mt-5">
                    <span className="font-bold text-primary-container text-lg">Rp{unitPrice.toLocaleString('id-ID')}</span>
                    <div className="flex items-center gap-3 bg-surface-container-low rounded-full px-2 py-1.5">
                        <button
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            aria-label="Kurangi jumlah"
                            className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center font-bold shadow-sm"
                        >
                            −
                        </button>
                        <span className="w-6 text-center font-semibold">{qty}</span>
                        <button
                            onClick={() => setQty((q) => q + 1)}
                            aria-label="Tambah jumlah"
                            className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center font-bold shadow-sm"
                        >
                            +
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => onConfirm(qty)}
                    className="w-full mt-6 bg-primary hover:bg-primary-container text-on-primary py-3.5 rounded-full font-semibold flex items-center justify-center gap-2"
                >
                    <span>Tambah ke Keranjang</span>
                    <span className="font-bold">· Rp{total.toLocaleString('id-ID')}</span>
                </button>
            </div>
        </div>
    )
}
