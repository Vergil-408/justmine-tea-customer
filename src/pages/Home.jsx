import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import chaImg from '../assets/cha.png'
import iconImg from '../assets/icon.png'

/* ============================================================
   PALET WARNA & IDENTITAS BRAND JUSTMINE TEA
   ============================================================ */
const C = {
  forest: '#124734',
  darkForest: '#092D20',
  sage: '#A9B99A',
  sageDark: '#5E7A4F',
  cream: '#F7F3E9',
  ivory: '#FFFDF7',
  beige: '#E8DCC5',
  wood: '#A87950',
  gold: '#D9A55B',
}

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }
const sans  = { fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }
const rupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')

/* ============================================================
   DATA PRODUK MENU (Tampilan informasi saja — tanpa transaksi)
   ============================================================ */
const products = [
  {
    id: 'jasmine-milk-tea',
    cat: 'Milk Tea',
    name: 'Jasmine Milk Tea',
    desc: 'Creamy milk tea dengan keharuman bunga melati alami yang menenangkan.',
    price: 24000,
    color: '#E9D9C2',
    imageUrl: '/images/menu/jasmine-milk-tea.png',
  },
  {
    id: 'classic-green-tea',
    cat: 'Pure Tea',
    name: 'Classic Green Tea',
    desc: 'Seduhan teh hijau murni pegunungan, kaya antioksidan dan menyegarkan.',
    price: 20000,
    color: '#B9C79F',
    imageUrl: '/images/menu/classic-green-tea.png',
  },
  {
    id: 'brown-sugar-milk-tea',
    cat: 'Milk Tea',
    name: 'Brown Sugar Milk Tea',
    desc: 'Perpaduan susu segar dengan karamel brown sugar organik yang gurih lembut.',
    price: 26000,
    color: '#A87950',
    imageUrl: '/images/menu/brown-sugar-milk-tea.png',
  },
  {
    id: 'oolong-tea',
    cat: 'Pure Tea',
    name: 'Oolong Tea',
    desc: 'Teh oolong amber artisanal dengan aroma panggang halus dan aftertaste manis.',
    price: 22000,
    color: '#D9A55B',
    imageUrl: '/images/menu/oolong-tea.png',
  },
  {
    id: 'jasmine-oolong',
    cat: 'Signature',
    name: 'Jasmine Oolong',
    desc: 'Harmoni floral melati dan karakter kuat oolong, racikan signature Justmine.',
    price: 24000,
    color: '#E3B567',
    imageUrl: '/images/menu/jasmine-oolong.png',
  },
  {
    id: 'matcha-latte',
    cat: 'Signature',
    name: 'Matcha Latte',
    desc: 'Matcha Uji premium dengan lapisan milk foam lembut bertekstur sutra.',
    price: 28000,
    color: '#8A9B79',
    imageUrl: '/images/menu/matcha-latte.png',
  },
]

/* ============================================================
   HELPER FUNCTIONS & HOOKS
   ============================================================ */
function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setShown(true)
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect() } },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, shown]
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, shown] = useReveal()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`jt-reveal ${shown ? 'jt-in' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

/* ============================================================
   DEKORATIF ELEMEN SVG
   ============================================================ */
function Leaf({ className = '', color = C.sage }) {
  return (
    <svg viewBox="0 0 100 60" className={className} aria-hidden="true">
      <path d="M2 30C25 2 70 0 98 28 72 58 25 60 2 30Z" fill={color} />
      <path d="M6 30C35 28 65 28 94 28" stroke="#ffffff40" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function Jasmine({ className = '' }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="30" cy="16" rx="8" ry="14"
          fill="#FFFDF7" stroke="#E8DCC5" strokeWidth="1"
          transform={`rotate(${r} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="4.5" fill="#D9A55B" />
    </svg>
  )
}

