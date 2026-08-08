import { Outlet, useLocation } from 'react-router-dom'
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
      <Nav />
    </div>
  )
}
