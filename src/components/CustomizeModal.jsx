import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { useOptionGroups } from '../hooks/useOptionGroups.js'
import {
  resolveOptions,
  normalizeSelection,
  validateSelection,
  buildSelectedOptions,
  computeUnitPrice,
  getBasePrice,
  isFoodCategory,
  isSignatureCategory,
} from '../utils/options.js'

function rupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID')
}

// Icon mapper untuk pilihan gula & es
const CHOICE_ICONS = {
  // Gula
  normal: 'water_drop',
  less: 'opacity',
  no: 'block',
  g100: 'water_drop',
  g50: 'opacity',
  g0: 'block',
  // Es
  es_normal: 'ac_unit',
  es_less: 'severe_cold',
  es_no: 'block',
  sedikit: 'severe_cold',
  tanpa: 'block',
  panas: 'local_fire_department',
  // Topping
  pearl: 'bubble_chart',
  grass_jelly: 'layers',
  jelly: 'layers',
  nata: 'grain',
  aloe: 'spa',
  lemon: 'lunch_dining',
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'

export default function CustomizeModal({ item, isOpen, onClose }) {
  const { addItem } = useCart()
  const { groups } = useOptionGroups()

  const resolved = useMemo(() => resolveOptions(item, groups), [item, groups])

  const [rawSelection, setRawSelection] = useState({})
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [addedAnimation, setAddedAnimation] = useState(false)

  // Reset state saat modal dibuka untuk item tertentu
  useEffect(() => {
    if (isOpen && item) {
      setRawSelection(normalizeSelection(resolved, {}))
      setQty(1)
      setNote('')
      setAddedAnimation(false)
    }
  }, [isOpen, item, resolved])

  const selection = useMemo(
    () => normalizeSelection(resolved, rawSelection),
    [resolved, rawSelection]
  )

  // Gabungkan note ke dalam selection jika ada grup catatan
  const fullSelection = useMemo(() => {
    const s = { ...selection }
    if (resolved.some((g) => g.ui === 'note' || g.id === 'catatan')) {
      s.catatan = note.trim()
    }
    return s
  }, [selection, note, resolved])

  if (!isOpen || !item) return null

  const isFoodOrSweets = isFoodCategory(item)
  const isNoTopping = isFoodOrSweets || isSignatureCategory(item.category)

  // Pisahkan grup opsi: Gula, Es, Topping, Catatan
  const sugarGroup = !isFoodOrSweets
    ? resolved.find((g) => g.id === 'gula') || {
        id: 'gula',
        label: 'Tingkat Kemanisan',
        choices: [
          { id: 'normal', label: 'Normal (100%)', priceDelta: 0 },
          { id: 'less', label: 'Sedikit (50%)', priceDelta: 0 },
          { id: 'no', label: 'Tanpa Gula (0%)', priceDelta: 0 },
        ],
      }
    : null

  const iceGroup = !isFoodOrSweets
    ? resolved.find((g) => g.id === 'es') || {
        id: 'es',
        label: 'Tingkat Es Batu',
        choices: [
          { id: 'normal', label: 'Normal Ice', priceDelta: 0 },
          { id: 'less', label: 'Sedikit Es', priceDelta: 0 },
          { id: 'no', label: 'Tanpa Es', priceDelta: 0 },
        ],
      }
    : null

  const toppingGroup = !isNoTopping
    ? resolved.find((g) => g.id === 'topping' || g.id === 'topping_tea' || g.type === 'multi') || {
        id: 'topping',
        label: 'Topping Tambahan',
        type: 'multi',
        choices: [
          { id: 'top-boba', label: 'Pearl / Boba', priceDelta: 3000 },
          { id: 'top-grass', label: 'Grass Jelly', priceDelta: 3000 },
          { id: 'top-nata', label: 'Nata de Coco', priceDelta: 3000 },
          { id: 'top-aloe', label: 'Aloe Vera', priceDelta: 4000 },
        ],
      }
    : null


  // Hitung harga per cup
  const selectedToppings = (toppingGroup && Array.isArray(rawSelection[toppingGroup.id]))
    ? rawSelection[toppingGroup.id]
    : []
  const toppingDelta = selectedToppings.reduce((sum, tid) => {
    const c = toppingGroup?.choices.find((ch) => ch.id === tid)
    return sum + (c?.priceDelta ?? 0)
  }, 0)
  const unitPrice = getBasePrice(item) + toppingDelta
  const grandTotal = unitPrice * qty

  // Handlers pilihan
  function handleSelectSingle(groupId, choiceId) {
    setRawSelection((prev) => ({
      ...prev,
      [groupId]: [choiceId],
    }))
  }

  function handleToggleMulti(groupId, choiceId) {
    const current = Array.isArray(rawSelection[groupId]) ? rawSelection[groupId] : []
    const next = current.includes(choiceId)
      ? current.filter((id) => id !== choiceId)
      : [...current, choiceId]
    setRawSelection((prev) => ({
      ...prev,
      [groupId]: next,
    }))
  }

  function changeQty(delta) {
    setQty((q) => Math.max(1, Math.min(20, q + delta)))
  }

  function handleAddToCart() {
    const customOptions = []

    if (!isFoodOrSweets) {
      const sugarChoice =
        sugarGroup?.choices.find((c) => (rawSelection.gula || []).includes(c.id)) ||
        sugarGroup?.choices[0]
      const iceChoice =
        iceGroup?.choices.find((c) => (rawSelection.es || []).includes(c.id)) ||
        iceGroup?.choices[0]

      if (sugarChoice) {
        customOptions.push({
          groupId: 'gula',
          groupLabel: 'Tingkat Kemanisan',
          choiceId: sugarChoice.id,
          choiceLabel: sugarChoice.label || 'Normal (100%)',
          priceDelta: 0,
        })
      }
      if (iceChoice) {
        customOptions.push({
          groupId: 'es',
          groupLabel: 'Tingkat Es Batu',
          choiceId: iceChoice.id,
          choiceLabel: iceChoice.label || 'Normal Ice',
          priceDelta: 0,
        })
      }

      // Toppings (hanya untuk kategori yang mengizinkan topping)
      if (toppingGroup && Array.isArray(rawSelection[toppingGroup.id])) {
        for (const tid of rawSelection[toppingGroup.id]) {
          const topChoice = toppingGroup.choices.find((c) => c.id === tid)
          if (topChoice) {
            customOptions.push({
              groupId: 'topping',
              groupLabel: 'Topping',
              choiceId: topChoice.id,
              choiceLabel: topChoice.label,
              priceDelta: topChoice.priceDelta || 0,
            })
          }
        }
      }
    }

    if (note.trim()) {
      customOptions.push({
        groupId: 'catatan',
        groupLabel: 'Catatan',
        choiceId: 'note',
        choiceLabel: note.trim().slice(0, 80),
        priceDelta: 0,
      })
    }


    setAddedAnimation(true)

    addItem({
      id: item.id,
      name: item.name,
      price: unitPrice,
      qty,
      type: 'custom',
      selectedOptions: customOptions,
    })

    setTimeout(() => {
      setAddedAnimation(false)
      onClose()
    }, 500)
  }

  const basePrice = getBasePrice(item)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sheet Container: Bottom sheet di mobile, centered card di tablet/desktop */}
      <div className="relative z-10 w-full sm:max-w-4xl bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250">
        {/* Drag Handle (Mobile Only) */}
        <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-outline-variant" />
        </div>

        {/* Header Modal */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-outline-variant/40 flex items-center justify-between shrink-0 bg-surface-container-lowest/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Kembali"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all -ml-1"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-secondary uppercase">
                Justmine Tea
              </span>
              <h2 className="text-sm sm:text-base font-bold text-on-surface leading-tight">
                Kustomisasi Minuman
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body: Split 2 Kolom di Desktop, Stack di Mobile */}
        <div className="overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pb-28">
          {/* ================= KIRI: DETAIL PRODUK & FOTO ================= */}
          <div className="lg:col-span-5 flex flex-col gap-3 min-w-0">
            {/* Foto Produk dengan Badges */}
            <div className="relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm bg-surface-container">
              <img
                src={item.imageUrl || DEFAULT_IMAGE}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[11px] font-bold shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                  Best Seller
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-primary text-[11px] font-bold shadow-sm capitalize">
                  {item.category ? `${item.category} Tea` : 'Fresh Brew'}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[15px] text-primary-fixed">eco</span>
                  Daun Teh Pilihan
                </span>
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[15px] text-tertiary-fixed">grade</span>
                  4.9 (1.2k)
                </span>
              </div>
            </div>

            {/* Nama & Deskripsi */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 flex flex-col gap-1.5 shadow-xs min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-on-surface leading-tight break-words">
                    {item.name}
                  </h3>
                  <p className="text-xs text-secondary font-medium mt-0.5">
                    Kategori: {item.category || 'Teh Nusantara'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg sm:text-xl font-extrabold text-primary block">
                    {rupiah(basePrice)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Harga Dasar</span>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed mt-1 break-words [overflow-wrap:anywhere]">
                {item.desc || 'Seduhan artisan daun teh alami dengan racikan segar pilihan.'}
              </p>

              {/* Tag Info */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/30 mt-1">
                {!isFoodOrSweets && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-secondary text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[13px]">ac_unit</span>
                    Iced Only
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">
                  <span className="material-symbols-outlined text-[13px]">{isFoodOrSweets ? 'bakery_dining' : 'local_drink'}</span>
                  {isFoodOrSweets ? 'Fresh Snack' : 'Cup 500ml'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">
                  <span className="material-symbols-outlined text-[13px]">timer</span>
                  Fresh ±3 Menit
                </span>
              </div>
            </div>
          </div>

          {/* ================= KANAN: STEP RACIKAN KUSTOMISASI ================= */}
          <div className="lg:col-span-7 flex flex-col gap-4 min-w-0">
            {/* STEP 1: Tingkat Kemanisan */}
            {sugarGroup && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/50 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <h4 className="font-bold text-sm text-on-surface">{sugarGroup.label}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                    WAJIB
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Pilih takaran kemanisan teh:</p>

                <div className="grid grid-cols-3 gap-2">
                  {sugarGroup.choices.map((c) => {
                    const picked = (rawSelection.gula || ['normal']).includes(c.id)
                    const icon = CHOICE_ICONS[c.id] || 'water_drop'
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectSingle('gula', c.id)}
                        className={`w-full py-2.5 px-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all border ${
                          picked
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-on-surface border-outline-variant/60 hover:border-primary/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                        <span className="text-xs font-semibold">{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Tingkat Es Batu */}
            {iceGroup && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/50 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <h4 className="font-bold text-sm text-on-surface">{iceGroup.label}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                    WAJIB
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Pilih kadar dingin yang diinginkan:</p>

                <div className="grid grid-cols-3 gap-2">
                  {iceGroup.choices.map((c) => {
                    const picked = (rawSelection.es || ['normal']).includes(c.id)
                    const icon = CHOICE_ICONS[c.id] || CHOICE_ICONS[`es_${c.id}`] || 'ac_unit'
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectSingle('es', c.id)}
                        className={`w-full py-2.5 px-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all border ${
                          picked
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-on-surface border-outline-variant/60 hover:border-primary/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                        <span className="text-xs font-semibold">{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Topping Tambahan (HANYA MUNCUL JIKA ITEM MENDUKUNG TOPPING) */}
            {toppingGroup && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/50 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <h4 className="font-bold text-sm text-on-surface">{toppingGroup.label}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                    BISA PILIH LEBIH DARI SATU
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Pilihan topping lezat Justmine Tea:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {toppingGroup.choices.map((c) => {
                    const picked = (rawSelection[toppingGroup.id] || []).includes(c.id)
                    const icon = CHOICE_ICONS[c.id] || 'bubble_chart'
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleMulti(toppingGroup.id, c.id)}
                        className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between text-left shadow-xs ${
                          picked
                            ? 'bg-secondary-container/25 border-primary'
                            : 'bg-white border-outline-variant/60 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              picked ? 'bg-primary text-white' : 'bg-surface-container text-on-surface'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{icon}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface">{c.label}</span>
                            <span className="text-[11px] font-semibold text-secondary">
                              +{rupiah(c.priceDelta)}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            picked
                              ? 'bg-primary border-primary text-white'
                              : 'border-outline-variant text-transparent'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">done</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Catatan untuk Barista / Dapur */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/50 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant text-[11px] flex items-center justify-center font-bold">
                    {isFoodOrSweets ? '1' : toppingGroup ? '4' : '3'}
                  </span>
                  <h4 className="font-bold text-sm text-on-surface">
                    {isFoodOrSweets ? 'Catatan Pesanan' : 'Catatan untuk Barista'}
                  </h4>
                </div>
                <span className="text-[10px] text-secondary font-medium">Maks. 80 Karakter</span>
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 80))}
                maxLength={80}
                placeholder={isFoodOrSweets ? 'Contoh: Hangatkan dulu, jangan terlalu garing...' : 'Contoh: Sedikit es dipisah, banyakin mint...'}
                className="w-full bg-surface-container-low text-on-surface rounded-xl px-3.5 py-2 text-xs placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* ================= BOTTOM ACTION BAR (STICKY) ================= */}
        <div className="sticky bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-xl border-t border-outline-variant/50 px-4 py-3 sm:px-6 sm:py-3.5 shadow-lg flex items-center justify-between gap-3">
          {/* Total & Stepper */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
              Total Pembayaran
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-extrabold text-primary tracking-tight">
                {rupiah(grandTotal)}
              </span>
            </div>
            {/* Stepper Qty */}
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => changeQty(-1)}
                className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface active:scale-95 transition-all text-xs font-bold"
              >
                -
              </button>
              <span className="text-xs font-bold text-on-surface w-4 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => changeQty(1)}
                className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface active:scale-95 transition-all text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Tombol Tambah ke Pesanan */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              addedAnimation
                ? 'bg-secondary scale-95'
                : 'bg-primary hover:bg-primary-container active:scale-[0.98]'
            }`}
          >
            {addedAnimation ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-bounce">done</span>
                <span>Tersimpan ke Keranjang!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                <span className="truncate">Tambah ke Pesanan • {rupiah(grandTotal)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
