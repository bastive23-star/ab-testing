import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', label: 'Ranking', icon: TrophyIcon },
  { to: '/map', label: 'Karte', icon: MapIcon },
  { to: '/add', label: '', icon: PlusIcon, fab: true },
  { to: '/profile', label: 'Profil', icon: UserIcon },
]

export function Nav() {
  const loc = useLocation()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe">
      <div className="mx-3 mb-3">
        <div className="bg-white dark:bg-[#1C1A18] border border-[#E8E6E0] dark:border-[#2D2B27] rounded-[22px] px-2 py-1.5 flex items-center justify-around shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          {links.map(({ to, label, icon: Icon, fab }) => {
            const active = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to)
            return fab ? (
              <NavLink key={to} to={to} aria-label="Hinzufügen">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center -my-1 bg-[#C8302A] shadow-[0_2px_12px_rgba(200,48,42,0.35)]"
                >
                  <Icon className="size-5 text-white" />
                </motion.div>
              </NavLink>
            ) : (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px]"
              >
                <div className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200',
                  active && 'bg-[#F5F4F0] dark:bg-[#2A2724]'
                )}>
                  <Icon className={cn('size-5 transition-colors', active ? 'text-[#C8302A]' : 'text-[#9B9894]')} />
                </div>
                <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-[#C8302A]' : 'text-[#9B9894]')}>
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H3V5h3M18 9h3V5h-3M12 17v4M8 21h8M7 9c0 2.761 2.239 5 5 5s5-2.239 5-5V3H7v6z"/>
    </svg>
  )
}
function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  )
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
