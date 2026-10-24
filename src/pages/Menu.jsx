import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMenuItems } from '../hooks/useMenuItems.js'
import { useOptionGroups } from '../hooks/useOptionGroups.js'
import { useCart } from '../context/CartContext.jsx'
import { useCartSheet } from '../context/CartSheetContext.jsx'
import { resolveOptions, getBasePrice } from '../utils/options.js'
import MobileHeader from '../components/MobileHeader.jsx'
import DesktopNav from '../components/DesktopNav.jsx'
import BottomNav from '../components/BottomNav.jsx'
import QuantityModal from '../components/QuantityModal.jsx'
import CustomizeModal from '../components/CustomizeModal.jsx'
import BundleModal from '../components/BundleModal.jsx'
import { seedBundles } from '../data/bundlesData.js'

const filters = [
  { key: 'semua', label: 'Semua' },
  { key: 'bundling', label: '🎁 Paket Bundling' },
  { key: 'classic', label: 'Classic Tea' },
  { key: 'fruit', label: 'Fruit Tea' },
  { key: 'milktea', label: 'Milk Tea' },
  { key: 'signature', label: 'Signature Tea' },
  { key: 'coffee', label: 'Coffee Series' },
]

const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

function BundleCard({ bundle, onSelect }) {
  return (
    <article
      onClick={() => onSelect(bundle)}
      className="bg-surface-container-lowest rounded-2xl lg:rounded-3xl border-2 border-[#316342]/30 shadow-sm hover:shadow-lg transition-all p-3 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-[#316342] text-white text-[10px] lg:text-xs font-black px-2.5 py-1 rounded-full shadow-md tracking-wide">
          {bundle.badge}
        </span>
      </div>

      <div>
        <div className="relative rounded-xl lg:rounded-2xl overflow-hidden mb-2.5">
          <Photo src={bundle.imageUrl} alt={bundle.name} className="w-full h-32 lg:h-44 group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="px-1">
          <span className="text-[10px] font-bold text-[#316342] uppercase tracking-wider block">
            {bundle.slots?.length || 2} Minuman Pilihan
          </span>
          <h2 className="font-serif text-base lg:text-xl font-bold leading-tight text-on-surface mt-0.5">
            {bundle.name}
          </h2>
          <p className="text-[11px] lg:text-sm text-on-surface-variant leading-snug line-clamp-2 mt-1">
            {bundle.desc}
          </p>
        </div>
      </div>

      <div className="px-1 pt-3 pb-0.5 flex items-center justify-between gap-2 border-t border-outline-variant/30 mt-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm lg:text-lg font-black text-[#316342]">{rupiah(bundle.price)}</span>
            <span className="text-[11px] line-through text-on-surface-variant/70">{rupiah(bundle.originalPrice)}</span>
          </div>
          <span className="text-[10px] font-semibold text-[#316342]">Hemat {rupiah(bundle.savings)}</span>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(bundle) }}
          className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-[#316342] hover:bg-[#285237] text-white text-xs lg:text-sm font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          <span>Pilih</span>
        </button>
      </div>
    </article>
  )
}

function Photo({ src, alt, grayscale, className = '' }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={`object-cover ${grayscale ? 'grayscale' : ''} ${className}`} />
  return (
    <div className={`bg-surface-container flex items-center justify-center text-outline ${className}`}>
      <span className="material-symbols-outlined text-[32px]">local_cafe</span>
    </div>
  )
}

function MenuCard({ item, custom, hasDelta, onSelect }) {
  return (
    <article
      onClick={() => onSelect(item)}
      className={`bg-surface-container-lowest rounded-2xl lg:rounded-3xl border border-outline-variant/50 shadow-sm p-2 lg:p-3 flex flex-col justify-between transition-shadow ${item.inStock ? 'cursor-pointer hover:shadow-md' : 'opacity-70'}`}
    >
      <div>
        <div className="relative rounded-xl lg:rounded-2xl overflow-hidden mb-2.5">
          <Photo src={item.imageUrl} alt={item.name} grayscale={!item.inStock} className="w-full h-32 lg:h-48" />
          {!item.inStock && (
            <span className="absolute inset-0 bg-on-surface/50 text-white text-xs font-bold flex items-center justify-center">Habis</span>
          )}
        </div>
        <div className="px-1">
          {custom && <span className="text-[11px] font-semibold text-tertiary">Bisa dikustomisasi</span>}
          <h2 className="font-serif text-base lg:text-xl font-semibold leading-tight text-on-surface mt-0.5">{item.name}</h2>
          <p className="text-[11px] lg:text-sm text-on-surface-variant leading-snug line-clamp-2 mt-1">{item.desc}</p>
        </div>
      </div>
      <div className="px-1 pt-3 pb-0.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {hasDelta && <span className="block text-[10px] text-on-surface-variant leading-none">Mulai</span>}
          <span className="text-sm lg:text-lg font-bold text-tertiary">{rupiah(getBasePrice(item))}</span>
        </div>
        <button
          type="button"
          disabled={!item.inStock}
          aria-label={custom ? `Kustomisasi ${item.name}` : `Tambah ${item.name}`}
          onClick={(e) => { e.stopPropagation(); onSelect(item) }}
          className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 rounded-full bg-primary-container text-on-primary disabled:bg-surface-container-high disabled:text-outline flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">{custom ? 'tune' : 'add'}</span>
        </button>
      </div>
    </article>
  )
}

