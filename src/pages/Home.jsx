import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ============================================================
   FOTO — TARUH FILE DI  public/images/
   Kalau file belum ada, otomatis tampil placeholder (tidak ada broken image).
   Ganti path di bawah kalau nama filenya beda.
   ============================================================ */
const IMAGES = {
  heroGirl: '/images/hero-girl.png',        // <-- FOTO CEWEK + 3 CUP (hero kanan)
  story: '/images/story-tea.jpg',
  promoCup: '/images/promo-cup.png',
  locations: '/images/store-front.jpg',
  gallery: [
    '/images/gallery-1.jpg', // customer pegang cup
    '/images/gallery-2.jpg', // interior toko
    '/images/gallery-3.jpg', // bunga melati
    '/images/gallery-4.jpg', // cewek minum teh
    '/images/gallery-5.jpg', // produk
    '/images/gallery-6.jpg', // proses seduh
  ],
}

// TODO: ganti dengan data menu dari Firestore
const products = [
  { id: 'jasmine-milk-tea', cat: 'Milk Tea', name: 'Jasmine Milk Tea', desc: 'Creamy milk tea dengan aroma melati yang lembut.', price: 24000, badge: 'Best Seller', color: '#E9D9C2', imageUrl: '/images/menu/jasmine-milk-tea.png' },
  { id: 'classic-green-tea', cat: 'Pure Tea', name: 'Classic Green Tea', desc: 'Teh hijau murni, segar dan menenangkan.', price: 20000, badge: '', color: '#B9C79F', imageUrl: '/images/menu/classic-green-tea.png' },
  { id: 'brown-sugar-milk-tea', cat: 'Milk Tea', name: 'Brown Sugar Milk Tea', desc: 'Susu lembut dengan lapisan brown sugar yang kaya.', price: 26000, badge: 'Signature', color: '#A87950', imageUrl: '/images/menu/brown-sugar-milk-tea.png' },
  { id: 'oolong-tea', cat: 'Pure Tea', name: 'Oolong Tea', desc: 'Oolong amber dengan aroma harum dan akhir rasa halus.', price: 22000, badge: '', color: '#D9A55B', imageUrl: '/images/menu/oolong-tea.png' },
  { id: 'jasmine-oolong', cat: 'Signature', name: 'Jasmine Oolong', desc: 'Perpaduan melati dan oolong yang floral dan seimbang.', price: 24000, badge: 'Signature', color: '#E3B567', imageUrl: '/images/menu/jasmine-oolong.png' },
  { id: 'matcha-latte', cat: 'Signature', name: 'Matcha Latte', desc: 'Matcha premium dengan milk foam yang lembut.', price: 28000, badge: 'Best Seller', color: '#8A9B79', imageUrl: '/images/menu/matcha-latte.png' },
]
const categories = ['All', 'Milk Tea', 'Pure Tea', 'Signature']

const perks = [
  { t: 'Premium Tea Leaves', d: 'Daun teh pilihan, diseduh pada suhu yang tepat.', icon: 'eco' },
  { t: 'Fresh Ingredients', d: 'Bahan segar setiap hari, tanpa kompromi.', icon: 'nutrition' },
  { t: 'Balanced Taste', d: 'Manis, pahit, dan wangi dalam takaran seimbang.', icon: 'balance' },
  { t: 'Made with Love', d: 'Setiap cup dibuat dengan perhatian penuh.', icon: 'favorite' },
]

const reviews = [
  { name: 'Alya R.', rating: 5, text: 'Jasmine Milk Tea-nya wangi banget dan nggak terlalu manis. Jadi langganan tiap sore.', initial: 'A' },
  { name: 'Dimas P.', rating: 5, text: 'Brown sugar-nya pas, lapisannya cantik. Porsi dan harganya masuk akal.', initial: 'D' },
  { name: 'Nadia S.', rating: 4, text: 'Matcha Latte favoritku. Foam-nya lembut, rasanya matcha beneran.', initial: 'N' },
  { name: 'Rizky M.', rating: 5, text: 'Oolong-nya segar dan bersih. Cocok buat teman kerja seharian.', initial: 'R' },
]

