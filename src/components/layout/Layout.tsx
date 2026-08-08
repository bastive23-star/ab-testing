import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Nav } from './Nav'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function Layout() {
  const loc = useLocation()
  return (
    <div className="flex flex-col min-h-dvh">
      <AnimatePresence mode="wait">
        <motion.main
          key={loc.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 pb-28"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {/* FAB — bottom right, always visible */}
      <NavLink
        to="/add"
        aria-label="Restaurant hinzufügen"
        className="fixed bottom-24 right-4 z-40"
      >
        <motion.div
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-14 h-14 rounded-full bg-[#C8302A] flex items-center justify-center shadow-[0_6px_28px_rgba(200,48,42,0.5),0_2px_8px_rgba(0,0,0,0.15)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </motion.div>
      </NavLink>

      <Nav />
    </div>
  )
}
