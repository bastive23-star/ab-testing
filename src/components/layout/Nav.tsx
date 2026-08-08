import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Nav() {
  const loc = useLocation()
  const active = (to: string) => to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe">
      <div className="relative mx-3 mb-3">

        {/* Tab bar */}
        <div className="bg-white dark:bg-[#1C1A18] border border-[#E8E6E0] dark:border-[#2D2B27] rounded-[22px] shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex items-center">
          <Tab to="/" label="Ranking" icon={TrophyIcon} active={active('/')} />
          <Tab to="/map" label="Karte" icon={MapIcon} active={active('/map')} />
          <Tab to="/profile" label="Profil" icon={UserIcon} active={active('/profile')} />
        </div>

      </div>
    </nav>
  )
}

function Tab({ to, label, icon: Icon, active }: { to: string; label: string; icon: (p: { className?: string }) => React.ReactElement; active: boolean }) {
  return (
    <NavLink to={to} className="flex-1 flex flex-col items-center gap-0.5 py-1.5 px-2">
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200',
        active && 'bg-[#F5F4F0] dark:bg-[#2A2724]'
      )}>
        <Icon className={cn('size-5 transition-colors', active ? 'text-[#C8302A]' : 'text-[#9B9894]')} />
      </div>
      <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-[#C8302A]' : 'text-[#9B9894]')}>
        {label}
      </span>
    </NavLink>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H3V5h3M18 9h3V5h-3M12 17v4M8 21h8M7 9c0 2.761 2.239 5 5 5s5-2.239 5-5V3H7v6z"/></svg>
}
function MapIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
}
function UserIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