const faqs = [
  { q: 'What makes Justmine Tea special?', a: 'Kami memakai daun teh pilihan dan bahan segar, lalu menyeimbangkan rasa di setiap cup supaya enak diminum setiap hari.' },
  { q: 'What drinks are available?', a: 'Milk tea, pure tea, dan signature seperti Jasmine Oolong dan Matcha Latte. Lihat daftar lengkapnya di halaman menu.' },
  { q: 'How can I order Justmine Tea?', a: 'Tekan tombol Order Now, pilih minuman, lalu selesaikan pesanan. Kamu juga bisa pesan langsung dari meja lewat kasir.' },
  { q: 'Where can I find your stores?', a: 'Lihat bagian Locations di halaman ini untuk alamat dan jam buka outlet terdekat.' },
  { q: 'Are there any ongoing promotions?', a: 'Ya. Tekan Explore Promo di banner hijau untuk melihat promo yang sedang berjalan.' },
]

const navItems = [['Menu', 'menu'], ['Promo', 'promo'], ['About Us', 'story'], ['Locations', 'locations'], ['FAQ', 'faq']]

const C = { cream: '#F7F3E9', ivory: '#FFFDF7', sage: '#8A9B79', forest: '#123D2A', dark: '#092D20', beige: '#E9D9C2', wood: '#A87950' }
const serif = { fontFamily: "'Playfair Display', Georgia, serif" }
const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

/* ---------- helpers ---------- */
function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setShown(true)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, shown]
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, shown] = useReveal()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`jt-reveal ${shown ? 'jt-in' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* ---------- decorations ---------- */
function Leaf({ className = '', color = C.sage }) {
  return (
    <svg viewBox="0 0 100 60" className={className} aria-hidden="true">
      <path d="M2 30C25 2 70 0 98 28 72 58 25 60 2 30Z" fill={color} />
      <path d="M6 30C35 28 65 28 94 28" stroke="#ffffff55" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function Jasmine({ className = '' }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="30" cy="16" rx="8" ry="14" fill="#FFFDF7" stroke="#E9D9C2" strokeWidth="1" transform={`rotate(${r} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="4.5" fill="#E3B567" />
    </svg>
  )
}

/* ---------- photo with safe fallback ---------- */
function Photo({ src, alt, className = '', hint, imgClass = '' }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`w-full h-full object-cover ${imgClass}`} />
  }
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 text-center p-4 border-2 border-dashed ${className}`} style={{ borderColor: `${C.sage}88`, background: `linear-gradient(135deg, ${C.beige}, ${C.cream})`, color: C.forest }}>
      <span className="material-symbols-outlined text-[36px] opacity-60">add_photo_alternate</span>
      <span className="text-xs font-semibold">{alt}</span>
      {hint && <span className="text-[11px] opacity-70 break-all">{hint}</span>}
    </div>
  )
}

function CupArt({ color }) {
  return (
    <svg viewBox="0 0 120 160" className="h-4/5 drop-shadow-lg" aria-hidden="true">
      <rect x="22" y="14" width="76" height="16" rx="6" fill={C.ivory} stroke={C.beige} />
      <path d="M28 30h64l-8 118a6 6 0 0 1-6 5H42a6 6 0 0 1-6-5Z" fill={C.ivory} stroke={C.beige} />
      <path d="M31 62h58l-5 86a6 6 0 0 1-6 5H42a6 6 0 0 1-6-5Z" fill={color} opacity=".85" />
      <circle cx="60" cy="100" r="17" fill="none" stroke={C.forest} strokeWidth="2" />
      <path d="M52 100c4-9 12-9 16 0-4 9-12 9-16 0Z" fill={C.forest} opacity=".8" />
    </svg>
  )
}

function ProductPhoto({ p, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (p.imageUrl && !failed) {
    return <img src={p.imageUrl} alt={p.name} loading="lazy" onError={() => setFailed(true)} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${className}`} />
  }
  return (
    <div className="w-full h-full flex items-end justify-center pb-3 transition-transform duration-700 group-hover:scale-105" style={{ background: `radial-gradient(circle at 50% 35%, ${C.ivory}, ${p.color}55)` }}>
      <CupArt color={p.color} />
    </div>
  )
}

