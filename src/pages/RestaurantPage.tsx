import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchRestaurant, fetchReviews, fetchCategories } from '../lib/queries'
import { GlassCard } from '../components/ui/GlassCard'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { scoreColor } from '../lib/scoring'
import { formatDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'

export function RestaurantPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { name } = useAuth()

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => fetchRestaurant(id!),
    enabled: !!id,
  })
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => fetchReviews(id!),
    enabled: !!id,
  })
  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const avgScore = reviews.length
    ? reviews.reduce((s, r) => s + r.total_score, 0) / reviews.length
    : 0

  if (!restaurant) return <LoadingState />

  const hasReviewed = reviews.some(r => r.user_id === name)

  return (
    <div className="pb-4">
      {/* Hero */}
      <div className="relative h-72 bg-[#EAE7E1]">
        {restaurant.cover_photo_url ? (
          <img src={restaurant.cover_photo_url} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🥖</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Back */}
        <button
          onClick={() => nav(-1)}
          className="absolute top-12 left-4 glass rounded-full p-2.5"
          aria-label="Zurück"
        >
          <ChevronLeft />
        </button>
        {/* Score overlay */}
        <div className="absolute bottom-4 right-4">
          <ScoreBadge score={avgScore} size="lg" showLabel />
        </div>
        {/* Title */}
        <div className="absolute bottom-4 left-4 right-20">
          <h1 className="font-serif text-2xl text-white leading-tight drop-shadow">{restaurant.name}</h1>
          <p className="text-sm text-white/80 mt-0.5">{restaurant.neighborhood}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-xl mx-auto">
        {/* Info card */}
        <GlassCard className="p-4 space-y-3">
          {restaurant.address && (
            <Row icon="📍" text={restaurant.address} />
          )}
          {restaurant.google_maps_url && (
            <a href={restaurant.google_maps_url} target="_blank" rel="noopener noreferrer">
              <Row icon="🗺️" text="In Google Maps öffnen" link />
            </a>
          )}
          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
              <Row icon="🌐" text="Website besuchen" link />
            </a>
          )}
          <div className="pt-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => nav(`/review/${restaurant.id}`)}
              disabled={!name}
            >
              {hasReviewed ? 'Bewertung bearbeiten' : 'Jetzt bewerten'}
            </Button>
          </div>
        </GlassCard>

        {/* Category breakdown */}
        {reviews.length > 0 && cats.length > 0 && (
          <GlassCard className="p-4">
            <h2 className="font-semibold text-[#1A1714] mb-4 text-sm">Durchschnitt nach Kategorie</h2>
            <div className="space-y-3">
              {cats.map(cat => {
                const avg = reviews.reduce((s, r) => s + (r.scores[cat.id] ?? 0), 0) / reviews.length
                const pct = (avg / 10) * 100
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">{cat.emoji}</span>
                    <span className="text-sm text-[#6B6560] w-28 shrink-0">{cat.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-black/6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="h-full rounded-full"
                        style={{ background: scoreColor(avg) }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right tabular-nums" style={{ color: scoreColor(avg) }}>
                      {avg.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        )}

        {/* Reviews */}
        <div>
          <h2 className="font-semibold text-[#1A1714] mb-3 px-1">
            {reviews.length} {reviews.length === 1 ? 'Bewertung' : 'Bewertungen'}
          </h2>
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={review.user_id} />
                      <div>
                        <p className="font-medium text-sm text-[#1A1714]">{review.user_id}</p>
                        <p className="text-xs text-[#9E9791]">{formatDate(review.visited_at)}</p>
                      </div>
                    </div>
                    <ScoreBadge score={review.total_score} size="sm" />
                  </div>

                  {/* Category scores */}
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {cats.map(cat => {
                      const s = review.scores[cat.id] ?? 0
                      return (
                        <div key={cat.id} className="flex items-center gap-1.5 glass-subtle rounded-xl px-2.5 py-1.5">
                          <span className="text-sm">{cat.emoji}</span>
                          <span className="text-xs text-[#6B6560] flex-1 truncate">{cat.name}</span>
                          <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor(s) }}>{s}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Photos */}
                  {review.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto mb-3 pb-1 -mx-1 px-1">
                      {review.photos.map(url => (
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="h-20 w-20 shrink-0 rounded-[12px] object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {review.notes && (
                    <p className="text-sm text-[#6B6560] leading-relaxed">{review.notes}</p>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, text, link }: { icon: string; text: string; link?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base mt-0.5">{icon}</span>
      <span className={`text-sm ${link ? 'text-[#C8302A] underline-offset-2 hover:underline' : 'text-[#6B6560]'}`}>{text}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="animate-pulse">
      <div className="h-72 bg-black/6" />
      <div className="p-4 space-y-4">
        <div className="h-32 rounded-[20px] bg-black/6" />
        <div className="h-48 rounded-[20px] bg-black/6" />
      </div>
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}