function CupArt({ color }) {
  return (
    <svg viewBox="0 0 120 160" className="h-4/5 drop-shadow-md" aria-hidden="true">
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
    return (
      <img src={p.imageUrl} alt={p.name} loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${className}`} />
    )
  }
  return (
    <div
      className={`w-full h-full flex items-end justify-center pb-3 transition-transform duration-500 group-hover:scale-105 ${className}`}
      style={{ background: `radial-gradient(circle at 50% 35%, ${C.ivory}, ${p.color}45)` }}
    >
      <CupArt color={p.color} />
    </div>
  )
}

/* ============================================================
   NAVBAR — tanpa cart, hanya navigasi landing page
   ============================================================ */
function NavigationBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* ---- Desktop Header ---- */}
      <header
        className={`hidden lg:block fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#F7F3E9]/95 backdrop-blur-md shadow-sm border-b border-[#124734]/10 py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={iconImg} alt="Justmine Tea Logo"
              className="w-10 h-10 rounded-full object-contain border border-[#124734]/20 transition-transform group-hover:rotate-6" />
            <span className="text-2xl font-bold tracking-tight text-[#124734]" style={serif}>
              Justmine Tea
            </span>
          </Link>

          <nav className="flex items-center gap-8 text-sm font-medium text-[#124734]/90">
            <Link to="/menu" className="hover:text-[#124734] jt-link transition-colors">Menu</Link>
            <button onClick={() => scrollToId('menu')} className="hover:text-[#124734] jt-link transition-colors">
              Koleksi
            </button>
            <button onClick={() => scrollToId('story')} className="hover:text-[#124734] jt-link transition-colors">
              About Us
            </button>
            <button onClick={() => scrollToId('benefits')} className="hover:text-[#124734] jt-link transition-colors">
              Why Us
            </button>
          </nav>

          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold bg-[#124734] text-[#FFFDF7] shadow-sm hover:bg-[#092D20] hover:shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            Lihat Menu
          </Link>
        </div>
      </header>

      {/* ---- Mobile Floating Header ---- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <div className={`px-4 pt-3.5 pb-2.5 flex items-center justify-between ${
          scrolled ? 'bg-[#F7F3E9]/95 backdrop-blur-md shadow-xs' : 'bg-transparent'
        }`}>
          <Link to="/" className="flex items-center gap-2.5">
            <img src={iconImg} alt="Logo"
              className="w-10 h-10 rounded-full object-contain border border-[#124734]/15 shadow-xs bg-white/80" />
            <span className="text-xl font-bold tracking-tight text-[#124734]" style={serif}>
              Justmine Tea
            </span>
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-stone-200/60 flex items-center justify-center text-[#124734] active:scale-90 transition-transform"
            aria-label="Buka navigasi"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
        </div>
      </header>

      {/* ---- Mobile Slide-Over Drawer ---- */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs jt-fade"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative ml-auto w-4/5 max-w-xs h-full bg-[#F7F3E9] p-6 shadow-2xl flex flex-col justify-between z-10 jt-drawer"
            style={sans}
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#124734]/15">
                <div className="flex items-center gap-2.5">
                  <img src={iconImg} alt="Logo" className="w-8 h-8 rounded-full object-contain" />
                  <span className="font-bold text-lg text-[#124734]" style={serif}>Justmine Tea</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-[#124734] border border-[#124734]/10"
                  aria-label="Tutup"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <nav className="mt-6 flex flex-col gap-1 text-base font-medium text-[#124734]">
                {[
                  { label: 'Katalog Menu', action: () => { setDrawerOpen(false); window.location.href = '/menu' } },
                  { label: 'Koleksi Teh', action: () => { setDrawerOpen(false); scrollToId('menu') } },
                  { label: 'Tentang Kami', action: () => { setDrawerOpen(false); scrollToId('story') } },
                  { label: 'Mengapa Justmine', action: () => { setDrawerOpen(false); scrollToId('benefits') } },
                  { label: 'Riwayat Pesanan', action: () => { setDrawerOpen(false); window.location.href = '/history' } },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center justify-between py-3 border-b border-[#124734]/10 text-left hover:text-[#5E7A4F] transition-colors"
                  >
                    <span>{label}</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-3 pt-6 border-t border-[#124734]/15">
              <Link
                to="/menu"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#124734] text-white text-sm font-semibold shadow-md active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
                Lihat Menu Lengkap
              </Link>
              <p className="text-center text-xs text-[#124734]/60">Good Tea, Good Mood &bull; 10.00 - 22.00 WIB</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ============================================================
   HERO SECTION
   ============================================================ */
function HeroSection() {
  return (
    <section id="top" className="relative w-full overflow-hidden bg-[#F7F3E9]">
      {/* Desktop: foto full-width background */}
      <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0">
        <img src={chaImg} alt="Gadis menikmati Justmine Tea"
          className="w-full h-full object-cover object-right" />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'linear-gradient(90deg, #F7F3E9 0%, #F7F3E9 32%, rgba(247,243,233,0.85) 45%, rgba(247,243,233,0) 65%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" aria-hidden="true"
          style={{ background: 'linear-gradient(180deg, rgba(247,243,233,0) 0%, #F7F3E9 100%)' }} />
      </div>

      {/* Mobile: foto portrait full-width */}
      <div className="lg:hidden relative w-full h-[470px] sm:h-[530px] overflow-hidden shrink-0">
        <img src={chaImg} alt="Gadis minum Justmine Tea sambil membaca buku"
          className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'linear-gradient(180deg, rgba(247,243,233,0) 0%, rgba(247,243,233,0) 45%, rgba(247,243,233,0.6) 72%, #F7F3E9 100%)' }} />
      </div>

      {/* Teks & CTA */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:min-h-[820px] flex items-center">
        <div className="w-full max-w-[560px] pt-1 pb-12 lg:py-24 text-left">

          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#124734]/80 uppercase">
              GOOD TEA, GOOD MOOD
            </span>
            <span className="h-[1.5px] w-8 sm:w-12 bg-[#124734]/40" />
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.08] text-[#124734] tracking-tight"
            style={serif}
          >
            Justmine Tea <em className="italic font-normal">in</em> <br />
            Every Sip
          </h1>

          <p className="mt-3.5 sm:mt-5 text-sm sm:text-base lg:text-lg text-[#124734]/80 max-w-md leading-relaxed">
            Pure tea, balanced taste, made for your everyday.
          </p>

          <div className="flex items-center gap-3 mt-6 sm:mt-8">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold bg-[#124734] text-[#FFFDF7] shadow-md hover:bg-[#092D20] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span>Order Now</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>

            <button
              type="button"
              onClick={() => scrollToId('menu')}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3.5 text-sm font-semibold border border-[#124734]/40 text-[#124734] bg-white/40 hover:bg-[#124734]/5 active:scale-95 transition-all"
            >
              <span>Explore Menu</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* 3 ikon perks — persis sesuai mockup */}
          <div className="grid grid-cols-3 divide-x divide-[#124734]/20 pt-6 mt-6 border-t border-[#124734]/15 max-w-md">
            {[
              { icon: 'eco',                label: 'Premium\nTea Leaves' },
              { icon: 'favorite',           label: 'Refreshing\nTaste' },
              { icon: 'sentiment_satisfied',label: 'Better\nTogether' },
            ].map(({ icon, label }, i) => (
              <div key={i} className={`flex items-center gap-2 ${i === 0 ? 'pr-2' : i === 1 ? 'px-2' : 'pl-2'}`}>
                <span className="w-8 h-8 rounded-full border border-[#124734]/30 flex items-center justify-center shrink-0 text-[#124734] bg-white/50">
                  <span className="material-symbols-outlined text-[17px]">{icon}</span>
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-[#124734] leading-tight whitespace-pre-line">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   BRAND BENEFITS
   ============================================================ */
function BrandBenefits() {
  const perks = [
    { icon: 'eco',   title: 'Premium Tea Leaves', desc: 'Dipetik langsung dari perkebunan dataran tinggi, diolah dengan standar kualitas terbaik untuk aroma teh alami.' },
    { icon: 'spa',   title: 'Refreshing Taste',   desc: 'Keseimbangan rasa manis dan kesegaran floral melati asli yang pas di lidah, menyejukkan di setiap tegukan.' },
    { icon: 'group', title: 'Better Together',    desc: 'Dibuat untuk menemani setiap perbincangan hangat, santai sore, maupun momen sendiri membaca buku favorit.' },
  ]

  return (
    <section id="benefits" className="py-12 lg:py-20 bg-[#F7F3E9] border-t border-[#124734]/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#A87950] uppercase">Mengapa Justmine Tea</p>
          <h2 className="text-2xl sm:text-4xl font-semibold text-[#124734]" style={serif}>Kesegaran Alami di Setiap Cangkir</h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
          {perks.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="h-full rounded-2xl p-6 sm:p-8 bg-[#FFFDF7] border border-[#124734]/10 shadow-xs flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-[#124734]/10 flex items-center justify-center text-[#124734] mb-4">
                  <span className="material-symbols-outlined text-[28px]">{p.icon}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#124734] mb-2" style={serif}>{p.title}</h3>
                <p className="text-xs sm:text-sm text-[#124734]/75 leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   OUR MENU — preview informatif, klik redirect ke halaman menu
   ============================================================ */
function OurMenuSection() {
  return (
    <section id="menu" className="py-12 lg:py-24 bg-[#FFFDF7] relative overflow-hidden">
      <Leaf className="absolute -left-6 top-12 w-28 opacity-20" color={C.sageDark} />
      <Jasmine className="absolute right-4 bottom-10 w-20 opacity-35" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <Reveal className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#A87950] uppercase">Signature Justmine</p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#124734]" style={serif}>Koleksi Rasa Istimewa</h2>
          <p className="text-xs sm:text-sm text-[#124734]/75">
            Diseduh dari racikan teh daun murni dan sentuhan melati yang seimbang.
          </p>
        </Reveal>

        {/* Grid 2 kolom mobile / 3 desktop — hanya preview, tidak ada tombol beli */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {products.map((item, i) => (
            <Reveal key={item.id} delay={i * 60}>
              <Link
                to="/menu"
                className="group rounded-2xl sm:rounded-3xl bg-[#F7F3E9] p-3.5 sm:p-5 border border-[#124734]/10 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col h-full text-left"
              >
                <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3 bg-[#FFFDF7] flex items-center justify-center">
                  <ProductPhoto p={item} />
                </div>
                <h3
                  className="text-sm sm:text-lg font-bold text-[#124734] group-hover:text-[#5E7A4F] transition-colors line-clamp-1"
                  style={serif}
                >
                  {item.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#124734]/70 mt-1 line-clamp-2 leading-relaxed flex-1">
                  {item.desc}
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#124734]/10 flex items-center justify-between">
                  <span className="text-xs sm:text-base font-bold text-[#124734]">{rupiah(item.price)}</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#5E7A4F] flex items-center gap-0.5">
                    Lihat
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold bg-[#124734] text-[#FFFDF7] shadow-sm hover:bg-[#092D20] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>Buka Katalog Menu Lengkap</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   ABOUT JUSTMINE TEA — editorial story
   ============================================================ */
function AboutStory() {
  return (
    <section id="story" className="py-12 lg:py-24 bg-[#F7F3E9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">

          {/* Visual */}
          <Reveal className="relative rounded-3xl overflow-hidden shadow-md bg-[#FFFDF7]"
            style={{ aspectRatio: '4/3' }}>
            <img src={chaImg} alt="Momen santai bersama Justmine Tea"
              className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#124734]/50 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs tracking-widest uppercase font-semibold text-[#D9A55B]">Artisanal Tea Craft</p>
              <h3 className="text-lg sm:text-xl font-bold" style={serif}>Diseduh Dengan Ketulusan &amp; Cinta</h3>
            </div>
          </Reveal>

          {/* Teks */}
          <Reveal delay={100} className="space-y-4 sm:space-y-6 text-left">
            <div>
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#A87950] uppercase mb-1">Cerita Kami</p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#124734] leading-tight" style={serif}>
                A Little Moment of Tea,<br />A Lot of Happiness
              </h2>
            </div>
            <p className="text-xs sm:text-base text-[#124734]/80 leading-relaxed">
              Bagi kami, secangkir teh bukan sekadar pelepas dahaga. Ia adalah jeda kecil di tengah ramainya dunia, pelukan hangat di sore hari, dan teman terbaik di setiap halaman buku yang kamu baca.
            </p>
            <p className="text-xs sm:text-base text-[#124734]/80 leading-relaxed">
              Kami memadukan daun teh pilihan terbaik dari bumi nusantara dengan kuntum melati segar berkualitas tinggi. Setiap racikan diseduh dengan suhu dan waktu presisi agar menghasilkan rasa murni yang seimbang dan menentramkan.
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border border-[#124734] text-[#124734] hover:bg-[#124734] hover:text-white active:scale-95 transition-all"
            >
              <span>Jelajahi Minuman Kami</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   FOOTER
   ============================================================ */
function FooterSection() {
  return (
    <footer className="bg-[#124734] text-[#FFFDF7] pt-12 pb-8 border-t border-[#FFFDF7]/10" style={sans}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#FFFDF7]/15">

          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <img src={iconImg} alt="Logo"
                className="w-9 h-9 rounded-full object-contain bg-white/90 p-0.5" />
              <span className="text-2xl font-bold tracking-tight text-[#FFFDF7]" style={serif}>Justmine Tea</span>
            </div>
            <p className="text-xs sm:text-sm text-[#FFFDF7]/80 leading-relaxed max-w-sm">
              Good Tea, Good Mood. Menghadirkan kenikmatan teh daun pilihan dan keharuman melati alami untuk menemanimu setiap hari.
            </p>
            <p className="text-xs text-[#D9A55B] font-medium">Buka Setiap Hari: 10.00 - 22.00 WIB</p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wider uppercase text-[#D9A55B]">Navigasi</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#FFFDF7]/80">
              <li><Link to="/menu" className="hover:text-white jt-link">Katalog Menu</Link></li>
              <li><button onClick={() => scrollToId('menu')} className="hover:text-white jt-link">Koleksi Teh</button></li>
              <li><button onClick={() => scrollToId('story')} className="hover:text-white jt-link">Tentang Kami</button></li>
              <li><button onClick={() => scrollToId('benefits')} className="hover:text-white jt-link">Mengapa Justmine</button></li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wider uppercase text-[#D9A55B]">Hubungi Kami</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#FFFDF7]/80">
              <li>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#D9A55B] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  WhatsApp Official
                </a>
              </li>
              <li>
                <a href="https://instagram.com/justminetea" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#D9A55B] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  @justminetea
                </a>
              </li>
              <li>
                <Link to="/kasir" className="flex items-center gap-2 hover:text-[#D9A55B] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                  Tampilan Kasir (Demo)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#FFFDF7]/60">
          <p>&copy; {new Date().getFullYear()} Justmine Tea. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/menu" className="hover:text-white">Menu</Link>
            <Link to="/history" className="hover:text-white">Riwayat</Link>
            <Link to="/profile" className="hover:text-white">Profil</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================
   PAGE UTAMA HOME — landing page murni (tanpa transaksi)
   ============================================================ */
export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden relative bg-[#F7F3E9] text-[#124734]" style={sans}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,600&display=swap');

        html { scroll-behavior: smooth; }

        .jt-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .jt-reveal.jt-in { opacity: 1; transform: none; }

        .jt-link { position: relative; }
        .jt-link::after {
          content: '';
          position: absolute;
          left: 0; bottom: -3px;
          height: 1.5px; width: 100%;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .jt-link:hover::after { transform: scaleX(1); }

        .jt-fade  { animation: jtFade 0.25s ease; }
        @keyframes jtFade { from { opacity: 0; } to { opacity: 1; } }

        .jt-drawer { animation: jtDrawerSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes jtDrawerSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .jt-reveal { opacity: 1; transform: none; transition: none; }
          * { animation: none !important; }
        }
      `}</style>

      <NavigationBar />

      <main>
        <HeroSection />
        <BrandBenefits />
        <OurMenuSection />
        <AboutStory />
      </main>

      <FooterSection />
    </div>
  )
}
