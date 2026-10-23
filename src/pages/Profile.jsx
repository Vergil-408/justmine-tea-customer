import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserProfile } from '../hooks/useUserProfile.js'
import MobileHeader from '../components/MobileHeader.jsx'
import DesktopNav from '../components/DesktopNav.jsx'
import BottomNav from '../components/BottomNav.jsx'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}

function Avatar({ user, size = 'h-20 w-20' }) {
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className={`${size} rounded-full border border-outline-variant object-cover`}
      />
    )
  }
  return (
    <div
      className={`${size} flex items-center justify-center rounded-full border border-outline-variant bg-surface-container text-primary`}
    >
      <Icon name="person" className="text-4xl" />
    </div>
  )
}

function InfoRow({ icon, label, value, onClick, danger = false }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-4 text-left ${onClick ? 'transition-colors hover:bg-surface-container-low active:bg-surface-container' : ''
        }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-error-container text-error' : 'bg-surface-container text-primary'
          }`}
      >
        <Icon name={icon} className="text-xl" />
      </span>
      <span className={`flex-1 text-sm font-semibold ${danger ? 'text-error' : 'text-on-surface'}`}>
        {label}
      </span>
      {value !== undefined && <span className="text-sm font-bold text-on-surface">{value}</span>}
      {onClick && !danger && <Icon name="chevron_right" className="text-xl text-on-surface-variant" />}
    </Tag>
  )
}

function GoogleButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-dark active:scale-[0.98]"
    >
      <Icon name="login" className="text-xl" />
      Masuk dengan Google
    </button>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, loading, logout } = useAuth()
  const { points, totalOrders, phone } = useUserProfile()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = user?.displayName || 'Sahabat Justmine'

  /* ---------- Isi per state ---------- */

  const loadingView = (
    <div className="flex flex-col items-center gap-3 py-24 text-on-surface-variant">
      <Icon name="progress_activity" className="animate-spin text-4xl text-primary" />
      <p className="text-sm">Memuat profil…</p>
    </div>
  )

  const guestView = (
    <div className="mx-auto max-w-md rounded-3xl border border-outline-variant bg-white p-7 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-primary">
        <Icon name="person" className="text-4xl" />
      </div>
      <h2 className="font-serif text-3xl font-semibold text-on-surface">Kartu Member</h2>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        Daftar atau masuk akun untuk mengaktifkan kartu member, mengumpulkan poin, dan melihat riwayat E-Receipt.
      </p>
      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full py-3.5 px-6 rounded-full bg-primary hover:bg-primary-container text-white text-sm font-bold shadow-sm transition-all"
        >
          Masuk / Daftar Akun Member
        </button>
      </div>
    </div>
  )

  const memberView = (
    <div className="space-y-5">
      {/* Identitas */}
      <section className="flex items-center gap-4 rounded-3xl border border-outline-variant bg-white p-5 shadow-sm">
        <Avatar user={user} />
        <div className="min-w-0">
          <h2 className="truncate font-serif text-2xl font-semibold text-on-surface">{displayName}</h2>
          {user?.email && <p className="truncate text-xs text-on-surface-variant">{user.email}</p>}
        </div>
      </section>

      {/* Poin */}
      <section className="rounded-3xl bg-[#2E4E3A] p-5 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Poin Loyalty Member</p>
        <p className="mt-1 flex items-baseline gap-2 text-white">
          <span className="text-5xl font-extrabold leading-none">{points ?? 0}</span>
          <span className="text-base font-semibold">pts</span>
        </p>
        <p className="mt-3 text-xs text-white/80">Poin masuk otomatis setelah pesanan selesai.</p>
      </section>

      {/* Statistik & aksi */}
      <section className="divide-y divide-outline-variant overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-sm">
        <InfoRow icon="call" label="Nomor WhatsApp (ID Kasir)" value={phone || 'Belum diisi'} />
        <InfoRow icon="receipt_long" label="Total Pesanan" value={totalOrders ?? 0} />
        <InfoRow icon="history" label="Riwayat Pesanan & E-Receipt" onClick={() => navigate('/history')} />
        <InfoRow icon="logout" label="Keluar Akun" onClick={handleLogout} danger />
      </section>
    </div>
  )

  const infoCards = (
    <div className="space-y-5">
      <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <Icon name="loyalty" className="text-xl text-primary" />
          Tentang loyalty
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-on-surface-variant">
          <li>Setiap Rp1.000 yang kamu belanjakan = 1 poin.</li>
          <li>Poin ditambahkan setelah pesanan berstatus selesai.</li>
          <li>Hanya pesanan saat kamu masuk yang menghasilkan poin.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <Icon name="support_agent" className="text-xl text-primary" />
          Bantuan &amp; kontak
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          Ada kendala dengan pesananmu? Hubungi staf di kasir atau tanyakan langsung ke pramusaji di cafe.
        </p>
      </section>
    </div>
  )

  const content = loading ? loadingView : user ? memberView : guestView

  return (
    <>
      <MobileHeader subtitle="Profil" />
      <DesktopNav />

      {/* Mobile */}
      <main className="min-h-screen bg-background px-4 pb-28 pt-4 lg:hidden">
        <h1 className="mb-4 font-serif text-4xl font-semibold text-on-surface">Profil</h1>
        <div className="space-y-5">
          {content}
          {!loading && infoCards}
        </div>
      </main>

      {/* Desktop */}
      <main className="hidden min-h-screen bg-background py-10 lg:block">
        <div className="mx-auto max-w-5xl px-8">
          <h1 className="mb-8 font-serif text-5xl font-semibold text-on-surface">Profil</h1>
          {loading ? (
            loadingView
          ) : (
            <div className="grid grid-cols-[1.2fr_1fr] items-start gap-8">
              <div>{user ? memberView : guestView}</div>
              {infoCards}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  )
}