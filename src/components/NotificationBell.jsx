import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../context/NotificationContext.jsx'
import { timeAgo } from '../utils/notifications.js'

const STATUS_ICON = {
  diproses: 'local_cafe',
  siap: 'notifications_active',
  selesai: 'check_circle',
  dibatalkan: 'cancel',
}

// variant: 'mobile' (panel selebar layar, di bawah header) | 'desktop' (dropdown di bawah lonceng)
export default function NotificationBell({ variant = 'desktop' }) {
  const { notifications, unread, markAllRead, clearAll, openNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const buttonCls =
    variant === 'mobile'
      ? 'w-10 h-10 relative flex items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors'
      : 'relative w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors'

  const panelCls =
    variant === 'mobile'
      ? 'fixed left-3 right-3 top-[68px] z-50'
      : 'absolute right-0 top-full mt-2 w-96 z-50'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
        aria-expanded={open}
        className={buttonCls}
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-surface-container-lowest">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`${panelCls} bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-xl overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/40">
            <h2 className="text-sm font-bold text-on-surface">Notifikasi</h2>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-semibold text-primary-container underline underline-offset-4">
                Tandai dibaca
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] text-outline">notifications_off</span>
                <p className="text-sm mt-2">Belum ada notifikasi.</p>
                <p className="text-xs mt-1">Kami kabari di sini saat pesananmu siap diambil.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    openNotification(n)
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-outline-variant/30 last:border-b-0 hover:bg-surface-container-low transition-colors ${n.read ? '' : 'bg-secondary-container/40'}`}
                >
                  <span className="material-symbols-outlined text-[20px] text-primary-container mt-0.5 shrink-0">
                    {STATUS_ICON[n.status] || 'notifications'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-on-surface">{n.title}</span>
                    <span className="block text-xs text-on-surface-variant mt-0.5">{n.body}</span>
                    <span className="block text-[11px] text-on-surface-variant mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-error mt-1.5 shrink-0" aria-label="Belum dibaca" />}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-outline-variant/40 text-right">
              <button type="button" onClick={clearAll} className="text-[11px] text-on-surface-variant hover:text-error">
                Hapus semua
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
