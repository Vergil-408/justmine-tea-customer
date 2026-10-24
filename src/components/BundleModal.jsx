import { useState, useMemo } from 'react'
import { formatRupiah } from '../utils/formatPrice.js'

// Opsi default kemanisan dan es
const SWEETNESS_CHOICES = [
  { id: 'normal', label: 'Normal (100%)' },
  { id: 'less', label: 'Sedikit (50%)' },
  { id: 'no', label: 'Tanpa Gula (0%)' },
]

const ICE_CHOICES = [
  { id: 'normal', label: 'Normal Ice' },
  { id: 'less', label: 'Sedikit Es' },
  { id: 'no', label: 'Tanpa Es' },
]

const TOPPING_CHOICES = [
  { id: 'top-boba', name: 'Pearl / Boba', price: 3000 },
  { id: 'top-grass', name: 'Grass Jelly', price: 3000 },
  { id: 'top-nata', name: 'Nata de Coco', price: 3000 },
  { id: 'top-aloe', name: 'Aloe Vera', price: 4000 },
]

export default function BundleModal({ bundle, menuItems = [], onClose, onAddToCart, cartItemCount = 0 }) {
  if (!bundle) return null

  // Bangun state awal untuk setiap slot di bundle
  const [slotSelections, setSlotSelections] = useState(() => {
    const initial = {}
    ;(bundle.slots || []).forEach((slot) => {
      // Cari default drink yang diizinkan
      const allowedDrinks = menuItems.filter(
        (m) => slot.allowedCategories?.includes(m.category) && m.inStock !== false
      )
      const defaultDrink =
        allowedDrinks.find((m) => m.id === slot.defaultMenuId) || allowedDrinks[0] || null

      initial[slot.id] = {
        menuId: defaultDrink ? defaultDrink.id : '',
        drinkName: defaultDrink ? defaultDrink.name : '',
        sugar: 'normal',
        sugarLabel: 'Normal (100%)',
        ice: 'normal',
        iceLabel: 'Normal Ice',
        topping: slot.freeTopping ? 'top-boba' : null, // jika slot freeTopping (Tea Upgrade), kasih default topping
        toppingLabel: slot.freeTopping ? 'Pearl / Boba (Gratis)' : null,
        toppingPrice: 0,
        note: '',
      }
    })
    return initial
  })

  const [qty, setQty] = useState(1)

  // Hitung harga tambahan dari topping berbayar (jika ada)
  const additionalPrice = useMemo(() => {
    let extra = 0
    ;(bundle.slots || []).forEach((slot) => {
      const sel = slotSelections[slot.id]
      if (sel?.topping && !slot.freeTopping) {
        const top = TOPPING_CHOICES.find((t) => t.id === sel.topping)
        if (top) extra += top.price
      }
    })
    return extra
  }, [bundle, slotSelections])

  const unitPrice = (bundle.price || 0) + additionalPrice
  const totalPrice = unitPrice * qty

  function handleDrinkChange(slotId, menu) {
    setSlotSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        menuId: menu.id,
        drinkName: menu.name,
      },
    }))
  }

  function handleSugarChange(slotId, choice) {
    setSlotSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        sugar: choice.id,
        sugarLabel: choice.label,
      },
    }))
  }

  function handleIceChange(slotId, choice) {
    setSlotSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        ice: choice.id,
        iceLabel: choice.label,
      },
    }))
  }

  function handleToppingToggle(slot, topping) {
    setSlotSelections((prev) => {
      const cur = prev[slot.id]
      if (cur?.topping === topping.id) {
        // Unselect (kecuali jika required free topping)
        if (slot.freeTopping) return prev // jangan unselect free topping
        return {
          ...prev,
          [slot.id]: {
            ...cur,
            topping: null,
            toppingLabel: null,
            toppingPrice: 0,
          },
        }
      }
      return {
        ...prev,
        [slot.id]: {
          ...cur,
          topping: topping.id,
          toppingLabel: slot.freeTopping ? `${topping.name} (Gratis)` : `${topping.name} (+${formatRupiah(topping.price)})`,
          toppingPrice: slot.freeTopping ? 0 : topping.price,
        },
      }
    })
  }

  function handleNoteChange(slotId, note) {
    setSlotSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        note: note.slice(0, 80),
      },
    }))
  }

  function handleAdd() {
    const formattedSlots = (bundle.slots || []).map((slot, idx) => {
      const sel = slotSelections[slot.id] || {}
      return {
        slotId: slot.id,
        slotTitle: slot.label || `Cup ${idx + 1}`,
        menuId: sel.menuId,
        drinkName: sel.drinkName || `Minuman ${idx + 1}`,
        sugar: sel.sugar,
        sugarLabel: sel.sugarLabel,
        ice: sel.ice,
        iceLabel: sel.iceLabel,
        topping: sel.topping,
        toppingLabel: sel.toppingLabel,
        toppingPrice: sel.toppingPrice || 0,
        note: sel.note || '',
      }
    })

    onAddToCart({
      id: bundle.id,
      name: bundle.name,
      price: unitPrice,
      basePrice: bundle.price,
      qty,
      isBundle: true,
      bundleSlots: formattedSlots,
      imageUrl: bundle.imageUrl,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Bar */}
        <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full" />
        </div>

        {/* Header */}
        <header className="px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors text-on-surface"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider block">
                Paket Bundling Spesial
              </span>
              <h1 className="text-base font-bold text-on-surface leading-tight line-clamp-1">{bundle.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bundle.badge && (
              <span className="bg-primary-container text-on-primary font-bold text-[11px] px-2.5 py-1 rounded-full shadow-sm">
                {bundle.badge}
              </span>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Banner & Ringkasan Hemat */}
          <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 shadow-sm">
            <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-36 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white">
              <p className="text-xs text-white/90 font-medium">{bundle.desc}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-black text-amber-300">{formatRupiah(bundle.price)}</span>
                <span className="text-xs line-through text-white/60">{formatRupiah(bundle.originalPrice)}</span>
                <span className="bg-amber-400 text-stone-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  HEMAT {formatRupiah(bundle.savings)}
                </span>
              </div>
            </div>
          </div>

          {/* Slots Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#316342] text-lg">local_cafe</span>
                Atur Pilihan Cup ({bundle.slots?.length || 0} Minuman)
              </h2>
              <span className="text-[11px] text-on-surface-variant font-medium">Bisa beda rasa & gula!</span>
            </div>

            {(bundle.slots || []).map((slot, sIdx) => {
              const sel = slotSelections[slot.id] || {}
              const allowedDrinks = menuItems.filter(
                (m) => slot.allowedCategories?.includes(m.category) && m.inStock !== false
              )

              return (
                <div
                  key={slot.id}
                  className="p-4 rounded-2xl border-2 border-outline-variant/40 bg-surface-container-low/30 space-y-3.5"
                >
                  {/* Slot Title */}
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#316342] text-white text-xs font-bold flex items-center justify-center">
                        {sIdx + 1}
                      </span>
                      <strong className="text-sm text-on-surface">{slot.label || `Cup ${sIdx + 1}`}</strong>
                    </div>
                    {slot.freeTopping && (
                      <span className="text-[11px] font-bold text-[#316342] bg-[#316342]/10 px-2 py-0.5 rounded-full">
                        FREE Topping!
                      </span>
                    )}
                  </div>

                  {/* 1. Pilih Minuman */}
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1.5">
                      Pilih Minuman:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {allowedDrinks.map((m) => {
                        const isPicked = sel.menuId === m.id
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleDrinkChange(slot.id, m)}
                            className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2 ${
                              isPicked
                                ? 'border-[#316342] bg-[#316342]/10 ring-1 ring-[#316342]'
                                : 'border-outline-variant/50 hover:bg-surface-variant/40'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-base ${
                                isPicked ? 'text-[#316342]' : 'text-outline'
                              }`}
                            >
                              {isPicked ? 'radio_button_checked' : 'radio_button_unchecked'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold leading-tight line-clamp-1 ${isPicked ? 'text-[#316342]' : 'text-on-surface'}`}>
                                {m.name}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 2. Manis & Es */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Gula */}
                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Gula (Sweetness):
                      </label>
                      <div className="flex gap-1.5">
                        {SWEETNESS_CHOICES.map((c) => {
                          const active = sel.sugar === c.id
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSugarChange(slot.id, c)}
                              className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold border transition-all text-center ${
                                active
                                  ? 'bg-[#316342] text-white border-[#316342]'
                                  : 'border-outline-variant/60 text-on-surface hover:bg-surface-variant'
                              }`}
                            >
                              {c.label.split(' ')[0]}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Es */}
                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Es Batu (Ice):
                      </label>
                      <div className="flex gap-1.5">
                        {ICE_CHOICES.map((c) => {
                          const active = sel.ice === c.id
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleIceChange(slot.id, c)}
                              className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold border transition-all text-center ${
                                active
                                  ? 'bg-[#316342] text-white border-[#316342]'
                                  : 'border-outline-variant/60 text-on-surface hover:bg-surface-variant'
                              }`}
                            >
                              {c.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3. Topping (jika diizinkan atau free topping) */}
                  {(slot.freeTopping || slot.allowedCategories?.some((c) => ['fruit', 'milktea', 'signature'].includes(c))) && (
                    <div className="pt-1">
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1.5">
                        {slot.freeTopping ? 'Pilih 1 Free Topping (Termasuk Paket):' : 'Tambah Topping Ekstra (Opsional):'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TOPPING_CHOICES.map((top) => {
                          const isChosen = sel.topping === top.id
                          return (
                            <button
                              key={top.id}
                              type="button"
                              onClick={() => handleToppingToggle(slot, top)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                                isChosen
                                  ? 'bg-[#316342] text-white border-[#316342]'
                                  : 'border-outline-variant/60 text-on-surface hover:bg-surface-variant'
                              }`}
                            >
                              <span>{top.name}</span>
                              <span className="text-[10px] opacity-80">
                                {slot.freeTopping ? 'Gratis' : `+${formatRupiah(top.price)}`}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Catatan Barista */}
                  <div>
                    <input
                      type="text"
                      placeholder={`Catatan untuk ${slot.label || `Cup ${sIdx + 1}`} (misal: pisah es batu)`}
                      value={sel.note || ''}
                      onChange={(e) => handleNoteChange(slot.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-[#316342]"
                      maxLength={80}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Bar */}
        <footer className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-on-surface-variant font-medium">Total Paket</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded">
                Hemat {formatRupiah(bundle.savings * qty)}
              </span>
            </div>
            <p className="text-xl font-black text-[#316342] leading-none mt-0.5">{formatRupiah(totalPrice)}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Stepper */}
            <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl px-1.5 py-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm text-on-surface hover:bg-surface-variant active:scale-95 transition-transform"
                disabled={qty <= 1}
              >
                −
              </button>
              <span className="w-7 text-center font-bold text-sm text-on-surface">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm text-on-surface hover:bg-surface-variant active:scale-95 transition-transform"
              >
                +
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleAdd}
              className="bg-[#316342] hover:bg-[#285237] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md active:scale-98 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">shopping_bag</span>
              <span>Tambah Paket</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
