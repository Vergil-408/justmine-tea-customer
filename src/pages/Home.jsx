import { Link } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader.jsx'
import DesktopNav from '../components/DesktopNav.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { useUserProfile } from '../hooks/useUserProfile.js'

// TODO: ganti dengan data menu dari Firestore (ambil menu isFeatured / populer, maks 3-6)
const picks = [
  { id: 'jasmine-sencha', category: 'Green tea', name: 'Jasmine Sencha', desc: 'Sencha lembut dengan aroma melati yang bersih.', price: 28000, favorite: true, imageUrl: '' },
  { id: 'oolong-cloud', category: 'Oolong', name: 'Oolong Cloud', desc: 'Oolong floral, ringan, dengan akhir rasa madu.', price: 32000, favorite: true, imageUrl: '' },
  { id: 'white-peach-bloom', category: 'White tea', name: 'White Peach Bloom', desc: 'White tea dengan peach yang segar dan halus.', price: 36000, favorite: false, imageUrl: '' },
]

// TODO: ganti dengan pesanan aktif dari Firestore, contoh { orderNumber: 'JT-0040', status: 'diproses' }
const activeOrder = null

const statusInfo = {
  menunggu: { label: 'Menunggu', text: 'Pesananmu sudah diterima kasir', chip: 'bg-tertiary-fixed text-tertiary' },
  diproses: { label: 'Diproses', text: 'Minumanmu sedang dibuat', chip: 'bg-secondary-container text-on-secondary-container' },
  siap: { label: 'Siap', text: 'Pesananmu sedang diantar ke meja', chip: 'bg-primary-container text-on-primary' },
}

const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

function Photo({ src, alt, className = '' }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  return (
    <div className={`bg-surface-container flex items-center justify-center text-outline ${className}`}>
      <span className="material-symbols-outlined text-[32px]">local_cafe</span>
    </div>
  )
}

export default function Home() {
  const { points, isLoggedIn } = useUserProfile()
  const order = activeOrder && statusInfo[activeOrder.status]

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface flex flex-col">
      <MobileHeader subtitle="Home" />
      <DesktopNav />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-12 space-y-8 lg:space-y-12">
        {/* Hero */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 lg:pt-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-primary-container">Pesan dari mejamu</p>
            <h1 className="font-serif text-[40px] sm:text-5xl lg:text-6xl leading-[1.05] font-medium text-on-surface">
              Tea, <span className="italic text-tertiary">just mine.</span>
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-md leading-relaxed">
              Racikan teh tenang untuk menemani jedamu.
            </p>
          </div>
          <div className="self-start md:self-auto flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/50 rounded-full pl-2 pr-4 py-1.5 shadow-sm">
            <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">loyalty</span>
            </span>
            <span className="text-xs font-semibold text-on-surface">
              {isLoggedIn ? `${points} Poin Melati` : 'Masuk untuk kumpulkan poin'}
            </span>
          </div>
        </section>

        {/* Banner musiman */}
        <section className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-gradient-to-r from-tertiary-fixed via-surface-container to-surface-container-low p-5 sm:p-8 lg:p-12">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-7 lg:col-span-8 space-y-2 lg:space-y-4 relative z-10">
              <span className="inline-block text-[11px] font-bold tracking-wide text-tertiary bg-surface-container-lowest/80 px-2.5 py-1 rounded-full">
                Seasonal Pour
              </span>
              <h2 className="font-serif text-3xl lg:text-5xl font-semibold text-on-surface leading-tight">Jasmine Bloom</h2>
              <p className="text-xs sm:text-base text-on-surface-variant max-w-md leading-snug lg:leading-relaxed">
                Wangi melati yang lembut berpadu krim nabati, hanya untuk musim ini.
              </p>
              <Link to="/menu" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-container hover:text-tertiary transition-colors pt-1">
                Jelajahi menu
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
            <div className="col-span-5 lg:col-span-4 flex justify-end">
              {/* TODO: ganti dengan foto Jasmine Bloom dari Firestore */}
              <Photo alt="Jasmine Bloom" className="w-full max-w-[220px] aspect-square rounded-2xl shadow-md" />
            </div>
          </div>
        </section>

        {/* Pilihan hari ini */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-primary-container">Untuk kamu</p>
              <h2 className="text-xl lg:text-3xl font-bold tracking-tight">Pilihan hari ini</h2>
            </div>
            <Link to="/menu" className="text-sm font-semibold text-primary-container hover:text-tertiary flex items-center">
              Lihat semua
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-3 lg:gap-6 overflow-x-auto md:overflow-visible snap-x -mx-4 px-4 md:mx-0 md:px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {picks.map((p) => (
              <Link
                key={p.id}
                to="/menu"
                className="snap-start shrink-0 w-44 md:w-auto bg-surface-container-lowest rounded-2xl lg:rounded-3xl border border-outline-variant/50 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative">
                  <Photo src={p.imageUrl} alt={p.name} className="w-full h-32 lg:h-56" />
                  {p.favorite && (
                    <span className="absolute top-2 right-2 bg-surface-container-lowest/90 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Favorit
                    </span>
                  )}
                </div>
                <div className="p-3 lg:p-5 flex flex-col flex-1 gap-1">
                  <span className="text-[11px] text-on-surface-variant">{p.category}</span>
                  <h3 className="font-serif text-lg lg:text-2xl font-semibold leading-tight">{p.name}</h3>
                  <p className="text-xs lg:text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{p.desc}</p>
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-outline-variant/40">
                    <span className="font-bold text-sm lg:text-lg text-tertiary">{rupiah(p.price)}</span>
                    <span className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Pesanan aktif */}
        {order && (
          <Link
            to="/tracking"
            className="flex items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex w-8 h-8 items-center justify-center rounded-full bg-secondary-container">
                <span className="absolute w-3 h-3 rounded-full bg-primary animate-ping opacity-60" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-primary-container" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  Pesanan aktif {activeOrder.orderNumber}
                  <span className={`ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${order.chip}`}>{order.label}</span>
                </p>
                <p className="text-xs text-on-surface-variant truncate">{order.text}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </Link>
        )}

        {/* Akses demo kasir */}
        <div className="flex justify-center">
          <Link to="/kasir" className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant hover:text-primary-container bg-surface-container-lowest border border-outline-variant/50 rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-[16px] text-tertiary">storefront</span>
            Buka tampilan kasir
            <span className="bg-surface-container-high text-[10px] px-1.5 py-0.5 rounded">Demo</span>
          </Link>
        </div>
      </main>

      {/* Footer (desktop) */}
      <footer className="hidden lg:block border-t border-outline-variant/50 bg-surface-container-lowest/70">
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            {/* Taruh file logo di public/logo.png */}
            <img src="/logo.png" alt="Justmine Tea" className="w-10 h-10 rounded-full object-cover" />
            <p>© {new Date().getFullYear()} Justmine Tea. Semua hak dilindungi.</p>
          </div>
          <div className="flex items-center gap-6">
            <span>Kebijakan Privasi</span>
            <span>Bantuan Meja</span>
            <span>Instagram</span>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  )
}