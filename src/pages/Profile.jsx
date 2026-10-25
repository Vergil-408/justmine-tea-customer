import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserProfile } from '../hooks/useUserProfile.js'
import { compressAvatar } from '../utils/avatarImage.js'
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

function Avatar({ photoURL, name = '', size = 'h-20 w-20', textClass = 'text-4xl' }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name ? `Foto ${name}` : 'Foto Profil'}
        referrerPolicy="no-referrer"
        className={`${size} rounded-full border border-outline-variant object-cover shadow-inner`}
      />
    )
  }
  return (
    <div
      className={`${size} flex items-center justify-center rounded-full border border-outline-variant bg-surface-container text-primary shadow-inner`}
    >
      <Icon name="person" className={textClass} />
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

const PRESET_AVATARS = [
  { id: 'matcha', name: 'Matcha', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Matcha&backgroundColor=b6e3f4' },
  { id: 'jasmine', name: 'Jasmine', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jasmine&backgroundColor=c0aede' },
  { id: 'boba', name: 'Boba Tea', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BobaTea&backgroundColor=ffd5dc' },
  { id: 'oolong', name: 'Oolong', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Oolong&backgroundColor=d1d4f9' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, loading, logout, updateCustomerProfile } = useAuth()
  const { points, totalOrders, phone, profile } = useUserProfile()

  // State untuk Modal Pengaturan Profil
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fileInputRef = useRef(null)

  // Validasi Nama Lengkap: TIDAK boleh mengandung angka
  const validateName = (val) => {
    const trimmed = (val ?? '').trim()
    if (!trimmed) {
      return 'Nama lengkap wajib diisi.'
    }
    if (/\d/.test(val)) {
      return 'Nama lengkap tidak boleh mengandung angka.'
    }
    if (trimmed.length < 2) {
      return 'Nama lengkap minimal 2 karakter.'
    }
    return ''
  }

  // Validasi Nomor Telepon: HANYA boleh berisi angka
  const validatePhone = (val) => {
    const trimmed = (val ?? '').trim()
    if (!trimmed) {
      return 'Nomor telepon wajib diisi.'
    }
    if (/[^\d]/.test(val)) {
      return 'Nomor telepon hanya boleh berisi angka (tidak boleh mengandung huruf atau simbol).'
    }
    if (trimmed.length < 9 || trimmed.length > 15) {
      return 'Nomor telepon harus antara 9 - 15 digit angka.'
    }
    return ''
  }

  // Form validity check
  const currentNameError = validateName(editName)
  const currentPhoneError = validatePhone(editPhone)
  const isFormValid = !currentNameError && !currentPhoneError && !savingSettings

  const currentDisplayName = profile?.displayName || user?.displayName || 'Sahabat Justmine'
  const currentPhone = profile?.phone || phone || ''
  const currentPhoto = profile?.photoURL || user?.photoURL || ''

  const handleOpenSettings = () => {
    setEditName(currentDisplayName === 'Sahabat Justmine' ? '' : currentDisplayName)
    setEditPhone(currentPhone)
    setAvatarPreview(currentPhoto)
    setNameError('')
    setPhoneError('')
    setAvatarError('')
    setSaveError('')
    setSaveSuccess(false)
    setShowSettingsModal(true)
  }

  const handleNameChange = (e) => {
    const val = e.target.value
    setEditName(val)
    setNameError(validateName(val))
    if (saveError) setSaveError('')
  }

  const handlePhoneChange = (e) => {
    const val = e.target.value
    setEditPhone(val)
    setPhoneError(validatePhone(val))
    if (saveError) setSaveError('')
  }

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError('')
    try {
      // Kompres gambar menjadi WebP/JPEG 1:1 maksimal 256x256 (~15-25KB)
      const compressedDataUrl = await compressAvatar(file)
      setAvatarPreview(compressedDataUrl)
    } catch (err) {
      setAvatarError(err.message || 'Gagal memproses foto profil.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview('')
    setAvatarError('')
  }

  const handleSelectPresetAvatar = (url) => {
    setAvatarPreview(url)
    setAvatarError('')
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()

    const nErr = validateName(editName)
    const pErr = validatePhone(editPhone)

    if (nErr || pErr) {
      setNameError(nErr)
      setPhoneError(pErr)
      return
    }

    setSavingSettings(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      // Pembaruan data profil secara real-time ke Firebase Firestore & Firebase Auth
      await updateCustomerProfile({
        displayName: editName.trim(),
        phone: editPhone.trim(),
        photoURL: avatarPreview || '',
      })

      setSaveSuccess(true)
      setTimeout(() => {
        setShowSettingsModal(false)
        setSaveSuccess(false)
      }, 700)
    } catch (err) {
      console.error('Gagal memperbarui profil:', err)
      setSaveError(err.message || 'Terjadi kesalahan saat menyimpan data ke Firebase.')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  /* ---------- Tampilan per state ---------- */

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
      {!currentPhone && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-amber-700 shrink-0 mt-0.5">warning</span>
            <div>
              <p className="text-xs font-bold text-amber-900">Nomor Telepon belum terdaftar</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Lengkapi nomor telepon agar akun member kamu aktif dan bisa mengumpulkan poin pesanan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenSettings}
            className="shrink-0 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-colors"
          >
            Lengkapi
          </button>
        </div>
      )}

      {/* Identitas Card & Tombol Settings */}
      <section className="flex items-center gap-4 rounded-3xl border border-outline-variant bg-white p-5 shadow-sm">
        <div className="relative shrink-0">
          <Avatar photoURL={currentPhoto} name={currentDisplayName} size="h-20 w-20" />
          <button
            type="button"
            onClick={handleOpenSettings}
            title="Ubah Foto Profil"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-container transition-colors"
          >
            <Icon name="photo_camera" className="text-sm" />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-2xl font-semibold text-on-surface">{currentDisplayName}</h2>
          {user?.email && <p className="truncate text-xs text-on-surface-variant">{user.email}</p>}
          {currentPhone && (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
              <Icon name="call" className="text-sm" />
              <span>{currentPhone}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenSettings}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-xs font-bold text-on-surface transition-all shadow-sm active:scale-95"
        >
          <Icon name="tune" className="text-base text-primary" />
          <span>Settings</span>
        </button>
      </section>

      {/* Poin Loyalty */}
      <section className="rounded-3xl bg-[#2E4E3A] p-5 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Poin Loyalty Member</p>
        <p className="mt-1 flex items-baseline gap-2 text-white">
          <span className="text-5xl font-extrabold leading-none">{points ?? 0}</span>
          <span className="text-base font-semibold">pts</span>
        </p>
        <p className="mt-3 text-xs text-white/80">Poin masuk otomatis setelah pesanan selesai.</p>
      </section>

      {/* Statistik & Aksi Profil */}
      <section className="divide-y divide-outline-variant overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-sm">
        <InfoRow
          icon="manage_accounts"
          label="Pengaturan Profil"
          value={<span className="text-xs font-semibold text-primary">Ubah Nama, HP & Foto</span>}
          onClick={handleOpenSettings}
        />
        <InfoRow
          icon="call"
          label="Nomor Telepon"
          value={
            currentPhone ? (
              <span className="text-on-surface font-semibold">{currentPhone}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-100 px-2.5 py-1 rounded-full text-xs">
                <span>+ Isi Nomor</span>
                <span className="text-[10px]">➔</span>
              </span>
            )
          }
          onClick={handleOpenSettings}
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

      {/* ================= MODAL SETTINGS PROFIL ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-secondary-container text-primary flex items-center justify-center">
                  <Icon name="tune" className="text-xl" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-on-surface leading-tight">Pengaturan Profil</h3>
                  <p className="text-[11px] text-on-surface-variant">Update data &amp; foto ke Firebase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Error / Success Feedback Banner */}
            {saveSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-900 flex items-center gap-2 text-xs font-bold animate-fadeIn">
                <Icon name="check_circle" className="text-emerald-600 text-lg" />
                <span>Profil berhasil diperbarui di Firebase!</span>
              </div>
            )}
            {saveError && (
              <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-red-900 flex items-center gap-2 text-xs font-bold animate-fadeIn">
                <Icon name="error" className="text-red-600 text-lg" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} noValidate className="space-y-4">
              {/* Bagian Foto Profil */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">
                  Foto Profil
                </label>
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant">
                  <div className="relative shrink-0">
                    <Avatar
                      photoURL={avatarPreview}
                      name={editName || currentDisplayName}
                      size="h-16 w-16"
                      textClass="text-3xl"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-colors flex items-center gap-1"
                      >
                        <Icon name="upload" className="text-sm" />
                        <span>Pilih Foto</span>
                      </button>

                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-2.5 py-1.5 rounded-full border border-outline-variant hover:bg-error-container hover:text-error text-xs font-semibold text-on-surface-variant transition-colors"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant leading-tight">
                      Maksimal 10 MB. Foto otomatis dipotong persegi (1:1) dan dioptimasi.
                    </p>
                  </div>
                </div>

                {/* Preset Avatar Cepat */}
                <div className="mt-2.5">
                  <p className="text-[11px] font-semibold text-on-surface-variant mb-1.5">
                    Atau gunakan avatar instan:
                  </p>
                  <div className="flex items-center gap-2">
                    {PRESET_AVATARS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(item.url)}
                        title={`Pilih ${item.name}`}
                        className={`h-9 w-9 rounded-full overflow-hidden border-2 transition-transform active:scale-90 ${
                          avatarPreview === item.url ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-outline-variant hover:border-primary/50'
                        }`}
                      >
                        <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {avatarError && (
                  <p className="text-xs font-semibold text-error mt-1.5 flex items-center gap-1">
                    <Icon name="error" className="text-sm" />
                    <span>{avatarError}</span>
                  </p>
                )}
              </div>

              {/* Input Nama Lengkap (Validasi: TIDAK BOLEH MENGANDUNG ANGKA) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="edit-name" className="text-xs font-bold text-on-surface-variant">
                    Nama Lengkap <span className="text-error">*</span>
                  </label>
                  <span className="text-[10px] text-on-surface-variant">Tanpa angka</span>
                </div>
                <div className="relative">
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={handleNameChange}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-on-surface bg-surface-container-lowest transition-all focus:outline-none focus:ring-2 ${
                      nameError
                        ? 'border-error focus:border-error focus:ring-error/20 bg-red-50/20'
                        : editName.trim()
                        ? 'border-emerald-600/50 focus:border-primary focus:ring-primary/20'
                        : 'border-outline-variant focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                  {editName.trim() && !nameError && (
                    <span className="absolute right-3 top-2.5 text-emerald-600">
                      <Icon name="check_circle" className="text-base" />
                    </span>
                  )}
                </div>

                {/* Real-time error message */}
                {nameError ? (
                  <p className="flex items-center gap-1 text-xs font-semibold text-error mt-1.5 animate-fadeIn">
                    <Icon name="error" className="text-sm shrink-0" />
                    <span>{nameError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Hanya huruf alfabet dan spasi (tidak boleh mengandung angka).
                  </p>
                )}
              </div>

              {/* Input Nomor Telepon (Validasi: HANYA BOLEH ANGKA) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="edit-phone" className="text-xs font-bold text-on-surface-variant">
                    Nomor Telepon / WhatsApp <span className="text-error">*</span>
                  </label>
                  <span className="text-[10px] text-on-surface-variant">Hanya angka</span>
                </div>
                <div className="relative">
                  <input
                    id="edit-phone"
                    type="tel"
                    inputMode="numeric"
                    value={editPhone}
                    onChange={handlePhoneChange}
                    placeholder="Contoh: 081234567890"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-on-surface bg-surface-container-lowest transition-all focus:outline-none focus:ring-2 ${
                      phoneError
                        ? 'border-error focus:border-error focus:ring-error/20 bg-red-50/20'
                        : editPhone.trim()
                        ? 'border-emerald-600/50 focus:border-primary focus:ring-primary/20'
                        : 'border-outline-variant focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                  {editPhone.trim() && !phoneError && (
                    <span className="absolute right-3 top-2.5 text-emerald-600">
                      <Icon name="check_circle" className="text-base" />
                    </span>
                  )}
                </div>

                {/* Real-time error message */}
                {phoneError ? (
                  <p className="flex items-center gap-1 text-xs font-semibold text-error mt-1.5 animate-fadeIn">
                    <Icon name="error" className="text-sm shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Hanya boleh berisi 9–15 digit angka (tanpa huruf, spasi, atau simbol).
                  </p>
                )}
              </div>

              {/* Tombol Simpan & Batal */}
              <div className="flex gap-2.5 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  disabled={savingSettings}
                  className="flex-1 py-2.5 rounded-full border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || savingSettings}
                  title={
                    !isFormValid
                      ? 'Harap isi Nama Lengkap (tanpa angka) dan Nomor Telepon (hanya angka) dengan benar.'
                      : 'Simpan ke Firebase'
                  }
                  className="flex-1 py-2.5 px-4 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {savingSettings ? (
                    <>
                      <Icon name="progress_activity" className="animate-spin text-sm" />
                      <span>Menyimpan…</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="text-sm" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
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