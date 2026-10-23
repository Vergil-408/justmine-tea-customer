import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../api/firebase'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCartSheet } from '../context/CartSheetContext'
import { getGuestOrderIds } from '../utils/guestOrders.js'
import MobileHeader from '../components/MobileHeader.jsx'
import DesktopNav from '../components/DesktopNav.jsx'
import BottomNav from '../components/BottomNav.jsx'

/* ---------------- Konstanta & helper ---------------- */

// Warna status disamakan dengan Home, Tracking, dan Kasir App.
const STATUS = {
  menunggu: { label: 'Menunggu', badge: 'bg-tertiary-fixed text-tertiary ring-tertiary/30', dot: 'bg-tertiary' },
  diproses: { label: 'Diproses', badge: 'bg-secondary-container text-on-secondary-container ring-primary/20', dot: 'bg-primary-container' },
  siap: { label: 'Siap', badge: 'bg-primary-container text-on-primary ring-primary-container', dot: 'bg-on-primary' },
  selesai: { label: 'Selesai', badge: 'bg-surface-container-high text-on-surface-variant ring-outline-variant', dot: 'bg-outline' },
  dibatalkan: { label: 'Dibatalkan', badge: 'bg-error/10 text-error ring-error/30', dot: 'bg-error' },
}

const ACTIVE_STATUS = ['menunggu', 'diproses', 'siap']
const STEPS = ['menunggu', 'diproses', 'siap']
const ORDER_TYPE_LABEL = { 'dine-in': 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' }

const rupiah = (n) => 'Rp' + (n ?? 0).toLocaleString('id-ID')
const statusOf = (order) => STATUS[order.status] ?? STATUS.menunggu

const toDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate() // Firestore Timestamp
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatDateTime = (date) => {
  if (!date) return 'Tanggal tidak tersedia'
  const tanggal = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${tanggal}, ${jam} WIB`
}

const groupLabel = (date) => {
  if (!date) return 'Tanggal tidak tersedia'
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const selisihHari = Math.round((startOf(new Date()) - startOf(date)) / 86400000)
  if (selisihHari <= 0) return 'Hari ini'
  if (selisihHari === 1) return 'Kemarin'
  if (selisihHari < 7) return '7 hari terakhir'
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

// Ringkasan racikan diturunkan dari `detail`, tidak disimpan di Firestore.
const describeItem = (item) => {
  const d = item?.detail
  if (!d) return null
  const parts = [d.base, d.sweetness, d.ice, d.milk && `Susu ${d.milk}`]
  if (Array.isArray(d.toppings) && d.toppings.length) parts.push(d.toppings.join(', '))
  return parts.filter(Boolean).join(' • ') || null
}

// Tipe pesanan, meja, dan metode bayar opsional agar order lama tetap aman.
const contextLine = (order) => {
  const parts = []
  const tipe = ORDER_TYPE_LABEL[order.orderType]
  if (tipe) parts.push(tipe)
  if (order.tableNumber) parts.push(`Meja ${order.tableNumber}`)
  if (order.paymentMethod) parts.push(order.paymentMethod)
  return parts.join(' • ')
}

/* ---------------- Komponen kecil ---------------- */

function StatusBadge({ order }) {
  const s = statusOf(order)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// Stepper 3 tahap untuk pesanan yang sedang berjalan.
function ProgressSteps({ status }) {
  const current = STEPS.indexOf(status)
  return (
    <ol className="relative mt-4 flex items-start justify-between" aria-label="Progres pesanan">
      <span className="absolute left-5 right-5 top-3.5 h-0.5 bg-outline-variant" aria-hidden="true" />
      <span
        className="absolute left-5 top-3.5 h-0.5 bg-primary-container transition-all"
        style={{ width: `calc((100% - 2.5rem) * ${Math.max(current, 0) / (STEPS.length - 1)})` }}
        aria-hidden="true"
      />
      {STEPS.map((step, i) => {
        const done = i < current
        const now = i === current
        return (
          <li key={step} className="relative z-10 flex w-16 flex-col items-center gap-1.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-surface-container-lowest ${done || now ? 'bg-primary-container text-on-primary' : 'border border-outline-variant bg-surface-container text-outline'}`}
            >
              {done ? (
                <span className="material-symbols-outlined text-[16px]">check</span>
              ) : (
                <span className={`h-2 w-2 rounded-full ${now ? 'bg-on-primary animate-pulse' : 'bg-outline-variant'}`} />
              )}
            </span>
            <span className={`text-[11px] ${now ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{STATUS[step].label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function OrderItems({ items }) {
  return (
    <ul className="divide-y divide-outline-variant/50 rounded-xl bg-surface-container-low">
      {(items ?? []).map((item, i) => {
        const ringkasan = describeItem(item)
        return (
          <li key={`${item.name}-${i}`} className="flex items-start justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm text-on-surface">
                <span className="text-on-surface-variant">{item.qty}x</span> {item.name}
              </p>
              {ringkasan && <p className="mt-0.5 truncate text-xs text-on-surface-variant">{ringkasan}</p>}
            </div>
            <p className="shrink-0 text-sm tabular-nums text-on-surface">{rupiah((item.price ?? 0) * (item.qty ?? 1))}</p>
          </li>
        )
      })}
    </ul>
  )
}

const btnBase = 'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container'

function OrderCard({ order, onRepeat, onTrack, onReceipt, repeating }) {
  const aktif = ACTIVE_STATUS.includes(order.status)
  const dibatalkan = order.status === 'dibatalkan'
  const konteks = contextLine(order)
  const belumBayar = order.paymentStatus === 'belum_dibayar'

  return (
    <article className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm lg:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-xl font-semibold text-on-surface">#{order.orderCode ?? order.id}</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">{formatDateTime(toDate(order.createdAt))}</p>
          {konteks && <p className="mt-0.5 text-xs text-on-surface-variant">{konteks}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge order={order} />
          {belumBayar && (
            <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 text-[11px] font-semibold text-tertiary">Belum dibayar</span>
          )}
        </div>
      </header>

      {aktif && <ProgressSteps status={order.status} />}

      <div className="mt-4">
        <OrderItems items={order.items} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          Total <span className="text-base font-bold tabular-nums text-on-surface">{rupiah(order.total ?? order.subtotal)}</span>
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!dibatalkan && (
            <button type="button" onClick={() => onReceipt(order)} className={`${btnBase} border border-outline-variant text-on-surface hover:bg-surface-container`}>
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Lihat struk
            </button>
          )}
          {aktif ? (
            <button type="button" onClick={() => onTrack(order)} className={`${btnBase} bg-primary-container text-on-primary hover:bg-tea-800`}>
              <span className="material-symbols-outlined text-[18px]">near_me</span>
              Lacak pesanan
            </button>
          ) : (
            <button type="button" onClick={() => onRepeat(order)} disabled={repeating} className={`${btnBase} bg-secondary-container text-on-secondary-container hover:bg-tea-150 disabled:opacity-60`}>
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Pesan lagi
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyState({ onBrowse, filtered }) {
  return (
    <div className="rounded-2xl border border-dashed border-outline bg-surface-container-lowest px-6 py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">local_cafe</span>
      <h3 className="mt-3 font-serif text-lg font-semibold text-on-surface">
        {filtered ? 'Tidak ada pesanan di filter ini' : 'Belum ada pesanan'}
      </h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-on-surface-variant">
        {filtered ? 'Coba pilih filter lain untuk melihat pesanan yang lain.' : 'Pesanan yang kamu buat akan muncul di sini, lengkap dengan tombol pesan lagi.'}
      </p>
      {!filtered && (
        <button type="button" onClick={onBrowse} className={`${btnBase} mt-5 bg-primary-container text-on-primary hover:bg-tea-800`}>
          Lihat menu
        </button>
      )}
    </div>
  )
}

function FilterTabs({ value, onChange, counts }) {
  const tabs = [
    { id: 'semua', label: 'Semua', count: counts.semua },
    { id: 'berjalan', label: 'Sedang berjalan', count: counts.berjalan },
    { id: 'selesai', label: 'Selesai', count: counts.selesai },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${active ? 'border-primary-container bg-secondary-container text-on-secondary-container' : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary-container'}`}
          >
            {tab.label}
            {tab.count > 0 && <span className="text-xs tabular-nums opacity-70">{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function OrderGroups({ groups, ...handlers }) {
  return (
    <div className="space-y-6">
      {groups.map(([label, orders]) => (
        <section key={label}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-on-surface-variant">{label}</h2>
            <span className="text-xs text-on-surface-variant/70">{orders.length} pesanan</span>
          </div>
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} {...handlers} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/* ---------------- Halaman ---------------- */

export default function History() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const { open: openCartSheet } = useCartSheet()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('semua')
  const [repeatingId, setRepeatingId] = useState(null)

  // Login: query Firestore per userId (riwayat permanen di akun).
  // Tamu: baca id order dari localStorage, lalu dengarkan tiap order secara real-time.
  useEffect(() => {
    setLoading(true)
    setError(null)

    if (user?.uid) {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
      return onSnapshot(
        q,
        (snapshot) => {
          setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
          setError(null)
          setLoading(false)
        },
        (err) => {
          console.error('Gagal memuat riwayat pesanan:', err)
          setError('Riwayat pesanan gagal dimuat. Periksa koneksi lalu muat ulang halaman.')
          setLoading(false)
        }
      )
    }

    // --- Mode tamu ---
    const guestRefs = getGuestOrderIds()
    if (guestRefs.length === 0) {
      setOrders([])
      setLoading(false)
      return
    }

    const ordersMap = new Map()
    let pendingCount = guestRefs.length

    const sortAndSet = () => {
      const arr = Array.from(ordersMap.values()).sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
      setOrders(arr)
    }
    const markLoaded = () => {
      if (pendingCount > 0) {
        pendingCount -= 1
        if (pendingCount === 0) setLoading(false)
      }
    }

    const unsubscribers = guestRefs.map(({ id }) =>
      onSnapshot(
        doc(db, 'orders', id),
        (snap) => {
          if (snap.exists()) ordersMap.set(id, { id: snap.id, ...snap.data() })
          else ordersMap.delete(id)
          sortAndSet()
          markLoaded()
        },
        (err) => {
          console.error('Gagal memuat 1 order tamu:', err)
          markLoaded()
        }
      )
    )

    return () => unsubscribers.forEach((u) => u())
  }, [user?.uid])

  const activeOrders = useMemo(() => orders.filter((o) => ACTIVE_STATUS.includes(o.status)), [orders])
  const pastOrders = useMemo(() => orders.filter((o) => !ACTIVE_STATUS.includes(o.status)), [orders])
  const counts = { semua: orders.length, berjalan: activeOrders.length, selesai: pastOrders.length }

  const visibleOrders = useMemo(() => {
    if (filter === 'berjalan') return activeOrders
    if (filter === 'selesai') return pastOrders
    return orders
  }, [filter, orders, activeOrders, pastOrders])

  const groups = useMemo(() => {
    const map = new Map()
    visibleOrders.forEach((order) => {
      const label = groupLabel(toDate(order.createdAt))
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(order)
    })
    return [...map.entries()]
  }, [visibleOrders])

  const handleRepeat = (order) => {
    if (!order.items?.length) return
    setRepeatingId(order.id)
    // Detail racikan lama dibawa apa adanya; user bisa mengubahnya lewat Cart Sheet.
    order.items.forEach((item) => {
      addItem({ name: item.name, price: item.price, qty: item.qty ?? 1, type: item.type ?? 'signature', detail: item.detail ?? null })
    })
    setRepeatingId(null)
    openCartSheet()
  }

  const handleTrack = (order) => navigate(`/tracking/${order.id}`)
  const handleReceipt = (order) => navigate(`/receipt/${order.id}`)
  const handleBrowse = () => navigate('/menu')
  const handlers = { onRepeat: handleRepeat, onTrack: handleTrack, onReceipt: handleReceipt }

  const belumLogin = !user?.uid
  const showFilters = !belumLogin && !loading && orders.length > 0

  const renderBody = () => {
    if (belumLogin && !loading && orders.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-outline bg-surface-container-lowest px-6 py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">receipt_long</span>
          <h3 className="mt-3 font-serif text-lg font-semibold text-on-surface">Belum ada riwayat</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-on-surface-variant">
            Pesan sebagai tamu tetap bisa dilacak di browser ini, atau masuk akun supaya riwayat & poin tersimpan permanen di manapun kamu login.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => navigate('/menu')} className={`${btnBase} border border-outline-variant text-on-surface hover:bg-surface-container`}>
              Lihat menu
            </button>
            <button type="button" onClick={() => navigate('/login')} className={`${btnBase} bg-primary-container text-on-primary hover:bg-tea-800`}>
              Masuk ke akun
            </button>
          </div>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-outline-variant/60 bg-surface-container" />
          ))}
        </div>
      )
    }

    if (error) {
      return <div className="rounded-2xl border border-error/30 bg-error/5 px-4 py-4 text-sm text-error">{error}</div>
    }

    if (!visibleOrders.length) return <EmptyState onBrowse={handleBrowse} filtered={orders.length > 0} />

    return <OrderGroups groups={groups} {...handlers} repeating={Boolean(repeatingId)} />
  }

  // Tamu yang sudah punya riwayat lokal diajak login supaya permanen.
  const guestBanner =
    belumLogin && !loading && orders.length > 0 ? (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tertiary/30 bg-tertiary-fixed px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-on-tertiary-fixed">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>
            Riwayat ini tersimpan di browser ini saja. <strong>Masuk akun</strong> biar permanen & dapat poin.
          </span>
        </p>
        <button type="button" onClick={() => navigate('/login')} className="shrink-0 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:bg-tea-800">
          Masuk
        </button>
      </div>
    ) : null

  const pageHeader = (
    <div>
      <p className="text-xs font-semibold text-primary-container">Pesanan kamu</p>
      <h1 className="mt-1 font-serif text-[32px] font-medium leading-tight text-on-surface lg:text-5xl">Segelas ketenangan.</h1>
      <p className="mt-1.5 max-w-xl text-sm text-on-surface-variant">
        Status pesanan diperbarui otomatis. Lacak pesanan yang berjalan dan pesan ulang favoritmu.
      </p>
    </div>
  )

  return (
    <>
      <MobileHeader subtitle="Riwayat" />
      <DesktopNav />

      {/* MOBILE */}
      <main className="min-h-screen bg-background px-4 pb-28 pt-4 lg:hidden">
        {pageHeader}
        {showFilters && <div className="mt-4"><FilterTabs value={filter} onChange={setFilter} counts={counts} /></div>}
        <div className="mt-5">
          {guestBanner}
          {renderBody()}
        </div>
      </main>

      {/* DESKTOP */}
      <main className="hidden min-h-screen bg-background py-10 lg:block">
        <div className="mx-auto max-w-6xl px-8">
          <header className="flex items-end justify-between gap-6">
            {pageHeader}
            {showFilters && <FilterTabs value={filter} onChange={setFilter} counts={counts} />}
          </header>

          <div className="mt-8 grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-8">
              {guestBanner}
              {renderBody()}
            </div>

            <aside className="col-span-12 xl:col-span-4">
              <div className="sticky top-24 space-y-4">
                <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
                  <h2 className="font-serif text-lg font-semibold text-on-surface">Pesanan berjalan</h2>
                  {activeOrders.length === 0 ? (
                    <p className="mt-1 text-sm text-on-surface-variant">Tidak ada pesanan yang sedang diproses saat ini.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {activeOrders.map((order) => (
                        <li key={order.id}>
                          <button
                            type="button"
                            onClick={() => handleTrack(order)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-3 text-left transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-on-surface">#{order.orderCode ?? order.id}</span>
                              <span className="block text-xs text-on-surface-variant">{statusOf(order).label}</span>
                            </span>
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60">chevron_right</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
                  <h2 className="font-serif text-lg font-semibold text-on-surface">Pesan lagi</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Racikan dari pesanan terakhirmu.</p>
                  {pastOrders.length === 0 ? (
                    <p className="mt-3 text-sm text-on-surface-variant">Belum ada pesanan yang selesai.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {pastOrders.slice(0, 3).map((order) => (
                        <li key={order.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-on-surface">
                              {order.items?.[0]?.name ?? 'Pesanan'}
                              {order.items?.length > 1 && <span className="text-on-surface-variant"> +{order.items.length - 1} lainnya</span>}
                            </span>
                            <span className="block text-xs tabular-nums text-on-surface-variant">{rupiah(order.total ?? order.subtotal)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRepeat(order)}
                            aria-label={`Pesan lagi ${order.orderCode ?? ''}`}
                            className="shrink-0 rounded-lg bg-primary-container p-2 text-on-primary transition hover:bg-tea-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  )
}