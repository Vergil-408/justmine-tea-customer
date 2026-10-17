import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuItems } from '../hooks/useMenuItems.js'
import { useOptionGroups } from '../hooks/useOptionGroups.js'
import { useCart } from '../context/CartContext.jsx'
import { useCartSheet } from '../context/CartSheetContext.jsx'
import {
  resolveOptions,
  normalizeSelection,
  isGroupVisible,
  validateSelection,
  buildSelectedOptions,
  computeUnitPrice,
} from '../utils/options.js'

const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')
const deltaText = (c) => (c.priceDelta > 0 ? `+${rupiah(c.priceDelta)}` : '')

const pickedClass = 'bg-secondary-container text-on-secondary-container border-primary'
const idleClass = 'bg-surface-container-lowest text-on-surface border-outline-variant'

/* ---------- komponen per `ui` ---------- */

function CardsChoice({ group, value, onPick }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {group.choices.map((c) => {
        const on = value.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            disabled={!c.available}
            aria-pressed={on}
            onClick={() => onPick(c)}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${on ? pickedClass : idleClass}`}
          >
            {c.icon && <span className="material-symbols-outlined text-[22px]">{c.icon}</span>}
            <span>{c.label}</span>
            {!c.available ? (
              <span className="text-[10px] font-normal">Habis</span>
            ) : deltaText(c) ? (
              <span className="text-[10px] font-normal">{deltaText(c)}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function SegmentedChoice({ group, value, onPick }) {
  return (
    <div className="flex gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-1">
      {group.choices.map((c) => {
        const on = value.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            disabled={!c.available}
            aria-pressed={on}
            onClick={() => onPick(c)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${on ? 'bg-primary text-white' : 'text-on-surface'}`}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

function SliderChoice({ group, value, onPick }) {
  const idx = Math.max(0, group.choices.findIndex((c) => c.id === value[0]))
  return (
    <div>
      <input
        type="range"
        min={0}
        max={group.choices.length - 1}
        step={1}
        value={idx}
        aria-label={group.label}
        onChange={(e) => {
          const c = group.choices[Number(e.target.value)]
          if (c?.available) onPick(c)
        }}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
        {group.choices.map((c) => (
          <span key={c.id} className={c.id === value[0] ? 'font-bold text-on-surface' : ''}>{c.label}</span>
        ))}
      </div>
    </div>
  )
}

function RadioChoice({ group, value, onPick }) {
  return (
    <div className="flex flex-col gap-2">
      {group.choices.map((c) => {
        const on = value.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!c.available}
            onClick={() => onPick(c)}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${on ? pickedClass : idleClass}`}
          >
            <span className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? 'border-primary' : 'border-outline'}`}>
                {on && <span className="w-2 h-2 rounded-full bg-primary" />}
              </span>
              <span className="font-semibold">{c.label}</span>
            </span>
            <span className="text-xs text-on-surface-variant">
              {!c.available ? 'Habis' : deltaText(c)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ToppingsChoice({ group, value, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {group.choices.map((c) => {
        const on = value.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            disabled={!c.available}
            aria-pressed={on}
            onClick={() => onToggle(c)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${on ? pickedClass : idleClass}`}
          >
            {on && <span className="material-symbols-outlined text-[16px]">check</span>}
            {c.label}
            <span className="text-xs font-normal">{!c.available ? 'Habis' : deltaText(c)}</span>
          </button>
        )
      })}
    </div>
  )
}

function NoteChoice({ group, value, onNote }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onNote(e.target.value)}
      maxLength={120}
      rows={2}
      aria-label={group.label}
      placeholder="Contoh: tanpa sedotan"
      className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
    />
  )
}

function Notice({ children, onBack }) {
  return (
    <div className="min-h-screen bg-background font-sans text-on-surface flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-on-surface-variant">{children}</p>
      <button type="button" onClick={onBack} className="text-sm font-semibold text-primary-container underline underline-offset-4">
        Kembali ke menu
      </button>
    </div>
  )
}

/* ---------- halaman ---------- */

export default function Customize() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { open: openCartSheet } = useCartSheet()
  const { items } = useMenuItems()
  const { groups, loading: groupsLoading } = useOptionGroups()

  const item = items.find((m) => m.id === id)
  const resolved = useMemo(() => resolveOptions(item, groups), [item, groups])

  // `raw` = pilihan user; `selection` = raw yang sudah dinormalisasi (default otomatis + showIf)
  const [raw, setRaw] = useState({})
  const [qty, setQty] = useState(1)
  const selection = useMemo(() => normalizeSelection(resolved, raw), [resolved, raw])

  const goMenu = () => navigate('/menu')

  if (groupsLoading) return <Notice onBack={goMenu}>Memuat pilihan…</Notice>
  if (!item) return <Notice onBack={goMenu}>Menu tidak ditemukan.</Notice>
  if (!item.inStock) return <Notice onBack={goMenu}>Menu ini sedang habis.</Notice>
  if (resolved.length === 0) return <Notice onBack={goMenu}>Menu ini tidak punya pilihan kustomisasi.</Notice>

  const visibleGroups = resolved.filter((g) => isGroupVisible(g, selection))
  const { valid, errors } = validateSelection(resolved, selection)
  const selectedOptions = buildSelectedOptions(resolved, selection)
  const unitPrice = computeUnitPrice(item, selectedOptions)
  const total = unitPrice * qty

  function pickSingle(group, choice) {
    if (!choice.available) return
    setRaw({ ...selection, [group.id]: [choice.id] })
  }

  function toggleMulti(group, choice) {
    if (!choice.available) return
    const current = selection[group.id] ?? []
    if (current.includes(choice.id)) {
      setRaw({ ...selection, [group.id]: current.filter((x) => x !== choice.id) })
    } else {
      if (group.max != null && current.length >= group.max) return
      setRaw({ ...selection, [group.id]: [...current, choice.id] })
    }
  }

  function setNote(group, text) {
    setRaw({ ...selection, [group.id]: text })
  }

  function handleAdd() {
    if (!valid) return
    addItem({
      id: item.id,
      name: item.name,
      price: unitPrice,
      qty,
      type: 'custom',
      selectedOptions,
    })
    navigate(-1)
    openCartSheet()
  }

  function renderGroup(group) {
    const value = selection[group.id]
    if (group.ui === 'note') return <NoteChoice group={group} value={value ?? ''} onNote={(t) => setNote(group, t)} />
    const picked = value ?? []
    if (group.type === 'multi' || group.ui === 'toppings') {
      return <ToppingsChoice group={group} value={picked} onToggle={(c) => toggleMulti(group, c)} />
    }
    const onPick = (c) => pickSingle(group, c)
    if (group.ui === 'segmented') return <SegmentedChoice group={group} value={picked} onPick={onPick} />
    if (group.ui === 'slider') return <SliderChoice group={group} value={picked} onPick={onPick} />
    if (group.ui === 'radio') return <RadioChoice group={group} value={picked} onPick={onPick} />
    return <CardsChoice group={group} value={picked} onPick={onPick} />
  }

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/50">
        <div className="max-w-xl mx-auto h-14 px-4 flex items-center gap-2">
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-base font-semibold truncate">{item.name}</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 pb-44 space-y-3">
        {item.desc && <p className="text-sm text-on-surface-variant">{item.desc}</p>}

        {visibleGroups.map((group) => (
          <section
            key={group.id}
            aria-label={group.label}
            className="bg-surface-container-lowest border border-outline-variant/50 shadow-sm rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold">{group.label}</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                {group.required ? 'Wajib' : 'Opsional'}
              </span>
            </div>
            {renderGroup(group)}
          </section>
        ))}
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-outline-variant/50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-xl mx-auto px-4 pt-3 pb-5 space-y-2.5">
          {!valid && <p className="text-xs text-error font-medium">{errors[0]?.message}</p>}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-surface-container-low rounded-full px-2 py-1.5 shrink-0">
              <button
                type="button"
                aria-label="Kurangi jumlah"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center font-bold shadow-sm"
              >
                −
              </button>
              <span className="w-5 text-center font-semibold">{qty}</span>
              <button
                type="button"
                aria-label="Tambah jumlah"
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center font-bold shadow-sm"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={!valid}
              onClick={handleAdd}
              className="flex-1 bg-primary hover:bg-primary-container text-white disabled:bg-surface-container-high disabled:text-outline py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
            >
              <span>Tambah</span>
              <span className="font-bold">· {rupiah(total)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
