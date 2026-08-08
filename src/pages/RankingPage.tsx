import { useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetchRestaurantsWithStats, fetchAllReviews } from '../lib/queries'
import { scoreColor } from '../lib/scoring'
import { cn } from '../lib/utils'

export function RankingPage() {
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurantsWithStats,
    refetchInterval: 30_000,
  })
  const { data: allReviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: fetchAllReviews,
  })

  const [foodFilter, setFoodFilter] = useState<string | null>(null)
  const [reviewer, setReviewer] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  const foodTypes = [...new Set(restaurants.map(r => r.food_type))].sort()
  const reviewers = [...new Set(allReviews.map(r => r.user_id))].sort()

  const restaurantList = (() => {
    let list = restaurants
    if (foodFilter) list = list.filter(r => r.food_type === foodFilter)

    if (reviewer) {
      const myReviews = allReviews.filter(r => r.user_id === reviewer)
      const myScoreMap: Record<string, number> = {}
      for (const rev of myReviews) myScoreMap[rev.restaurant_id] = rev.total_score
      list = list
        .filter(r => myScoreMap[r.id] !== undefined)
        .map(r => ({ ...r, avg_score: myScoreMap[r.id], review_count: 1 }))
        .sort((a, b) => b.avg_score - a.avg_score)
    }

    return list
  })()

  const logoOpacity = Math.max(0, 0.09 - scrollY * 0.00035)
  const logoBlur = Math.min(scrollY * 0.04, 12)
  const logoScale = 1 + scrollY * 0.0004

  return (
    <div className="relative">
      {/* Logo background */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{
          opacity: logoOpacity,
          filter: `blur(${logoBlur}px)`,
          transform: `scale(${logoScale})`,
          transition: 'filter 0.1s linear',
        }}
      >
        <img src="/ab-testing/logo.png" alt="" aria-hidden="true" className="w-[85vw] max-w-sm" draggable={false} />
      </div>

    <div className="relative z-10 px-5 pt-14 pb-4 max-w-xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[3px] h-7 bg-[#C8302A] rounded-full" />
          <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#9B9894]">
            München · Food Rankings
          </p>
        </div>
        <h1 className="font-serif leading-[0.88] text-[#111110]" style={{ fontSize: 'clamp(52px, 15vw, 72px)' }}>
          A/B<br />Testing
        </h1>
        <div className="flex items-center gap-3 mt-5">
          <div className="h-[1.5px] flex-1 bg-[#111110]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B9894]">
            {restaurantList.length} im Ranking
          </span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="space-y-2.5 mb-8"
      >
        <FilterRow label="Kategorie">
          {[null, ...foodTypes].map(t => (
            <Chip key={t ?? 'alle'} active={foodFilter === t} onClick={() => setFoodFilter(t)}>
              {t ?? 'Alle'}
            </Chip>
          ))}
        </FilterRow>

        {reviewers.length > 0 && (
          <FilterRow label="Von">
            {[null, ...reviewers].map(r => (
              <Chip key={r ?? 'alle'} active={reviewer === r} onClick={() => setReviewer(r)} accent>
                {r ?? 'Allen'}
              </Chip>
            ))}
          </FilterRow>
        )}
      </motion.div>

      {/* List */}
      {isLoading ? (
        <SkeletonList />
      ) : restaurantList.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {restaurantList.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.045 }}
            >
              <Link to={`/restaurant/${r.id}`} className="block group">
                <div className="py-5 flex items-start gap-4">
                  {/* Rank */}
                  <span className="font-serif leading-none text-[#ECEAE4] group-hover:text-[#D8D5CF] transition-colors shrink-0 w-12 text-right tabular-nums select-none"
                    style={{ fontSize: 44 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#9B9894]">
                            {r.food_type}
                          </p>
                          {r.has_seitan && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-semibold tracking-wide">
                              <SeitanLeaf /> Seitan
                            </span>
                          )}
                        </div>
                        <h2 className="font-serif text-[22px] leading-tight text-[#111110] group-hover:text-[#C8302A] transition-colors truncate">
                          {r.name}
                        </h2>
                        {(r.neighborhood || r.review_count > 0) && (
                          <p className="text-xs text-[#9B9894] mt-1 leading-none">
                            {r.neighborhood || ''}
                            {r.neighborhood && r.review_count > 0 && ' · '}
                            {r.review_count > 0 && `${r.review_count} ${r.review_count === 1 ? 'Review' : 'Reviews'}`}
                          </p>
                        )}
                      </div>

                      {/* Score */}
                      <div className="shrink-0 text-right pt-0.5">
                        <span
                          className="font-serif leading-none tabular-nums"
                          style={{ fontSize: 32, color: r.avg_score > 0 ? scoreColor(r.avg_score) : '#D5D3CE' }}
                        >
                          {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'}
                        </span>
                        {i === 0 && r.avg_score > 0 && (
                          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#C8302A] mt-1">#1</p>
                        )}
                      </div>
                    </div>

                    {/* Score bar */}
                    {r.avg_score > 0 && (
                      <div className="mt-3.5 h-[1.5px] bg-[#EDEBE5] overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(r.avg_score / 10) * 100}%` }}
                          transition={{ duration: 0.9, delay: 0.25 + i * 0.04, ease: [0.4, 0, 0.2, 1] }}
                          className="h-full rounded-full"
                          style={{ background: scoreColor(r.avg_score) }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {i < restaurantList.length - 1 && (
                  <div className="h-px bg-[#F2F0EA] ml-16" />
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#B8B5B0] shrink-0 w-16">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, accent, children }: { active: boolean; onClick: () => void; accent?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all',
        active
          ? accent ? 'bg-[#C8302A] text-white' : 'bg-[#111110] text-white'
          : 'bg-[#F2F1ED] text-[#6B6560] hover:bg-[#E8E6E0]'
      )}
    >
      {children}
    </button>
  )
}

function SeitanLeaf() {
  return <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
}

function SkeletonList() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="py-5 flex items-start gap-4 animate-pulse">
          <div className="w-12 h-10 rounded bg-[#F0EEE8] shrink-0" />
          <div className="flex-1 space-y-2 pt-1.5">
            <div className="h-2.5 w-16 rounded-full bg-[#F0EEE8]" />
            <div className="h-6 w-2/3 rounded bg-[#F0EEE8]" />
            <div className="h-2 w-1/3 rounded-full bg-[#F0EEE8]" />
            <div className="h-px w-full bg-[#F0EEE8] mt-3" />
          </div>
          <div className="w-10 h-8 rounded bg-[#F0EEE8] shrink-0 mt-1.5" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
      <p className="font-serif text-5xl text-[#ECEAE4] mb-3">—</p>
      <p className="text-sm text-[#9B9894]">Keine Einträge gefunden</p>
    </motion.div>
  )
}