function Stars({ n }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="material-symbols-outlined text-[18px]" style={{ color: i <= n ? '#D9A55B' : C.beige, fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
    </div>
  )
}

function Btn({ children, onClick, to, variant = 'solid', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A9B79]'
  const styles = {
    solid: 'bg-[#123D2A] text-[#FFFDF7] hover:bg-[#092D20] hover:shadow-lg',
    outline: 'border border-[#123D2A] text-[#123D2A] hover:bg-[#123D2A] hover:text-[#FFFDF7]',
    light: 'bg-[#FFFDF7] text-[#123D2A] hover:bg-[#E9D9C2]',
  }
  const cls = `${base} ${styles[variant]} ${className}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  return <button type="button" onClick={onClick} className={cls}>{children}</button>
}

/* ---------- navbar ---------- */
function Navbar() {
  const [open, setOpen] = useState(false)
  const go = (id) => { setOpen(false); scrollToId(id) }
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ background: `${C.cream}cc`, borderColor: `${C.beige}` }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
        <button onClick={() => scrollToId('top')} className="flex items-center gap-3" aria-label="Justmine Tea">
          <img src="/logo.png" alt="" className="w-10 h-10 rounded-full object-cover bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="text-xl font-semibold" style={{ ...serif, color: C.forest }}>Justmine Tea</span>
        </button>
        <nav className="hidden lg:flex items-center gap-9" aria-label="Utama">
          {navItems.map(([label, id]) => (
            <button key={id} onClick={() => go(id)} className="jt-link text-sm font-medium" style={{ color: C.forest }}>{label}</button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Btn to="/menu" className="!py-2.5 hidden sm:inline-flex">
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>Order Now
          </Btn>
          <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full" style={{ color: C.forest }} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Buka menu navigasi">
            <span className="material-symbols-outlined">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`} style={{ background: C.ivory }}>
        <div className="px-5 py-4 flex flex-col gap-1">
          {navItems.map(([label, id]) => (
            <button key={id} onClick={() => go(id)} className="text-left py-3 text-base font-medium border-b" style={{ color: C.forest, borderColor: C.beige }}>{label}</button>
          ))}
          <Btn to="/menu" className="mt-3">Order Now</Btn>
        </div>
      </div>
    </header>
  )
}

/* ---------- hero ---------- */
function Hero() {
  const bg = useRef(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onScroll = () => bg.current && (bg.current.style.transform = `translateY(${Math.min(window.scrollY, 600) * 0.12}px)`)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const highlights = [['eco', 'Premium Tea Leaves'], ['local_cafe', 'Refreshing Taste'], ['favorite', 'Better Together']]
  return (
    <section id="top" className="relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${C.beige}, ${C.cream} 45%, ${C.ivory})` }}>
      <div ref={bg} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Leaf className="absolute top-24 left-[44%] w-16 rotate-[25deg] opacity-70" />
        <Jasmine className="absolute top-40 left-[38%] w-12 opacity-80 hidden lg:block" />
      </div>
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 items-center lg:min-h-[800px] gap-6 pt-10 lg:pt-0">
        <div className="lg:col-span-5 relative z-10 space-y-6 pb-4 lg:pb-0">
          <p className="flex items-center gap-3 text-sm font-semibold tracking-widest" style={{ color: C.wood }}>
            GOOD TEA, GOOD MOOD <span className="h-px w-16" style={{ background: C.wood }} />
          </p>
          <h1 className="text-5xl sm:text-6xl xl:text-7xl leading-[1.05] font-semibold" style={{ ...serif, color: C.forest }}>
            Justmine Tea <em className="font-normal">in Every Sip</em>
          </h1>
          <p className="text-lg max-w-sm leading-relaxed" style={{ color: C.sage }}>Pure tea, balanced taste, made for your everyday.</p>
          <div className="flex flex-wrap gap-3">
            <Btn to="/menu"><span className="material-symbols-outlined text-[18px]">shopping_bag</span>Order Now</Btn>
            <Btn variant="outline" onClick={() => scrollToId('menu')}>Explore Menu</Btn>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-3 pt-4">
            {highlights.map(([icon, label]) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium" style={{ color: C.forest }}>
                <span className="w-9 h-9 rounded-full flex items-center justify-center border" style={{ borderColor: C.sage }}>
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </span>{label}
              </li>
            ))}
          </ul>
        </div>

        {/* SLOT FOTO CEWEK */}
        <div className="lg:col-span-7 relative h-[420px] sm:h-[560px] lg:h-[800px] -mx-5 lg:mx-0">
          <div className="absolute inset-0 lg:-right-8 lg:left-0 lg:rounded-bl-[200px] overflow-hidden" style={{ background: C.beige }}>
            <Photo src={IMAGES.heroGirl} alt="Foto cewek + 3 cup Justmine Tea" hint="public/images/hero-girl.png" imgClass="object-[center_30%]" />
          </div>
          <Jasmine className="absolute bottom-6 right-4 w-16 hidden sm:block" />
        </div>
      </div>
    </section>
  )
}

