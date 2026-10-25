import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useCartSheet } from '../context/CartSheetContext.jsx'
import { useUserProfile } from '../hooks/useUserProfile.js'
import { useAuth } from '../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'
import TableBadge from './TableBadge.jsx'

const links = [
  { to: '/', end: true, label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/history', label: 'Riwayat' },
  { to: '/profile', label: 'Profil' },
]

function getInitials(name) {
  if (!name) return 'PP'
  const parts = name.trim().split(' ')
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

export default function DesktopNav() {
  const { items } = useCart()
  const { open } = useCartSheet()
  const { points, isLoggedIn } = useUserProfile()
  const { user } = useAuth()
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0)

  const [pulse, setPulse] = useState(false)
  const prevCount = useRef(cartCount)
  useEffect(() => {
    if (cartCount > prevCount.current) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 400)
      return () => clearTimeout(t)
    }
    prevCount.current = cartCount
  }, [cartCount])

  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/40">
      <div className="max-w-[1400px] mx-auto px-8 h-[72px] flex items-center gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/icon.png"
            alt="Justmine Tea"
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-outline-variant/60 shadow-xs"
          />
          <div className="flex flex-col text-left leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">Justmine Tea</span>
              <span className="text-[9px] font-bold tracking-widest text-primary-container bg-secondary-container px-1.5 py-0.5 rounded">ATELIER</span>
            </div>
            <span className="text-[11px] text-on-surface-variant">Artisanal Botanical Infusion</span>
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-7 flex-1">
          {links.map((l, i) => (
            <NavLink
              key={i}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-sm font-semibold pb-1 border-b-2 transition-colors ${isActive ? 'text-primary-container border-primary-container' : 'text-on-surface-variant border-transparent hover:text-on-surface'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 ml-auto shrink-0">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 bg-secondary-container text-on-secondary-container px-3.5 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[15px]">sell</span>
            <span className="text-xs font-semibold">{isLoggedIn ? `${points} Poin Melati` : 'Point Member'}</span>
          </div>

          <TableBadge />

          <NotificationBell variant="desktop" />

          <button onClick={open} className="relative w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <span className={`material-symbols-outlined text-[20px] transition-transform ${pulse ? 'scale-125' : 'scale-100'}`}>shopping_bag</span>
            {cartCount > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center leading-none transition-transform ${pulse ? 'scale-125' : 'scale-100'}`}>
                {cartCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-outline-variant mx-1" />

          <NavLink to="/profile" className="flex items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold">
              {getInitials(user?.displayName)}
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </NavLink>
        </div>
      </div>
    </header>
  )
}