export default function Menu() {
  const navigate = useNavigate()
  const { addItem, items: cartItems, subtotal: cartSubtotal } = useCart()
  const { open: openCartSheet } = useCartSheet()
  const { items, usingSeed } = useMenuItems()
  const { groups, loading: groupsLoading } = useOptionGroups()
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('filter')
  const [activeFilter, setActiveFilter] = useState(
    ['semua', 'bundling', 'classic', 'fruit', 'milktea', 'signature', 'coffee'].includes(initialFilter)
      ? initialFilter
      : 'semua'
  )
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [quantityModalItem, setQuantityModalItem] = useState(null)
  const [customizingItem, setCustomizingItem] = useState(null)
  const [customizingBundle, setCustomizingBundle] = useState(null)

  // Per menu: punya opsi? ada pilihan berharga tambahan? (hasil resolveOptions)
  const info = useMemo(() => {
    const map = new Map()
    for (const it of items) {
      const resolved = resolveOptions(it, groups)
      map.set(it.id, {
        custom: resolved.length > 0,
        hasDelta: resolved.some((g) => g.choices.some((c) => c.priceDelta > 0)),
      })
    }
    return map
  }, [items, groups])
  const infoOf = (item) => info.get(item.id) ?? { custom: false, hasDelta: false }

  const matchesFilter = (item, key) =>
    key === 'semua' ? true : item.category === key

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter(item, activeFilter) && matchSearch
  })

  const visible =
    sortBy === 'harga-rendah' ? [...filtered].sort((a, b) => getBasePrice(a) - getBasePrice(b))
    : sortBy === 'harga-tinggi' ? [...filtered].sort((a, b) => getBasePrice(b) - getBasePrice(a))
    : filtered

  // Saat pelanggan klik menu: jika bisa dikustomisasi, buka bottom sheet CustomizeModal!
  function handleSelect(item) {
    if (!item.inStock) return
    if (groupsLoading) return // tunggu definisi grup supaya tidak salah cabang
    if (infoOf(item).custom) setCustomizingItem(item)
    else setQuantityModalItem(item)
  }

  function confirmAddPlain(qty) {
    const item = quantityModalItem
    addItem({ id: item.id, name: item.name, price: getBasePrice(item), qty, type: 'signature', selectedOptions: [] })
    setQuantityModalItem(null)
    openCartSheet()
  }

  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0)

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <MobileHeader subtitle="Menu" />
      <DesktopNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 lg:pt-10 pb-40 lg:pb-24">
        <section className="mb-5 lg:mb-8">
          <p className="text-xs font-semibold text-primary-container mb-1">Katalog teh</p>
          <h1 className="font-serif text-[32px] sm:text-5xl lg:text-6xl font-medium leading-[1.1] text-on-surface">Temukan favoritmu.</h1>
          <p className="text-sm lg:text-lg text-on-surface-variant mt-1.5">Semua dibuat segar, sesuai suasana hatimu.</p>
        </section>

        <div className="sticky top-16 lg:static z-20 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 py-2 space-y-3 mb-4 lg:mb-8">
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl lg:rounded-2xl px-4 h-11 lg:h-14 shadow-sm focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container">
              <span className="material-symbols-outlined text-outline text-[20px]">search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari teh atau blend..."
                className="w-full bg-transparent text-sm lg:text-base text-on-surface placeholder:text-outline focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded-xl lg:rounded-2xl pl-3 pr-1 h-11 lg:h-14 shadow-sm">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Urutkan menu"
                className="bg-transparent text-xs lg:text-sm font-semibold text-on-surface py-2 focus:outline-none cursor-pointer w-[84px] lg:w-auto"
              >
                <option value="default">Populer</option>
                <option value="harga-rendah">Termurah</option>
                <option value="harga-tinggi">Termahal</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((f) => {
              const active = activeFilter === f.key
              const count = f.key === 'bundling' ? seedBundles.length : items.filter((i) => matchesFilter(i, f.key)).length
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 lg:px-5 h-9 lg:h-11 rounded-full text-sm font-semibold border transition-colors ${active
                    ? 'bg-secondary-container text-on-secondary-container border-primary-container'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary-container'}`}
                >
                  {active && <span className="material-symbols-outlined text-[16px]">check</span>}
                  {f.label}
                  <span className="text-[11px] opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {usingSeed && (
          <p className="text-[11px] lg:text-xs text-on-surface-variant mb-3">Menampilkan data contoh — belum ada data dari App Kasir.</p>
        )}

        {/* View khusus tab 'bundling' */}
        {activeFilter === 'bundling' ? (
          <section aria-label="Daftar paket bundling">
            <div className="mb-4">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-on-surface">Paket Bundling Spesial 🎁</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">Pesan paket lebih hemat, rasa & manis tetap bisa diatur per cup.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seedBundles
                .filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.desc.toLowerCase().includes(search.toLowerCase()))
                .map((b) => (
                  <BundleCard key={b.id} bundle={b} onSelect={setCustomizingBundle} />
                ))}
            </div>
          </section>
        ) : (
          <>
            {/* Promo Carousel/Grid Bundling di Tab 'Semua' */}
            {activeFilter === 'semua' && !search && (
              <section className="mb-8 p-4 rounded-3xl bg-surface-container-low/60 border border-outline-variant/40">
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <span className="text-[11px] font-bold text-[#316342] uppercase tracking-wider block">Promo Hemat</span>
                    <h2 className="font-serif text-lg lg:text-2xl font-bold text-on-surface">Paket Bundling Lebih Hemat 🎁</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('bundling')}
                    className="text-xs font-bold text-[#316342] hover:underline flex items-center gap-0.5"
                  >
                    Lihat Semua ({seedBundles.length})
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {seedBundles.slice(0, 3).map((b) => (
                    <BundleCard key={b.id} bundle={b} onSelect={setCustomizingBundle} />
                  ))}
                </div>
              </section>
            )}

            {visible.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] text-outline">search_off</span>
                <p className="mt-2 text-sm">Belum ada menu yang cocok dengan pencarianmu.</p>
                <button
                  type="button"
                  onClick={() => { setSearch(''); setActiveFilter('semua') }}
                  className="mt-3 text-sm font-semibold text-primary-container underline underline-offset-4"
                >
                  Tampilkan semua menu
                </button>
              </div>
            ) : (
              <section aria-label="Daftar menu teh" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 lg:gap-6">
                {visible.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    custom={infoOf(item).custom}
                    hasDelta={infoOf(item).hasDelta}
                    onSelect={handleSelect}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {/* Bar keranjang melayang (menggantikan sidebar keranjang desktop) */}
      {cartCount > 0 && (
        <div className="fixed left-0 right-0 bottom-20 lg:bottom-6 z-30 px-4 pointer-events-none">
          <button
            type="button"
            onClick={openCartSheet}
            className="pointer-events-auto mx-auto max-w-xl w-full flex items-center justify-between gap-3 bg-primary-container text-on-primary rounded-2xl px-4 py-3 shadow-xl active:scale-[0.99] transition-transform"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-on-primary/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              </span>
              <span className="text-left min-w-0">
                <span className="block text-sm font-bold">{cartCount} item di keranjang</span>
                <span className="block text-xs opacity-80">Total {rupiah(cartSubtotal)}</span>
              </span>
            </span>
            <span className="text-sm font-semibold shrink-0">Lihat keranjang</span>
          </button>
        </div>
      )}

      <BottomNav />

      <QuantityModal
        item={quantityModalItem}
        onClose={() => setQuantityModalItem(null)}
        onConfirm={confirmAddPlain}
      />

      <CustomizeModal
        item={customizingItem}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
      />

      <BundleModal
        bundle={customizingBundle}
        menuItems={items}
        cartItemCount={cartCount}
        onClose={() => setCustomizingBundle(null)}
        onAddToCart={(bundleItem) => {
          addItem(bundleItem)
          setCustomizingBundle(null)
          openCartSheet()
        }}
      />
    </div>
  )
}
