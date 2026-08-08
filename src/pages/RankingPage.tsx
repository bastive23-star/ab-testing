import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetchRestaurantsWithStats } from '../lib/queries'
import { GlassCard } from '../components/ui/GlassCard'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { scoreColor } from '../lib/scoring'
import { cn } from '../lib/utils'

export function RankingPage() {
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurantsWithStats,
    refetchInterval: 30_000,
  })

  const [filter, setFilter] = useState<string | null>(null)

  const foodTypes = [...new Set(restaurants.map(r => r.food_type))].sort()
  const filtered = filter ? restaurants.filter(r => r.food_type === filter) : restaurants
  const ranked = filtered.map((r, i) => ({ ...r, rank: i + 1 }))

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="mb-6"
      >
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C8302A] mb-1">München</p>
        <h1 className="font-serif text-4xl text-[#1A1714] leading-tight">
          A/B Testing<br />Ranking
        </h1>
        <p className="text-sm text-[#6B6560] mt-2">
          {filtered.length} {filtered.length === 1 ? 'Restaurant' : 'Restaurants'} bewertet
        </p>
      </motion.div>

      {foodTypes.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-5"
        >
          <button
            onClick={() => setFilter(null)}
            className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition-all', filter === null ? 'bg-[#C8302A] text-white' : 'glass-subtle text-[#6B6560]')}
          >
            Alle
          </button>
          {foodTypes.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition-all', filter === t ? 'bg-[#C8302A] text-white' : 'glass-subtle text-[#6B6560]')}
            >
              {t}
            </button>
          ))}
        </motion.div>
      )}

      {isLoading ? (
        <SkeletonList />
      ) : ranked.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {ranked.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link to={`/restaurant/${r.id}`}>
                <GlassCard hover className="p-4 flex items-center gap-4">
                  <div className="shrink-0 w-8 text-center">
                    {i === 0 ? (
                      <span className="text-2xl leading-none">🥇</span>
                    ) : i === 1 ? (
                      <span className="text-2xl leading-none">🥈</span>
                    ) : i === 2 ? (
                      <span className="text-2xl leading-none">🥉</span>
                    ) : (
                      <span className="text-base font-semibold text-[#9E9791]">#{i + 1}</span>
                    )}
                  </div>

                  <div className="shrink-0 w-16 h-16 rounded-[14px] overflow-hidden bg-[#EAE7E1]">
                    {r.cover_photo_url ? (
                      <img src={r.cover_photo_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🥖</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-[#1A1714] text-base leading-tight truncate">{r.name}</h2>
                    <p className="text-xs text-[#9E9791] mt-0.5">{r.neighborhood || r.food_type}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 rounded-full bg-black/8 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(r.avg_score / 10) * 100}%`,
                            background: scoreColor(r.avg_score),
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[#9E9791] shrink-0">
                        {r.review_count} {r.review_count === 1 ? 'Review' : 'Reviews'}
                      </span>
                    </div>
                  </div>

                  <ScoreBadge score={r.avg_score} size="md" />
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass rounded-[20px] p-4 flex items-center gap-4 animate-pulse">
          <div className="w-8 h-6 rounded bg-black/6" />
          <div className="w-16 h-16 rounded-[14px] bg-black/6" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-black/6" />
            <div className="h-3 w-1/3 rounded bg-black/6" />
            <div className="h-1.5 w-full rounded-full bg-black/6" />
          </div>
          <div className="w-12 h-12 rounded-full bg-black/6" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-10 text-center">
        <div className="text-5xl mb-4">🥖</div>
        <h3 className="font-semibold text-[#1A1714] mb-2">Noch keine Einträge</h3>
        <p className="text-sm text-[#6B6560]">Füge das erste Restaurant hinzu!</p>
      </GlassCard>
    </motion.div>
  )
}
