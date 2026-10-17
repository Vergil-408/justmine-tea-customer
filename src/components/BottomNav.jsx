import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', end: true, icon: 'eco', label: 'Home' },
  { to: '/menu', icon: 'menu_book', label: 'Menu' },
  { to: '/history', icon: 'history_toggle_off', label: 'Riwayat' },
  { to: '/profile', icon: 'account_circle', label: 'Profil' },
]

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-2px_16px_rgba(42,49,39,0.08)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-14 transition-colors ${isActive ? 'text-primary-container' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}