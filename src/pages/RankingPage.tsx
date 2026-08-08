import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetchRestaurantsWithStats } from '../lib/queries'
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

  return (
    <div className="px-5 pt-14 pb-4 max-w-xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9B9894] mb-2">München</p>
        <h1 className="font-serif text-5xl text-[#111110] leading-[1.05]">
          A/B<br />Testing
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-[#E8E6E0]" />
          <span className="text-xs text-[#9B9894]">{filtered.length} Restaurants</span>
        </div>
      </motion.div>

      {/* Filter */}
      {foodTypes.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-1.5 mb-7"
        >
          {[null, ...foodTypes].map(t => (
            <button
              key={t ?? 'alle'}
              onClick={() => setFilter(t)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all border',
                filter === t
                  ? 'bg-[#111110] text-white border-[#111110]'
                  : 'bg-white text-[#5C5B57] border-[#E8E6E0] hover:border-[#C8C6C0]'
              )}
            >
              {t ?? 'Alle'}
            </button>
          ))}
        </motion.div>
      )}

      {/* List */}
      {isLoading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link to={`/restaurant/${r.id}`} className="block group">
                <div className="py-4 flex items-start gap-4">
                  {/* Rank */}
                  <span className="font-serif text-5xl leading-none text-[#E8E6E0] group-hover:text-[#D0CEC8] transition-colors shrink-0 w-14 text-right">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Main content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-serif text-xl text-[#111110] leading-tight group-hover:text-[#C8302A] transition-colors truncate">
                          {r.name}
                        </h2>
                        <p className="text-xs text-[#9B9894] mt-0.5">
                          {r.neighborhood || r.food_type}
                          {r.review_count > 0 && ` · ${r.review_count} ${r.review_count === 1 ? 'Review' : 'Reviews'}`}
                        </p>
                      </div>
                      {/* Score */}
                      <div className="shrink-0 text-right">
                        <span
                          className="font-serif text-2xl leading-none tabular-nums"
                          style={{ color: r.avg_score > 0 ? scoreColor(r.avg_score) : '#9B9894' }}
                        >
                          {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'}
                        </span>
                        {i === 0 && r.avg_score > 0 && (
                          <p className="text-[9px] uppercase tracking-widest text-[#C8302A] mt-0.5">#1</p>
                        )}
                      </div>
                    </div>

                    {/* Score bar */}
                    {r.avg_score > 0 && (
                      <div className="mt-2.5 h-px bg-[#E8E6E0] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(r.avg_score / 10) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                          className="h-full"
                          style={{ background: scoreColor(r.avg_score) }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {i < filtered.length - 1 && (
                  <div className="h-px bg-[#F0EEE8] ml-18" />
                )}
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
    <div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="py-4 flex items-start gap-4 animate-pulse">
          <div className="w-14 h-10 rounded bg-[#F0EEE8]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-2/3 rounded bg-[#F0EEE8]" />
            <div className="h-3 w-1/3 rounded bg-[#F0EEE8]" />
            <div className="h-px w-full bg-[#F0EEE8]" />
          </div>
          <div className="w-10 h-7 rounded bg-[#F0EEE8]" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-16 text-center"
    >
      <p className="font-serif text-4xl text-[#E8E6E0] mb-4">—</p>
      <p className="text-sm text-[#9B9894]">Noch keine Einträge</p>
      <p className="text-xs text-[#C0BEB8] mt-1">Füge das erste Restaurant hinzu</p>
    </motion.div>
  )
}
