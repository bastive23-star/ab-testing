import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchRestaurant, fetchReviews, fetchCategories, toggleSeitan } from '../lib/queries'
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
  const qc = useQueryClient()

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
  const { data: allCats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const avgScore = reviews.length
    ? reviews.reduce((s, r) => s + r.total_score, 0) / reviews.length
    : 0

  if (!restaurant) return <LoadingState />

  const cats = allCats.filter(c => c.food_type === null || c.food_type === restaurant.food_type)

  const seitanMut = useMutation({
    mutationFn: (val: boolean) => toggleSeitan(restaurant.id, val),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant', id] }),
  })

  const hasReviewed = reviews.some(r => r.user_id === name)

  return (
    <div className="pb-4">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        {restaurant.cover_photo_url ? (
          <img src={restaurant.cover_photo_url} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <HeroCover name={restaurant.name} foodType={restaurant.food_type} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {/* Back */}
        <button
          onClick={() => nav(-1)}
          className="absolute top-12 left-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full p-2.5"
          aria-label="Zurück"
        >
          <ChevronLeft />
        </button>
        {/* Score overlay */}
        <div className="absolute bottom-4 right-4 text-right">
          {avgScore > 0 && (
            <div>
              <span className="font-serif text-4xl text-white leading-none">{avgScore.toFixed(1)}</span>
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-0.5">{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</p>
            </div>
          )}
        </div>
        {/* Title */}
        <div className="absolute bottom-4 left-4 right-24">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/60 mb-1">{restaurant.food_type}</p>
          <h1 className="font-serif text-2xl text-white leading-tight">{restaurant.name}</h1>
          {restaurant.neighborhood && <p className="text-sm text-white/70 mt-0.5">{restaurant.neighborhood}</p>}
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
          {/* Seitan toggle */}
          <button
            onClick={() => seitanMut.mutate(!restaurant.has_seitan)}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl transition-all border ${
              restaurant.has_seitan
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-[#F9F8F5] border-[#E8E6E0] text-[#9B9894]'
            }`}
          >
            <span className="text-base">🌱</span>
            <span className="text-sm font-medium flex-1">
              {restaurant.has_seitan ? 'Seitan verfügbar' : 'Kein Seitan'}
            </span>
            <span className="text-xs">{restaurant.has_seitan ? '✓' : '+'}</span>
          </button>
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

function HeroCover({ name, foodType }: { name: string; foodType: string }) {
  const palettes: Record<string, [string, string]> = {
    'Bánh Mì': ['#2D1B0E', '#8B4513'],
    'Ramen':   ['#1A0A0A', '#8B1A1A'],
    'Pizza':   ['#1A1200', '#8B6914'],
    'Burger':  ['#0D1A0D', '#2D5A1B'],
    'Sushi':   ['#001A1A', '#0D5C5C'],
    'Döner':   ['#1A0D00', '#7A3B00'],
    'Tacos':   ['#1A0A1A', '#6B2D6B'],
  }
  const [from, to] = palettes[foodType] ?? ['#111110', '#3D3B38']

  // Derive a unique large letter from the name
  const initial = name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      {/* Large background initial */}
      <span
        className="font-serif select-none pointer-events-none absolute opacity-10"
        style={{ fontSize: '28vw', color: 'white', lineHeight: 1, letterSpacing: '-0.05em' }}
        aria-hidden="true"
      >
        {initial}
      </span>
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
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
