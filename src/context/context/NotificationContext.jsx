import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { useAuth } from './AuthContext.jsx'
import { getGuestOrderIds } from '../utils/guestOrders.js'
import {
  MAX_NOTIFICATIONS,
  buildNotification,
  isFinalStatus,
  loadNotifications,
  loadSeen,
  markSeen,
  recentGuestIds,
  saveNotifications,
  saveSeen,
  statusChanged,
} from '../utils/notifications.js'

const NotificationContext = createContext(null)

/* ---------- efek "ping": getar, bunyi singkat, judul tab berkedip ---------- */

// AudioContext dipakai ulang dan "dibuka kuncinya" (resume) pada sentuhan pertama pelanggan.
// Browser HP (terutama iPhone) menolak bunyi yang tidak dipicu sentuhan; tanpa ini bunyi sering bisu.
let audioCtx = null

function getAudioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  return audioCtx
}

function unlockAudio() {
  const ctx = getAudioCtx()
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => { })
}

// `times` = jumlah nada. Status "siap" dibuat 2 nada naik supaya lebih menarik perhatian.
function beep(times = 1) {
  const ctx = getAudioCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => { })
  const notes = times > 1 ? [880, 1175] : [880]
  notes.forEach((freq, i) => {
    const t0 = ctx.currentTime + i * 0.22
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2)
    osc.start(t0)
    osc.stop(t0 + 0.22)
  })
}

let titleTimer = null
function blinkTitle(text) {
  if (typeof document === 'undefined' || !document.hidden || titleTimer) return
  const original = document.title
  let on = false
  titleTimer = setInterval(() => {
    document.title = on ? original : `🔔 ${text}`
    on = !on
  }, 1000)
  const stop = () => {
    if (document.hidden) return
    clearInterval(titleTimer)
    titleTimer = null
    document.title = original
    document.removeEventListener('visibilitychange', stop)
  }
  document.addEventListener('visibilitychange', stop)
}

function ping(n) {
  try { navigator.vibrate?.(n.status === 'siap' ? [200, 100, 200] : [120]) } catch { /* tidak didukung */ }
  try { beep(n.status === 'siap' ? 2 : 1) } catch { /* audio diblokir browser */ }
  blinkTitle(n.title)
}

/* ---------- toast ---------- */

const STATUS_ICON = {
  diproses: 'local_cafe',
  siap: 'notifications_active',
  selesai: 'check_circle',
  dibatalkan: 'cancel',
}

function Toast({ toast, onClose, onOpen }) {
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(onClose, toast.status === 'siap' ? 10000 : 6000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id])

  if (!toast) return null
  return (
    <div className="fixed top-3 inset-x-3 z-[80] flex justify-center pointer-events-none">
      <div role="status" aria-live="polite" className="pointer-events-auto w-full max-w-md flex items-start gap-1 bg-primary text-white rounded-2xl shadow-xl">
        <button type="button" onClick={() => onOpen(toast)} className="flex-1 min-w-0 flex items-start gap-3 text-left px-4 py-3">
          <span className="material-symbols-outlined text-[22px] mt-0.5 shrink-0">{STATUS_ICON[toast.status] || 'notifications'}</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{toast.title}</span>
            <span className="block text-xs opacity-90 mt-0.5">{toast.body}</span>
          </span>
        </button>
        <button type="button" onClick={onClose} aria-label="Tutup notifikasi" className="w-9 h-9 mt-1.5 mr-1.5 shrink-0 rounded-full flex items-center justify-center hover:bg-white/15">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  )
}

/* ---------- provider ---------- */