/* ---------- story ---------- */
function Story() {
  return (
    <section id="story" className="relative overflow-hidden" style={{ background: C.ivory }}>
      <div className="grid lg:grid-cols-2 items-stretch">
        <Reveal className="relative h-[340px] lg:h-auto lg:min-h-[520px] group overflow-hidden">
          <Photo src={IMAGES.story} alt="Foto close-up teh, melati, daun teh" hint="public/images/story-tea.jpg" imgClass="transition-transform duration-700 group-hover:scale-105" />
          <Jasmine className="absolute bottom-6 right-6 w-20" />
          <Leaf className="absolute top-8 right-10 w-24 rotate-[-20deg]" color="#5E7A4F" />
        </Reveal>
        <Reveal delay={120} className="relative flex items-center px-6 sm:px-12 lg:px-20 py-16">
          <div className="space-y-5 max-w-lg relative z-10">
            <p className="text-sm font-semibold tracking-widest" style={{ color: C.wood }}>Our Story</p>
            <h2 className="text-4xl lg:text-5xl leading-tight font-medium" style={{ ...serif, color: C.forest }}>A Little Moment of Tea, A Lot of Happiness</h2>
            <p className="leading-relaxed text-base" style={{ color: `${C.forest}cc` }}>Every cup tells a story of quality, freshness, and happiness. Discover the little moments that make every sip special.</p>
            <Btn onClick={() => scrollToId('why')}>Learn More</Btn>
          </div>
          <Leaf className="absolute -bottom-6 -right-6 w-48 opacity-40" />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- menu ---------- */
function Menu() {
  const [cat, setCat] = useState('All')
  const [active, setActive] = useState(null)
  const list = cat === 'All' ? products : products.filter((p) => p.cat === cat)

  useEffect(() => {
    if (!active) return
    const onKey = (e) => e.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  return (
    <section id="menu" className="relative py-20 lg:py-28 overflow-hidden" style={{ background: C.cream }}>
      <Jasmine className="absolute -left-4 top-10 w-24 opacity-90" />
      <Leaf className="absolute right-4 top-16 w-24 rotate-[160deg]" />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative">
        <Reveal className="text-center max-w-2xl mx-auto space-y-4">
          <p className="text-sm font-semibold tracking-widest" style={{ color: C.wood }}>Our Signature Menu</p>
          <h2 className="text-4xl lg:text-6xl font-medium" style={{ ...serif, color: C.forest }}>Discover Your Perfect Sip</h2>
          <p style={{ color: `${C.forest}cc` }}>Explore our signature tea collection, crafted to make every moment refreshing.</p>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-2 mt-10" role="tablist" aria-label="Kategori menu">
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className="px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-300" style={cat === c ? { background: C.forest, color: C.ivory, borderColor: C.forest } : { background: 'transparent', color: C.forest, borderColor: C.sage }}>
              {c}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <article className="group rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl" style={{ background: C.ivory, boxShadow: '0 10px 30px -12px rgba(18,61,42,.25)' }}>
                <button onClick={() => setActive(p)} className="relative h-72 sm:h-80 overflow-hidden block text-left" aria-label={`Lihat detail ${p.name}`}>
                  <ProductPhoto p={p} />
                  {p.badge && <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full" style={{ background: p.badge === 'Signature' ? C.wood : C.forest, color: C.ivory }}>{p.badge}</span>}
                </button>
                <div className="p-6 flex flex-col flex-1 gap-2">
                  <span className="text-xs font-medium" style={{ color: C.wood }}>{p.cat}</span>
                  <h3 className="text-2xl font-semibold" style={{ ...serif, color: C.forest }}>{p.name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: `${C.forest}b3` }}>{p.desc}</p>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: C.forest }}>{rupiah(p.price)}</span>
                    <Btn to="/menu" className="!py-2 !px-5">Order Now</Btn>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-12"><Btn to="/menu" variant="outline">View All Menu</Btn></div>
      </div>

      {active && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 jt-fade" style={{ background: 'rgba(9,45,32,.6)' }} onClick={() => setActive(null)} role="dialog" aria-modal="true" aria-label={active.name}>
          <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden grid sm:grid-cols-2 group jt-pop" style={{ background: C.ivory }} onClick={(e) => e.stopPropagation()}>
            <div className="h-64 sm:h-auto sm:min-h-[420px]"><ProductPhoto p={active} /></div>
            <div className="p-8 flex flex-col gap-3 justify-center">
              <span className="text-xs font-semibold" style={{ color: C.wood }}>{active.cat}{active.badge ? ` • ${active.badge}` : ''}</span>
              <h3 className="text-3xl font-semibold" style={{ ...serif, color: C.forest }}>{active.name}</h3>
              <p className="leading-relaxed" style={{ color: `${C.forest}cc` }}>{active.desc}</p>
              <p className="text-2xl font-bold" style={{ color: C.forest }}>{rupiah(active.price)}</p>
              <Btn to="/menu" className="mt-2">Order Now</Btn>
            </div>
            <button onClick={() => setActive(null)} className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.cream, color: C.forest }} aria-label="Tutup">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/* ---------- why ---------- */
function Why() {
  return (
    <section id="why" className="relative py-20 overflow-hidden" style={{ background: C.sage }}>
      <Leaf className="absolute -right-10 top-0 w-64 opacity-30" color={C.forest} />
      <Jasmine className="absolute left-6 bottom-6 w-16 opacity-80" />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative grid lg:grid-cols-12 gap-10 items-center">
        <Reveal className="lg:col-span-4 space-y-3">
          <p className="text-sm font-semibold tracking-widest" style={{ color: C.forest }}>Why Choose Justmine Tea</p>
          <h2 className="text-4xl lg:text-5xl font-medium" style={{ ...serif, color: C.dark }}>Quality You Can Taste</h2>
        </Reveal>
        <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-[#123D2A33]">
          {perks.map((p, i) => (
            <Reveal key={p.t} delay={i * 90} className="px-4 py-4 text-center space-y-3">
              <span className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: C.cream, color: C.forest }}>
                <span className="material-symbols-outlined text-[30px]">{p.icon}</span>
              </span>
              <h3 className="font-semibold" style={{ ...serif, color: C.dark }}>{p.t}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.dark }}>{p.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- promo ---------- */
function Promo() {
  return (
    <section id="promo" className="relative overflow-hidden" style={{ background: C.forest }}>
      <Leaf className="absolute -right-8 bottom-0 w-72 opacity-40" color={C.sage} />
      <Leaf className="absolute -left-10 bottom-4 w-40 rotate-[-30deg] opacity-30" color={C.sage} />
      <Jasmine className="absolute left-[46%] top-10 w-12 hidden md:block" />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-20 grid md:grid-cols-2 gap-10 items-center relative">
        <Reveal className="space-y-5">
          <h2 className="text-4xl lg:text-6xl font-medium leading-tight" style={{ ...serif, color: C.cream }}>Your Favorite Tea, Your Special Moment</h2>
          <p className="text-lg" style={{ color: `${C.cream}dd` }}>Make every day a little sweeter with your favorite Justmine Tea.</p>
          <Btn variant="light" to="/menu">Explore Promo</Btn>
        </Reveal>
        <Reveal delay={150} className="relative h-[340px] lg:h-[420px] flex justify-center">
          <div className="h-full w-64 lg:w-72">
            <Photo src={IMAGES.promoCup} alt="Foto cup Justmine besar" hint="public/images/promo-cup.png" className="rounded-3xl !bg-transparent" imgClass="object-contain" />
          </div>
          <span className="absolute top-2 right-[12%] w-28 h-28 rounded-full flex items-center justify-center text-center font-semibold leading-tight rotate-12 shadow-xl" style={{ ...serif, background: '#D9A55B', color: C.dark, border: `4px solid ${C.cream}` }}>Special<br />Promo</span>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- gallery ---------- */
const galleryAlt = ['Customer pegang cup', 'Interior toko', 'Bunga melati', 'Cewek menikmati teh', 'Foto produk', 'Proses menyeduh teh']
const galleryShape = ['row-span-2', '', '', 'row-span-2', '', '']

function Gallery() {
  return (
    <section className="py-20 lg:py-28" style={{ background: C.cream }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold tracking-widest" style={{ color: C.wood }}>Our Gallery</p>
            <h2 className="text-4xl lg:text-5xl font-medium" style={{ ...serif, color: C.forest }}>Make Every Sip a Moment</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] lg:auto-rows-[230px] gap-3 lg:gap-4">
          {IMAGES.gallery.map((src, i) => (
            <Reveal key={i} delay={i * 60} className={`group overflow-hidden rounded-2xl lg:rounded-3xl ${galleryShape[i]}`}>
              <Photo src={src} alt={galleryAlt[i]} hint={`public/images/gallery-${i + 1}.jpg`} imgClass="transition-transform duration-700 group-hover:scale-110" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- testimonials ---------- */
function Testimonials() {
  return (
    <section className="py-20 lg:py-24" style={{ background: C.beige }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <Reveal className="text-center mb-12"><h2 className="text-4xl lg:text-5xl font-medium" style={{ ...serif, color: C.forest }}>Little Moments, Happy Customers</h2></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 80} className={i % 2 ? 'lg:mt-8' : ''}>
              <figure className="rounded-3xl p-6 space-y-4 transition-transform duration-500 hover:-translate-y-1" style={{ background: C.ivory }}>
                <Stars n={r.rating} />
                <blockquote className="text-sm leading-relaxed" style={{ color: `${C.forest}dd` }}>“{r.text}”</blockquote>
                <figcaption className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ background: C.sage, color: C.ivory }}>{r.initial}</span>
                  <span className="text-sm font-semibold" style={{ color: C.forest }}>{r.name}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- locations ---------- */
function Locations() {
  // TODO: ganti dengan data outlet asli
  const store = { name: 'Justmine Tea — Outlet Utama', address: '[Alamat outlet — ganti dengan alamat asli]', hours: 'Setiap hari, 10.00 – 22.00', phone: '[Nomor telepon]', email: 'hello@justmine.tea', mapsUrl: 'https://maps.google.com' }
  return (
    <section id="locations" className="grid lg:grid-cols-2" style={{ background: C.ivory }}>
      <div className="h-[320px] lg:h-auto lg:min-h-[520px] overflow-hidden">
        <Photo src={IMAGES.locations} alt="Foto outlet Justmine Tea" hint="public/images/store-front.jpg" />
      </div>
      <Reveal className="px-6 sm:px-12 lg:px-20 py-16 flex items-center">
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl lg:text-5xl font-medium" style={{ ...serif, color: C.forest }}>Find Your Justmine Tea</h2>
          <h3 className="text-xl font-semibold" style={{ ...serif, color: C.wood }}>{store.name}</h3>
          <ul className="space-y-4 text-sm" style={{ color: C.forest }}>
            {[['location_on', store.address], ['schedule', store.hours], ['call', store.phone], ['mail', store.email]].map(([icon, text]) => (
              <li key={icon} className="flex gap-3 items-start"><span className="material-symbols-outlined text-[20px]" style={{ color: C.sage }}>{icon}</span>{text}</li>
            ))}
          </ul>
          <a href={store.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#092D20]" style={{ background: C.forest, color: C.ivory }}>
            <span className="material-symbols-outlined text-[18px]">directions</span>Get Directions
          </a>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- faq ---------- */
function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="relative py-20 lg:py-24 overflow-hidden" style={{ background: C.cream }}>
      <Jasmine className="absolute right-6 top-10 w-16" />
      <div className="max-w-3xl mx-auto px-5 lg:px-8">
        <Reveal className="text-center mb-10"><h2 className="text-4xl lg:text-5xl font-medium" style={{ ...serif, color: C.forest }}>Frequently Asked Questions</h2></Reveal>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="rounded-2xl border overflow-hidden" style={{ background: C.ivory, borderColor: C.beige }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 font-semibold" style={{ color: C.forest }}>
                  {f.q}
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>add</span>
                </button>
                <div className="grid transition-all duration-300" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden"><p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: `${C.forest}cc` }}>{f.a}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- footer ---------- */
function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const submit = (e) => { e.preventDefault(); if (email.includes('@')) { setDone(true); setEmail('') } } // TODO: simpan ke Firestore
  const socials = [['Instagram', 'photo_camera'], ['TikTok', 'music_note'], ['YouTube', 'play_arrow']]
  return (
    <footer style={{ background: C.dark, color: C.cream }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-8 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="w-12 h-12 rounded-full object-cover bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-2xl font-semibold" style={serif}>Justmine Tea</span>
          </div>
          <p className="text-sm leading-relaxed opacity-80 max-w-xs">Good Tea, Good Mood. Teh murni dengan rasa seimbang, untuk menemani harimu.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4" style={serif}>Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-80">
            {navItems.map(([l, id]) => <li key={id}><button onClick={() => scrollToId(id)} className="jt-link">{l}</button></li>)}
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold" style={serif}>Contact & Follow</h4>
          <p className="text-sm opacity-80">hello@justmine.tea<br />[Nomor telepon]</p>
          <div className="flex gap-3">
            {socials.map(([n, icon]) => (
              <a key={n} href="#" aria-label={n} className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-[#F7F3E9] hover:text-[#092D20]" style={{ borderColor: `${C.cream}55` }}>
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </a>
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <h4 className="font-semibold" style={serif}>Stay in touch</h4>
          <div className="flex gap-2">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email kamu" aria-label="Email" className="flex-1 min-w-0 rounded-full px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#8A9B79]" style={{ background: `${C.cream}15`, color: C.cream }} />
            <button type="submit" className="rounded-full px-4 text-sm font-semibold transition-colors hover:bg-white" style={{ background: C.cream, color: C.dark }}>Subscribe</button>
          </div>
          {done && <p className="text-xs" style={{ color: C.sage }}>Terima kasih, kamu sudah terdaftar.</p>}
        </form>
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 border-t flex flex-wrap items-center justify-between gap-3 text-xs opacity-80" style={{ borderColor: `${C.cream}22` }}>
        <p>© {new Date().getFullYear()} Justmine Tea. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <a href="#" className="jt-link">Privacy Policy</a>
          <a href="#" className="jt-link">Terms of Service</a>
          <Link to="/kasir" className="jt-link">Tampilan kasir (Demo)</Link>
        </div>
      </div>
    </footer>
  )
}

/* ---------- page ---------- */
export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        html { scroll-behavior: smooth; }
        .jt-reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s ease, transform .8s ease; }
        .jt-reveal.jt-in { opacity: 1; transform: none; }
        .jt-link { position: relative; }
        .jt-link::after { content: ''; position: absolute; left: 0; bottom: -4px; height: 2px; width: 100%; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .3s ease; }
        .jt-link:hover::after { transform: scaleX(1); }
        .jt-fade { animation: jtFade .25s ease; }
        .jt-pop { animation: jtPop .3s ease; }
        @keyframes jtFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes jtPop { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } .jt-reveal { opacity: 1; transform: none; transition: none; } * { animation: none !important; } }
      `}</style>
      <Navbar />
      <main>
        <Hero />
        <Story />
        <Menu />
        <Why />
        <Promo />
        <Gallery />
        <Testimonials />
        <Locations />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}