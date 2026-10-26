import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMenuItems } from '../hooks/useMenuItems.js'
import { useOptionGroups } from '../hooks/useOptionGroups.js'
import { useCart } from '../context/CartContext.jsx'
import { useCartSheet } from '../context/CartSheetContext.jsx'
import { resolveOptions, getBasePrice, isFoodCategory } from '../utils/options.js'
import MobileHeader from '../components/MobileHeader.jsx'
import DesktopNav from '../components/DesktopNav.jsx'
import BottomNav from '../components/BottomNav.jsx'
import CustomizeModal from '../components/CustomizeModal.jsx'

const KNOWN_CATEGORY_LABELS = {
  signature: 'Signature Tea',
  classic: 'Classic Tea',
  fruit: 'Fruit Tea',
  milktea: 'Milk Tea',
  coffee: 'Coffee Series',
  customizable: 'Customizable Tea',
  tropical: 'Tropical',
  'main course': 'Main Course',
  maincourse: 'Main Course',
  'main-course': 'Main Course',
  main_course: 'Main Course',
  snacks: 'Snacks',
  snack: 'Snacks',
  sweets: 'Sweets',
  sweet: 'Sweets',
  food: 'Food',
  makanan: 'Food',
  minuman: 'Drinks',
  drinks: 'Drinks',
  dessert: 'Dessert',
  desserts: 'Dessert',
  pastry: 'Pastry & Bakery',
  bakery: 'Pastry & Bakery',
}


