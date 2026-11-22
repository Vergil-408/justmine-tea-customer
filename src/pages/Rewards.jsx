import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserProfile } from '../hooks/useUserProfile.js'
import {
  listenToAvailableVouchers,
  listenToCustomerVouchers,
  listenToPointHistory,
  redeemRewardVoucher,
} from '../api/rewards.js'
import DesktopNav from '../components/DesktopNav.jsx'

// Helper format Rupiah
const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

// Helper format tanggal
function formatDateIndo(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTimeIndo(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Rewards() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { points: profilePoints, isLoggedIn } = useUserProfile()

  // State Poin Lokal (diperbarui seketika pasca redeem untuk responsivitas)
  const [currentPoints, setCurrentPoints] = useState(profilePoints ?? 0)

  // Sinkronkan saat data profile Firestore dimuat
  useEffect(() => {
    if (profilePoints !== undefined) {
      setCurrentPoints(profilePoints)
    }
  }, [profilePoints])

  // Tab State: 'available' | 'my_vouchers'
  const [activeTab, setActiveTab] = useState('available')

  // Data State
  const [availableVouchers, setAvailableVouchers] = useState([])
  const [myVouchers, setMyVouchers] = useState([])
  const [pointHistory, setPointHistory] = useState([])

  // Modal Redeem State
  const [selectedVoucherToRedeem, setSelectedVoucherToRedeem] = useState(null)
  const [redeeming, setRedeeming] = useState(false)

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    const unsubAvailable = listenToAvailableVouchers((data) => {
      setAvailableVouchers(data || [])
    })
    const unsubVouchers = listenToCustomerVouchers(user?.uid, (data) => {
      setMyVouchers(data || [])
    })
    const unsubHistory = listenToPointHistory(user?.uid, (data) => {
      setPointHistory(data || [])
    })
    return () => {
      unsubAvailable && unsubAvailable()
      unsubVouchers && unsubVouchers()
      unsubHistory && unsubHistory()
    }
  }, [user])

  function showToast(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Hitung jumlah voucher aktif siap pakai
  const readyVouchersCount = useMemo(() => {
    return myVouchers.filter((v) => v.status === 'ready' && new Date(v.expiresAt) > new Date()).length
  }, [myVouchers])

  // Konfirmasi Tukar Poin
  async function handleConfirmRedeem() {
    if (!selectedVoucherToRedeem) return
    const voucher = selectedVoucherToRedeem

    if (currentPoints < voucher.pointsRequired) {
      showToast('Poin Anda tidak mencukupi untuk menukar reward ini.')
      setSelectedVoucherToRedeem(null)
      return
    }

    setRedeeming(true)
    try {
      await redeemRewardVoucher(user, voucher, currentPoints)
      // Potong saldo poin secara seketika di tampilan
      setCurrentPoints((prev) => Math.max(0, prev - voucher.pointsRequired))
      showToast(`Berhasil! Voucher "${voucher.name}" telah masuk ke dompet Voucher Saya.`)
      setSelectedVoucherToRedeem(null)
      // Pindahkan tab ke My Vouchers agar langsung terlihat
      setActiveTab('my_vouchers')
    } catch (err) {
      showToast(err.message || 'Gagal menukarkan voucher.')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-slate-800 pb-28 lg:pb-16 font-sans">
      {/* Desktop Navigation Header */}
      <DesktopNav />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-[#124734] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-semibold border border-white/20 animate-bounce">
          <span className="material-symbols-outlined text-[20px] text-amber-300 shrink-0">check_circle</span>
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Top App Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#FFFDF7]/95 backdrop-blur-md border-b border-[#124734]/10 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="font-serif font-bold text-base text-[#124734] tracking-tight">
          My Points &amp; Rewards
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 lg:pt-8 space-y-6">
        {/* ============================================================ */}
        {/* 1. LOYALTY BALANCE CARD                                       */}
        {/* ============================================================ */}
        <section className="relative rounded-3xl bg-gradient-to-br from-[#124734] via-[#103D2D] to-[#092D20] p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-[#124734]/30">
          {/* Ambient Leaf Watermark */}
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#D9A55B]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-300 text-[18px]">stars</span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                  Justmine Loyalty Member
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black font-serif tracking-tight text-white flex items-baseline gap-2.5">
                <span>{currentPoints.toLocaleString('id-ID')}</span>
                <span className="text-base sm:text-lg font-normal text-amber-200">Poin</span>
              </h2>
              <p className="text-xs sm:text-sm text-white/85 max-w-md font-light leading-relaxed">
                Kumpulkan poin dari setiap tegukan teh murni dan tukarkan dengan voucher reward favoritmu!
              </p>
            </div>

            {/* Explanation Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 max-w-sm text-xs space-y-1.5 shrink-0">
              <div className="flex items-center gap-2 font-bold text-amber-200">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Cara Perolehan Poin:</span>
              </div>
              <p className="text-white/85 leading-relaxed text-[11px] sm:text-xs">
                Setiap transaksi yang memenuhi syarat akan memberikan <strong>1 poin</strong> untuk setiap <strong>Rp1.000</strong> pembelanjaan di Justmine Tea.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. TAB SWITCHER: VOUCHER TERSEDIA VS VOUCHER SAYA            */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 border-b border-[#124734]/15 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'available'
                ? 'text-[#124734]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">redeem</span>
            <span>Voucher Tersedia</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EAF5EE] text-[#124734] font-extrabold">
              {availableVouchers.length}
            </span>
            {activeTab === 'available' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#124734] rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_vouchers')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'my_vouchers'
                ? 'text-[#124734]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>Voucher Saya</span>
            {readyVouchersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-extrabold">
                {readyVouchersCount} Siap Pakai
              </span>
            )}
            {activeTab === 'my_vouchers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#124734] rounded-t-full" />
            )}
          </button>
        </div>

        {/* ============================================================ */}
        {/* 3. VOUCHER TERSEDIA (REDEEM SECTION)                         */}
        {/* ============================================================ */}
        {activeTab === 'available' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#124734] font-serif">
                  Katalog Voucher Reward
                </h3>
                <p className="text-xs text-slate-500">
                  Tukarkan poin loyalitas Anda sebelum batas kuota penukaran habis.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#A87950]">
                Poin Anda: <strong>{currentPoints.toLocaleString('id-ID')} Pts</strong>
              </span>
            </div>

            {availableVouchers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#124734]/15 p-8 sm:p-12 text-center space-y-3 shadow-xs">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F7F3E9] text-[#124734] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">redeem</span>
                </div>
                <h4 className="font-serif font-bold text-slate-800 text-base sm:text-lg">
                  Belum Ada Voucher Tersedia
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Semua voucher reward saat ini sedang dinonaktifkan atau kuota penukaran telah habis. Kumpulkan terus poin loyalitasmu dari setiap pesanan!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableVouchers.map((voucher) => {
                  const canAfford = currentPoints >= voucher.pointsRequired
                  const isOutOfStock = voucher.remainingQuota <= 0

                  return (
                    <article
                      key={voucher.id}
                      className="relative bg-white rounded-3xl border border-[#124734]/15 shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      {/* Voucher Content */}
                      <div className="flex gap-4 items-start">
                        {/* Thumbnail Image */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#F7F3E9] border border-[#124734]/10 shrink-0">
                          <img
                            src={voucher.imageUrl}
                            alt={voucher.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {/* Detail Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900 leading-snug">
                              {voucher.name}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                              <span className="material-symbols-outlined text-[12px]">stars</span>
                              {voucher.pointsRequired} Pts
                            </span>
                          </div>

                          <p className="text-xs font-bold text-[#124734]">
                            {voucher.benefit}
                          </p>

                          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {voucher.description}
                          </p>

                          {/* Syarat Khusus */}
                          <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                            {voucher.minPurchase > 0 && (
                              <span>Min. Belanja: {rupiah(voucher.minPurchase)}</span>
                            )}
                            <span>Berlaku: {voucher.validityDays} Hari</span>
                            <span>Sisa: {voucher.remainingQuota} Kuota</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="text-[11px]">
                          {canAfford ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Poin mencukupi
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              Kurang {voucher.pointsRequired - currentPoints} poin lagi
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={!canAfford || isOutOfStock}
                          onClick={() => setSelectedVoucherToRedeem(voucher)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            !canAfford || isOutOfStock
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-[#124734] hover:bg-[#092D20] text-white shadow-xs active:scale-95'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">redeem</span>
                          <span>
                            {isOutOfStock
                              ? 'Kuota Habis'
                              : canAfford
                              ? 'Tukar Voucher'
                              : 'Poin Belum Mencukupi'}
                          </span>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* 4. VOUCHER SAYA (MY VOUCHERS WALLET)                          */}
        {/* ============================================================ */}
        {activeTab === 'my_vouchers' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#124734] font-serif">
                  Dompet Voucher Saya
                </h3>
                <p className="text-xs text-slate-500">
                  Voucher reward yang telah berhasil Anda tukar. Pilih saat pemesanan menu.
                </p>
              </div>
            </div>

            {myVouchers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#124734]/15 p-10 text-center space-y-3">
                <span className="material-symbols-outlined text-5xl text-slate-300">
                  account_balance_wallet
                </span>
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Voucher di Dompet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Tukarkan poin loyalitas Anda di tab "Voucher Tersedia" untuk mendapatkan potongan belanja atau gratis topping!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('available')}
                  className="px-5 py-2.5 rounded-xl bg-[#124734] text-white text-xs font-bold shadow-xs hover:bg-[#092D20] transition-all"
                >
                  Lihat Voucher Tersedia
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myVouchers.map((v) => {
                  const isExpired = new Date(v.expiresAt) < new Date()
                  const isUsed = v.status === 'used'
                  const isReady = v.status === 'ready' && !isExpired

                  return (
                    <article
                      key={v.userVoucherId}
                      className={`relative rounded-3xl border p-4 sm:p-5 flex flex-col justify-between overflow-hidden transition-all ${
                        isReady
                          ? 'bg-white border-[#124734]/20 shadow-sm'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A87950] block">
                              Justmine Reward
                            </span>
                            <h4 className="font-serif font-bold text-base text-slate-900 leading-snug">
                              {v.name}
                            </h4>
                          </div>

                          {/* Status Badge */}
                          {isReady ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Siap Pakai
                            </span>
                          ) : isUsed ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 shrink-0">
                              Sudah Dipakai
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 shrink-0">
                              Kadaluwarsa
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-[#124734]">{v.benefit}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{v.description}</p>

                        <div className="pt-2 text-[11px] text-slate-500 space-y-0.5">
                          <p>
                            Masa Berlaku: <strong>Hingga {formatDateTimeIndo(v.expiresAt)}</strong>
                          </p>
                          {v.minPurchase > 0 && (
                            <p>Syarat Belanja: Min. {rupiah(v.minPurchase)}</p>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {isReady ? 'Otomatis di kasir/checkout' : 'Tidak aktif'}
                        </span>

                        {isReady ? (
                          <Link
                            to="/menu"
                            className="px-4 py-2 rounded-xl bg-[#124734] hover:bg-[#092D20] text-white text-xs font-bold shadow-xs active:scale-95 inline-flex items-center gap-1.5"
                          >
                            <span>Gunakan Voucher</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Selesai</span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* 5. POINT HISTORY SECTION                                      */}
        {/* ============================================================ */}
        <section className="bg-white rounded-3xl border border-[#124734]/15 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#124734] text-[20px]">history</span>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900">
                Riwayat Aktivitas Poin
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Catatan Loyalitas</span>
          </div>

          <div className="divide-y divide-slate-100">
            {pointHistory.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Belum ada aktivitas poin tercatat.
              </p>
            ) : (
              pointHistory.map((item) => {
                const isEarn = item.points > 0
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTimeIndo(item.date)}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-black text-xs sm:text-sm ${
                          isEarn ? 'text-[#124734]' : 'text-amber-800'
                        }`}
                      >
                        {isEarn ? `+${item.points}` : item.points} Pts
                      </span>
                      {item.ref && (
                        <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {item.ref}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/* MODAL KONFIRMASI REDEEM VOUCHER                              */}
      {/* ============================================================ */}
      {selectedVoucherToRedeem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up">
            {/* Sheet Handle for Mobile */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-2" />

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                  Konfirmasi Tukar Reward
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pastikan Anda ingin menukarkan poin loyalitas Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucherToRedeem(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Voucher Card Info */}
            <div className="p-4 rounded-2xl bg-[#F7F3E9] border border-[#124734]/15 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A87950] block">
                Reward Pilihan:
              </span>
              <h4 className="font-serif font-bold text-base text-[#124734]">
                {selectedVoucherToRedeem.name}
              </h4>
              <p className="text-xs font-bold text-slate-800">{selectedVoucherToRedeem.benefit}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {selectedVoucherToRedeem.description}
              </p>
            </div>

            {/* Point Calculation Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Poin Anda Saat Ini:</span>
                <span className="font-bold">{currentPoints} Poin</span>
              </div>
              <div className="flex items-center justify-between text-amber-800 font-bold">
                <span>Biaya Tukar Voucher:</span>
                <span>-{selectedVoucherToRedeem.pointsRequired} Poin</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-900 font-black">
                <span>Sisa Poin Setelah Ditukar:</span>
                <span className="text-[#124734]">
                  {currentPoints - selectedVoucherToRedeem.pointsRequired} Poin
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={redeeming}
                onClick={() => setSelectedVoucherToRedeem(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={redeeming}
                onClick={handleConfirmRedeem}
                className="w-1/2 py-2.5 rounded-xl bg-[#124734] hover:bg-[#092D20] text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                {redeeming ? (
                  <span>Menukarkan...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Konfirmasi Tukar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

