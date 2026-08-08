import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchRestaurant, fetchCategories, submitReview, uploadPhoto } from '../lib/queries'
import { calcTotal } from '../lib/scoring'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { RatingSlider } from '../components/ui/RatingSlider'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { useAuth } from '../hooks/useAuth'

export function ReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const nav = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => fetchRestaurant(restaurantId!),
    enabled: !!restaurantId,
  })
  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split('T')[0])
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  function setScore(catId: string, v: number) {
    setScores(p => ({ ...p, [catId]: v }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const totalScore = calcTotal(
    Object.fromEntries(cats.map(c => [c.id, scores[c.id] ?? 5])),
    cats
  )

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Nicht eingeloggt')
      setUploading(true)
      const urls = await Promise.all(photos.map(f => uploadPhoto(f, 'review-photos')))
      setUploading(false)
      await submitReview(
        restaurantId!,
        user.uid,
        Object.fromEntries(cats.map(c => [c.id, scores[c.id] ?? 5])),
        cats,
        urls,
        notes,
        visitedAt,
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', restaurantId] })
      qc.invalidateQueries({ queryKey: ['restaurants'] })
      nav(`/restaurant/${restaurantId}`)
    },
  })

  if (!user) {
    return (
      <div className="px-4 pt-24 text-center">
        <p className="text-[#6B6560]">Bitte zuerst einloggen.</p>
        <Button variant="primary" className="mt-4 mx-auto" onClick={() => nav('/auth')}>Einloggen</Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-[#9E9791] mb-4">
          <ChevronLeft /> Zurück
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[#C8302A] mb-0.5">Bewertung</p>
            <h1 className="font-serif text-2xl text-[#1A1714] leading-tight">{restaurant?.name ?? '…'}</h1>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={totalScore.toFixed(1)}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ScoreBadge score={totalScore} size="lg" showLabel />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="space-y-4">
        {/* Ratings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-4 space-y-5">
            <p className="text-xs font-semibold text-[#9E9791] uppercase tracking-wider">Kategorien</p>
            {cats.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
              >
                <RatingSlider
                  label={cat.name}
                  emoji={cat.emoji}
                  value={scores[cat.id] ?? 5}
                  onChange={v => setScore(cat.id, v)}
                />
              </motion.div>
            ))}
          </GlassCard>
        </motion.div>

        {/* Date */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#1A1714]">Datum des Besuchs</span>
              <input
                type="date"
                value={visitedAt}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setVisitedAt(e.target.value)}
                className="glass rounded-[14px] px-4 py-3 text-sm text-[#1A1714] outline-none focus:ring-2 focus:ring-[#C8302A]/30"
              />
            </label>
          </GlassCard>
        </motion.div>

        {/* Photos */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard className="p-4">
            <p className="text-sm font-medium text-[#1A1714] mb-3">Fotos (optional, max. 5)</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previews.map((url, i) => (
                <img key={i} src={url} alt="" className="h-20 w-20 shrink-0 rounded-[12px] object-cover" />
              ))}
              {previews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-20 w-20 shrink-0 glass-subtle rounded-[12px] flex flex-col items-center justify-center gap-1 text-[#9E9791]"
                >
                  <span className="text-xl">+</span>
                  <span className="text-[10px]">Foto</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </GlassCard>
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard className="p-4">
            <Textarea
              label="Anmerkungen (optional)"
              placeholder="Was war besonders? Tipps für andere?"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </GlassCard>
        </motion.div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={mut.isPending || uploading}
          onClick={() => mut.mutate()}
        >
          Bewertung speichern
        </Button>

        {mut.isError && (
          <p className="text-sm text-red-500 text-center">{(mut.error as Error).message}</p>
        )}
      </div>
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}
