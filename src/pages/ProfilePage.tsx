import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { fetchUserReviews } from '../lib/queries'
import { lock } from '../lib/auth'
import { getTheme, toggleTheme } from '../lib/theme'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../lib/utils'

export function ProfilePage() {
  const { name } = useAuth()
  const nav = useNavigate()
  const [dark, setDark] = useState(getTheme() === 'dark')

  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', name],
    queryFn: () => fetchUserReviews(name),
    enabled: !!name,
  })

  const avgScore = reviews.length ? reviews.reduce((s, r) => s + r.total_score, 0) / reviews.length : 0

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <GlassCard variant="strong" className="p-5 flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="flex-1">
            <h1 className="font-semibold text-[#1A1714] text-lg">{name}</h1>
            <p className="text-xs text-[#9E9791]">A/B Tester</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const next = toggleTheme(); setDark(next === 'dark') }}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[#9B9894] hover:text-[#1A1714] dark:hover:text-[#F2F0EC] hover:bg-[#F2F1ED] dark:hover:bg-[#252220] transition-all"
              aria-label="Dark mode umschalten"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Button variant="ghost" size="sm" onClick={() => { lock(); nav('/auth') }}>Logout</Button>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mb-6">
        <StatCard value={reviews.length} label="Reviews" />
        <StatCard value={avgScore > 0 ? avgScore.toFixed(1) : '—'} label="Ø Score" accent />
        <StatCard value={new Set(reviews.map(r => r.restaurant_id)).size} label="Orte" />
      </motion.div>

      <div>
        <h2 className="font-semibold text-[#1A1714] mb-3 px-1">Meine Bewertungen</h2>
        {reviews.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-2xl mb-2">🥖</p>
            <p className="text-sm text-[#6B6560]">Noch keine Bewertungen.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                <Link to={`/restaurant/${review.restaurant_id}`}>
                  <GlassCard hover className="p-3.5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[12px] bg-[#EAE7E1] shrink-0 flex items-center justify-center text-xl">🥖</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#1A1714] truncate">{(review.restaurant as { name?: string })?.name ?? 'Restaurant'}</p>
                      <p className="text-xs text-[#9E9791]">{formatDate(review.visited_at)}</p>
                    </div>
                    <ScoreBadge score={review.total_score} size="sm" />
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SunIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
}

function MoonIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
}

function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <GlassCard className="p-3 text-center">
      <p className={`text-2xl font-semibold ${accent ? 'text-[#C8302A]' : 'text-[#1A1714]'}`}>{value}</p>
      <p className="text-xs text-[#9E9791] mt-0.5">{label}</p>
    </GlassCard>
  )
}