export function NotificationProvider({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [items, setItems] = useState(loadNotifications)
  const [toast, setToast] = useState(null)
  const seenRef = useRef(loadSeen()) // { [orderId]: status terakhir yang sudah dilihat }
  const pathRef = useRef(location.pathname)
  const guestUnsubs = useRef(new Map())

  useEffect(() => { pathRef.current = location.pathname }, [location.pathname])

  // Buka kunci audio pada sentuhan pertama (syarat browser HP agar notifikasi nanti bisa berbunyi).
  useEffect(() => {
    const events = ['pointerdown', 'touchend', 'keydown']
    const handler = () => {
      unlockAudio()
      if (audioCtx && audioCtx.state === 'running') events.forEach((e) => window.removeEventListener(e, handler))
    }
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, handler))
  }, [])
  useEffect(() => { saveNotifications(items) }, [items])

  // Dipanggil tiap kali Firestore melaporkan status sebuah order.
  // Status yang sudah tersimpan di localStorage juga dibandingkan, jadi perubahan yang terjadi
  // saat web tertutup tetap terdeteksi begitu web dibuka lagi.
  const handleStatus = useCallback((orderId, orderCode, status) => {
    const prev = seenRef.current[orderId]
    seenRef.current = markSeen(seenRef.current, orderId, status)
    saveSeen(seenRef.current)
    if (!statusChanged(prev, status)) return

    const n = buildNotification(orderId, orderCode, status)
    if (!n) return

    // Kalau pelanggan sedang melihat halaman Tracking order ini, status sudah terlihat di layar:
    // cukup masuk daftar (sudah dibaca), tanpa toast.
    const onTrackingPage = !document.hidden && pathRef.current === `/tracking/${orderId}`
    setItems((p) => [{ ...n, read: onTrackingPage }, ...p].slice(0, MAX_NOTIFICATIONS))
    if (!onTrackingPage) setToast(n)
    ping(n)
  }, [])

  // Member: satu listener untuk semua pesanannya.
  useEffect(() => {
    if (loading || !user) return undefined
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid))
    const unsub = onSnapshot(
      q,
      (snap) =>
        snap.docChanges().forEach((ch) => {
          if (ch.type === 'removed') return
          const o = ch.doc.data()
          handleStatus(ch.doc.id, o.orderCode, o.status)
        }),
      (err) => console.warn('Notifikasi: gagal memantau pesanan member:', err)
    )
    return unsub
  }, [user, loading, handleStatus])

  // Tamu: satu listener per order (maks. 5 terbaru dalam 12 jam). Daftar id dibaca ulang
  // setiap pindah halaman, jadi order yang baru dibuat di Checkout langsung ikut dipantau.
  useEffect(() => {
    if (loading) return
    const map = guestUnsubs.current
    const wanted = user
      ? []
      : recentGuestIds(getGuestOrderIds()).filter((id) => !isFinalStatus(seenRef.current[id]))

    for (const [id, unsub] of map) {
      if (!wanted.includes(id)) {
        unsub()
        map.delete(id)
      }
    }
    for (const id of wanted) {
      if (map.has(id)) continue
      const unsub = onSnapshot(
        doc(db, 'orders', id),
        (snap) => {
          if (!snap.exists()) return
          const o = snap.data()
          handleStatus(snap.id, o.orderCode, o.status)
          if (isFinalStatus(o.status)) {
            guestUnsubs.current.get(id)?.()
            guestUnsubs.current.delete(id)
          }
        },
        (err) => console.warn('Notifikasi: gagal memantau pesanan tamu:', err)
      )
      map.set(id, unsub)
    }
  }, [user, loading, location.pathname, handleStatus])

  useEffect(() => {
    const map = guestUnsubs.current
    return () => {
      map.forEach((u) => u())
      map.clear()
    }
  }, [])

  const markAllRead = useCallback(() => setItems((p) => p.map((n) => ({ ...n, read: true }))), [])
  const clearAll = useCallback(() => setItems([]), [])
  const openNotification = useCallback(
    (n) => {
      setItems((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setToast(null)
      navigate(`/tracking/${n.orderId}`)
    },
    [navigate]
  )

  const value = useMemo(
    () => ({
      notifications: items,
      unread: items.filter((n) => !n.read).length,
      markAllRead,
      clearAll,
      openNotification,
    }),
    [items, markAllRead, clearAll, openNotification]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toast toast={toast} onClose={() => setToast(null)} onOpen={openNotification} />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}