import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserProfile } from '../hooks/useUserProfile.js'
import { isValidPhone } from '../utils/authErrors.js'
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
      className={`flex w-full items-center gap-3 px-4 py-4 text-left ${
        onClick ? 'transition-colors hover:bg-surface-container-low active:bg-surface-container' : ''
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          danger ? 'bg-error-container text-error' : 'bg-surface-container text-primary'
        }`}
      >
        <Icon name={icon} className="text-xl" />
      </span>
      <span className={`flex-1 text-sm font-semibold ${danger ? 'text-error' : 'text-on-surface'}`}>
        {label}
      </span>
      {value !== undefined && <div className="text-sm font-bold text-on-surface">{value}</div>}
      {onClick && !danger && <Icon name="chevron_right" className="text-xl text-on-surface-variant" />}
    </Tag>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, loading, logout, updateUserPhone } = useAuth()
  const { points, totalOrders, phone } = useUserProfile()

  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [inputPhone, setInputPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleOpenPhoneModal = () => {
    setInputPhone(phone || '')
    setPhoneError('')
    setShowPhoneModal(true)
  }

  const handleSavePhone = async (e) => {
    e.preventDefault()
    const clean = inputPhone.trim()
    if (!clean) return setPhoneError('Nomor WhatsApp wajib diisi.')
    if (!isValidPhone(clean)) return setPhoneError('Format nomor HP tidak valid (contoh: 081234567890).')

    setSavingPhone(true)
    setPhoneError('')
    try {
      await updateUserPhone(clean)
      setShowPhoneModal(false)
    } catch (err) {
      setPhoneError('Gagal menyimpan: ' + err.message)
    } finally {
      setSavingPhone(false)
    }
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
      {/* Peringatan jika nomor WhatsApp belum diisi */}
      {!phone && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-amber-700 shrink-0 mt-0.5">warning</span>
            <div>
              <p className="text-xs font-bold text-amber-900">Nomor WhatsApp belum terdaftar</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Lengkapi nomor WhatsApp agar akun member kamu aktif dan bisa mengumpulkan poin pesanan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenPhoneModal}
            className="shrink-0 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-colors"
          >
            Isi Sekarang
          </button>
        </div>
      )}

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
        <InfoRow
          icon="call"
          label="Nomor WhatsApp"
          value={
            phone ? (
              <span className="text-on-surface font-semibold">{phone}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-100 px-2.5 py-1 rounded-full text-xs">
                <span>+ Isi Nomor</span>
                <span className="text-[10px]">➔</span>
              </span>
            )
          }
          onClick={handleOpenPhoneModal}
        />
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

      {/* Modal Input / Ubah Nomor WhatsApp */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/60">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </span>
                <h3 className="font-bold text-base text-on-surface">Nomor WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Nomor WhatsApp digunakan sebagai identitas member dan mengumpulkan poin belanjamu di Justmine Tea.
            </p>

            <form onSubmit={handleSavePhone} noValidate>
              <label htmlFor="modal-phone" className="block text-xs font-bold text-on-surface-variant mb-1">
                Nomor WhatsApp / HP
              </label>
              <input
                id="modal-phone"
                type="tel"
                autoFocus
                placeholder="Contoh: 081234567890"
                value={inputPhone}
                onChange={(e) => {
                  setInputPhone(e.target.value)
                  setPhoneError('')
                }}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all mb-2"
              />

              {phoneError && <p className="text-xs font-semibold text-error mb-3">{phoneError}</p>}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-3 rounded-full border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPhone}
                  className="flex-1 py-3 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {savingPhone ? 'Menyimpan…' : 'Simpan Nomor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  )
}