import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetchRestaurantsWithStats } from '../lib/queries'
import { GlassCard } from '../components/ui/GlassCard'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { scoreColor } from '../lib/scoring'

export function RankingPage() {
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurantsWithStats,
    refetchInterval: 30_000,
  })

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="mb-8"
      >
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C8302A] mb-1">München</p>
        <h1 className="font-serif text-4xl text-[#1A1714] leading-tight">
          Bánh Mì<br />Ranking
        </h1>
        <p className="text-sm text-[#6B6560] mt-2">
          {restaurants.length} {restaurants.length === 1 ? 'Restaurant' : 'Restaurants'} bewertet
        </p>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <SkeletonList />
      ) : restaurants.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {restaurants.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link to={`/restaurant/${r.id}`}>
                <GlassCard hover className="p-4 flex items-center gap-4">
                  {/* Rank */}
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

                  {/* Cover */}
                  <div className="shrink-0 w-16 h-16 rounded-[14px] overflow-hidden bg-[#EAE7E1]">
                    {r.cover_photo_url ? (
                      <img src={r.cover_photo_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🥖</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-[#1A1714] text-base leading-tight truncate">{r.name}</h2>
                    <p className="text-xs text-[#9E9791] mt-0.5">{r.neighborhood}</p>
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

                  {/* Score */}
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
        <p className="text-sm text-[#6B6560]">Füge das erste Bánh Mì Restaurant in München hinzu!</p>
      </GlassCard>
    </motion.div>
  )
}
