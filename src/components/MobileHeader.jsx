import NotificationBell from './NotificationBell.jsx'
import TableBadge from './TableBadge.jsx'

export default function MobileHeader({ subtitle = 'Home' }) {
    return (
        <header className="lg:hidden sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(42,49,39,0.06)]">
            <div className="h-16 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[18px]">spa</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-semibold text-primary-container truncate leading-tight">Justmine Tea</span>
                        <span className="text-[11px] text-on-surface-variant truncate -mt-0.5">{subtitle}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <TableBadge className="mr-1" />
                    <NotificationBell variant="mobile" />
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