function formatCategoryLabel(raw) {
  if (!raw) return ''
  const lower = raw.trim().toLowerCase()
  if (KNOWN_CATEGORY_LABELS[lower]) return KNOWN_CATEGORY_LABELS[lower]
  return raw
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

function Photo({ src, alt, grayscale, className = '' }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={`object-cover ${grayscale ? 'grayscale' : ''} ${className}`} />
  return (
    <div className={`bg-surface-container flex items-center justify-center text-outline ${className}`}>
      <span className="material-symbols-outlined text-[32px]">local_cafe</span>
    </div>
  )
}

function MenuCard({ item, onSelect }) {
  return (
    <article
      onClick={() => onSelect(item)}
      className={`bg-surface-container-lowest rounded-2xl lg:rounded-3xl border border-outline-variant/50 shadow-sm p-2 lg:p-3 flex flex-col justify-between transition-shadow ${
        item.inStock !== false ? 'cursor-pointer hover:shadow-md' : 'opacity-70'
      }`}
    >
      <div>
        <div className="relative rounded-xl lg:rounded-2xl overflow-hidden mb-2.5">
          <Photo src={item.imageUrl} alt={item.name} grayscale={item.inStock === false} className="w-full h-32 lg:h-48" />
          {item.inStock === false && (
            <span className="absolute inset-0 bg-on-surface/50 text-white text-xs font-bold flex items-center justify-center">Habis</span>
          )}
        </div>
        <div className="px-1">
          <span className={`text-[11px] font-semibold ${isFoodCategory(item.category) ? 'text-primary' : 'text-tertiary'}`}>
            {isFoodCategory(item.category) ? 'Bisa tambah catatan' : 'Bisa dikustomisasi'}
          </span>
          <h2 className="font-serif text-base lg:text-xl font-semibold leading-tight text-on-surface mt-0.5">{item.name}</h2>
          <p className="text-[11px] lg:text-sm text-on-surface-variant leading-snug line-clamp-2 mt-1">{item.desc}</p>
        </div>
      </div>
      <div className="px-1 pt-3 pb-0.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-sm lg:text-lg font-bold text-tertiary">{rupiah(getBasePrice(item))}</span>
        </div>
        <button
          type="button"
          disabled={item.inStock === false}
          aria-label={`Pilih ${item.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(item)
          }}
          className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 rounded-full bg-primary-container text-on-primary disabled:bg-surface-container-high disabled:text-outline flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>
    </article>
  )
}

export default function Menu() {
  const navigate = useNavigate()
  const { items: cartItems, subtotal: cartSubtotal } = useCart()
  const { open: openCartSheet } = useCartSheet()
  const { items, usingSeed } = useMenuItems()
  const { groups } = useOptionGroups()
  const [searchParams] = useSearchParams()

  // Tab Level 1: 'all' | 'drinks' | 'food'
  const initialFilter = (searchParams.get('filter') || '').toLowerCase()
  const initialMainTab =
    initialFilter === 'drinks' || initialFilter === 'minuman'
      ? 'drinks'
      : initialFilter === 'food' || initialFilter === 'makanan'
      ? 'food'
      : 'all'

  const [mainTab, setMainTab] = useState(initialMainTab)
  const [drinkSubFilter, setDrinkSubFilter] = useState('all')
  const [foodSubFilter, setFoodSubFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [customizingItem, setCustomizingItem] = useState(null)

  // Pisahkan item menjadi Drinks vs Food menggunakan isFoodCategory
  const drinkItems = useMemo(
    () => items.filter((item) => !isFoodCategory(item.category)),
    [items]
  )
  const foodItems = useMemo(
    () => items.filter((item) => isFoodCategory(item.category)),
    [items]
  )

  // Sub-kategori Drinks dinamis dari database
  const drinkCategories = useMemo(() => {
    const map = new Map()
    drinkItems.forEach((item) => {
      const raw = (item.category || '').trim()
      if (raw) map.set(raw.toLowerCase(), formatCategoryLabel(raw))
    })
    const list = [{ key: 'all', label: 'Semua Drinks' }]
    map.forEach((label, key) => list.push({ key, label }))
    return list
  }, [drinkItems])

  // Sub-kategori Food dinamis dari database
  const foodCategories = useMemo(() => {
    const map = new Map()
    foodItems.forEach((item) => {
      const raw = (item.category || '').trim()
      if (raw) map.set(raw.toLowerCase(), formatCategoryLabel(raw))
    })
    const list = [{ key: 'all', label: 'Semua Food' }]
    map.forEach((label, key) => list.push({ key, label }))
    return list
  }, [foodItems])

  // Helper pencarian & pengurutan
  const processItems = (list, subFilter) => {
    let result = list
    if (subFilter !== 'all') {
      result = result.filter(
        (item) => String(item.category || '').trim().toLowerCase() === subFilter
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(q) ||
          (item.desc || '').toLowerCase().includes(q)
      )
    }
    if (sortBy === 'harga-rendah') {
      return [...result].sort((a, b) => getBasePrice(a) - getBasePrice(b))
    }
    if (sortBy === 'harga-tinggi') {
      return [...result].sort((a, b) => getBasePrice(b) - getBasePrice(a))
    }
    return result
  }

  const visibleDrinks = useMemo(
    () => processItems(drinkItems, drinkSubFilter),
    [drinkItems, drinkSubFilter, search, sortBy]
  )

  const visibleFood = useMemo(
    () => processItems(foodItems, foodSubFilter),
    [foodItems, foodSubFilter, search, sortBy]
  )

  const totalVisible =
    (mainTab === 'food' ? 0 : visibleDrinks.length) +
    (mainTab === 'drinks' ? 0 : visibleFood.length)

  function handleSelect(item) {
    if (item.inStock === false) return
    setCustomizingItem(item)
  }

  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0)

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <MobileHeader subtitle="Menu" />
      <DesktopNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 lg:pt-10 pb-40 lg:pb-24">
        {/* Header Hero */}
        <section className="mb-5 lg:mb-8">
          <p className="text-xs font-semibold text-primary-container mb-1">Katalog Menu</p>
          <h1 className="font-serif text-[32px] sm:text-5xl lg:text-6xl font-medium leading-[1.1] text-on-surface">
            Temukan favoritmu.
          </h1>
          <p className="text-sm lg:text-lg text-on-surface-variant mt-1.5">
            Semua dibuat & disajikan segar, sesuai suasana hatimu.
          </p>
        </section>

        {/* Sticky Controls: Pencarian, Urutan, & Tab Level 1 [ Semua ] [ Drinks ] [ Food ] */}
        <div className="sticky top-16 lg:static z-20 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 space-y-3 mb-6 lg:mb-10">
          {/* Baris Pencarian & Sort */}
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl lg:rounded-2xl px-4 h-11 lg:h-14 shadow-sm focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container">
              <span className="material-symbols-outlined text-outline text-[20px]">search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari menu, teh, atau makanan..."
                className="w-full bg-transparent text-sm lg:text-base text-on-surface placeholder:text-outline focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
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

          {/* TAB UTAMA (Level 1): [ Semua ]  [ Drinks ]  [ Food ] */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-0.5">
            <button
              type="button"
              onClick={() => setMainTab('all')}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                mainTab === 'all'
                  ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:border-primary-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span>Semua</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  mainTab === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {items.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('drinks')}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                mainTab === 'drinks'
                  ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:border-primary-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">local_cafe</span>
              <span>Drinks</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  mainTab === 'drinks' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {drinkItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('food')}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                mainTab === 'food'
                  ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:border-primary-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">lunch_dining</span>
              <span>Food</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  mainTab === 'food' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {foodItems.length}
              </span>
            </button>
          </div>
        </div>

        {usingSeed && (
          <p className="text-[11px] lg:text-xs text-on-surface-variant mb-4">
            Menampilkan data contoh — belum ada data dari App Kasir.
          </p>
        )}

        {totalVisible === 0 ? (
          <div className="text-center py-16 text-on-surface-variant bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
            <p className="mt-2 text-base font-semibold text-on-surface">Tidak ada menu yang sesuai</p>
            <p className="text-xs text-on-surface-variant mt-1">Coba kata kunci pencarian lain atau ubah filter kategori.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setMainTab('all')
                setDrinkSubFilter('all')
                setFoodSubFilter('all')
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              Tampilkan Semua Menu
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* ================= SECTION 1: DRINKS ================= */}
            {(mainTab === 'all' || mainTab === 'drinks') && (
              <section aria-label="Kategori Minuman (Drinks)" className="space-y-4">
                {/* Header Section Drinks */}
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">local_cafe</span>
                    </div>
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-on-surface">Drinks</h2>
                      <p className="text-xs text-on-surface-variant">Aneka seduhan teh artisan & racikan segar</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-bold">
                    {visibleDrinks.length} menu
                  </span>
                </div>

                {/* Sub-Filter Chips Drinks: [ Semua Drinks ] [ Tropical ] [ Signature Tea ] ... */}
                {drinkCategories.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                    {drinkCategories.map((sub) => {
                      const active = drinkSubFilter === sub.key
                      const count =
                        sub.key === 'all'
                          ? drinkItems.length
                          : drinkItems.filter((i) => (i.category || '').toLowerCase() === sub.key).length
                      return (
                        <button
                          key={sub.key}
                          type="button"
                          onClick={() => setDrinkSubFilter(sub.key)}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-secondary-container text-on-secondary-container border-primary-container shadow-xs'
                              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:border-primary-container'
                          }`}
                        >
                          {active && <span className="material-symbols-outlined text-[14px]">check</span>}
                          <span>{sub.label}</span>
                          <span className="text-[10px] opacity-70">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Grid Produk Drinks */}
                {visibleDrinks.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant text-on-surface-variant text-xs">
                    Tidak ada menu minuman yang sesuai dengan filter ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 lg:gap-6">
                    {visibleDrinks.map((item) => (
                      <MenuCard key={item.id} item={item} onSelect={handleSelect} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ================= SECTION 2: FOOD ================= */}
            {(mainTab === 'all' || mainTab === 'food') && (foodItems.length > 0 || mainTab === 'food') && (
              <section aria-label="Kategori Makanan (Food)" className="space-y-4 pt-2">
                {/* Header Section Food */}
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">lunch_dining</span>
                    </div>
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-on-surface">Food</h2>
                      <p className="text-xs text-on-surface-variant">Main course lezat, hidangan santai & aneka snacks</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                    {visibleFood.length} menu
                  </span>
                </div>

                {/* Sub-Filter Chips Food: [ Semua Food ] [ Snacks ] [ Main Course ] ... */}
                {foodCategories.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                    {foodCategories.map((sub) => {
                      const active = foodSubFilter === sub.key
                      const count =
                        sub.key === 'all'
                          ? foodItems.length
                          : foodItems.filter((i) => (i.category || '').toLowerCase() === sub.key).length
                      return (
                        <button
                          key={sub.key}
                          type="button"
                          onClick={() => setFoodSubFilter(sub.key)}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-secondary-container text-on-secondary-container border-primary-container shadow-xs'
                              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:border-primary-container'
                          }`}
                        >
                          {active && <span className="material-symbols-outlined text-[14px]">check</span>}
                          <span>{sub.label}</span>
                          <span className="text-[10px] opacity-70">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Grid Produk Food */}
                {visibleFood.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant text-on-surface-variant text-xs">
                    {foodItems.length === 0
                      ? 'Belum ada menu makanan yang tersedia di katalog.'
                      : 'Tidak ada makanan yang sesuai dengan filter ini.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 lg:gap-6">
                    {visibleFood.map((item) => (
                      <MenuCard key={item.id} item={item} onSelect={handleSelect} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
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

      {/* Modal Kustomisasi (Desain Pop-up Baru Saat Icon + Ditekan) */}
      <CustomizeModal
        item={customizingItem}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
      />
    </div>
  )
}
