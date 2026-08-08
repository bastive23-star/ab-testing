import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchRestaurant, fetchCategories, fetchMyReview, submitReview, createCategory, toggleSeitan } from '../lib/queries'
import { calcTotal } from '../lib/scoring'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { RatingSlider } from '../components/ui/RatingSlider'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { useAuth } from '../hooks/useAuth'

const EMOJIS = ['⭐','🔥','🌶️','🧅','🍋','🫚','❄️','🎯','🫀','💎']

export function ReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const nav = useNavigate()
  const { name } = useAuth()
  const qc = useQueryClient()

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => fetchRestaurant(restaurantId!),
    enabled: !!restaurantId,
  })
  const { data: allCats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
  const { data: existingReview } = useQuery({
    queryKey: ['my-review', restaurantId, name],
    queryFn: () => fetchMyReview(restaurantId!, name),
    enabled: !!restaurantId && !!name,
  })

  const allFilteredCats = allCats.filter(c => c.food_type === null || c.food_type === restaurant?.food_type)

  // Detect meat vs veg choice
  const hasMeat = allFilteredCats.some(c => c.name === 'Fleisch')
  const hasVeg  = allFilteredCats.some(c => c.name === 'Veg. Alternative')
  const needsChoice = hasMeat && hasVeg

  const [meatOrVeg, setMeatOrVeg] = useState<'fleisch' | 'veg' | null>(null)
  const [hadSeitan, setHadSeitan] = useState(false)

  const cats = needsChoice && meatOrVeg
    ? allFilteredCats.filter(c => {
        if (c.name === 'Fleisch') return meatOrVeg === 'fleisch'
        if (c.name === 'Veg. Alternative') return meatOrVeg === 'veg'
        return true
      })
    : allFilteredCats

  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split('T')[0])
  const [prefilled, setPrefilled] = useState(false)

  // Pre-fill from existing review
  useEffect(() => {
    if (existingReview && !prefilled) {
      setScores(existingReview.scores)
      setNotes(existingReview.notes ?? '')
      setVisitedAt(existingReview.visited_at ?? new Date().toISOString().split('T')[0])
      // Detect previous choice from scores
      const hadMeat = existingReview.scores && allFilteredCats.find(c => c.name === 'Fleisch') &&
        existingReview.scores[allFilteredCats.find(c => c.name === 'Fleisch')!.id] !== undefined
      const hadVeg = existingReview.scores && allFilteredCats.find(c => c.name === 'Veg. Alternative') &&
        existingReview.scores[allFilteredCats.find(c => c.name === 'Veg. Alternative')!.id] !== undefined
      if (hadMeat) setMeatOrVeg('fleisch')
      else if (hadVeg) {
        setMeatOrVeg('veg')
        setHadSeitan(restaurant?.has_seitan ?? false)
      }
      setPrefilled(true)
    }
  }, [existingReview, prefilled])

  const isEditing = !!existingReview

  // Quick add category
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('⭐')

  const addCatMut = useMutation({
    mutationFn: () => createCategory({
      name: newCatName.trim(),
      weight: 10,
      emoji: newCatEmoji,
      food_type: restaurant?.food_type ?? null,
      created_by: name,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setAddingCat(false)
      setNewCatName('')
      setNewCatEmoji('⭐')
    },
  })

  const totalScore = calcTotal(Object.fromEntries(cats.map(c => [c.id, scores[c.id] ?? 5])), cats)

  const mut = useMutation({
    mutationFn: async () => {
      await submitReview(restaurantId!, name, Object.fromEntries(cats.map(c => [c.id, scores[c.id] ?? 5])), cats, notes, visitedAt)
      if (meatOrVeg === 'veg') await toggleSeitan(restaurantId!, hadSeitan)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', restaurantId] })
      qc.invalidateQueries({ queryKey: ['my-review', restaurantId, name] })
      qc.invalidateQueries({ queryKey: ['all-reviews'] })
      qc.invalidateQueries({ queryKey: ['restaurants'] })
      nav(`/restaurant/${restaurantId}`)
    },
  })

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-[#9B9894] mb-4">
          <ChevronLeft /> Zurück
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C8302A] mb-0.5">
              {isEditing ? 'Bewertung bearbeiten' : 'Bewertung'}
            </p>
            <h1 className="font-serif text-2xl text-[#111110] leading-tight">{restaurant?.name ?? '…'}</h1>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={totalScore.toFixed(1)} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <ScoreBadge score={totalScore} size="lg" showLabel />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-4 space-y-5">
            <p className="text-xs font-semibold text-[#9B9894] uppercase tracking-wider">Kategorien</p>

            {/* Meat or veg picker */}
            {needsChoice && (
              <div className="space-y-1.5">
                <p className="text-xs text-[#9B9894]">Was hast du gegessen?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMeatOrVeg('fleisch')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${meatOrVeg === 'fleisch' ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#5C5B57] border-[#E8E6E0]'}`}
                  >
                    🥩 Fleisch
                  </button>
                  <button
                    onClick={() => setMeatOrVeg('veg')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${meatOrVeg === 'veg' ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#5C5B57] border-[#E8E6E0]'}`}
                  >
                    🌱 Veggie
                  </button>
                </div>

                {/* Seitan sub-toggle — only when veggie selected */}
                <AnimatePresence>
                  {meatOrVeg === 'veg' && (
                    <motion.button
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      type="button"
                      onClick={() => setHadSeitan(v => !v)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                        hadSeitan ? 'bg-[#0B2911]' : 'bg-[#F2F1ED]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        hadSeitan ? 'bg-[#17421E]' : 'bg-[#E5E3DE]'
                      }`}>
                        <LeafIcon className={hadSeitan ? 'text-emerald-400' : 'text-[#B8B5B0]'} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold text-sm transition-colors duration-300 ${hadSeitan ? 'text-white' : 'text-[#9B9894]'}`}>
                          War Seitan
                        </p>
                        <p className={`text-xs mt-0.5 transition-colors duration-300 ${hadSeitan ? 'text-emerald-400/70' : 'text-[#C0BDB8]'}`}>
                          {hadSeitan ? 'Seitan verfügbar ✓' : 'Tippen wenn es Seitan gab'}
                        </p>
                      </div>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        hadSeitan ? 'bg-emerald-500/20' : 'bg-black/8'
                      }`}>
                        {hadSeitan
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-[#9B9894]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        }
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}

            {(!needsChoice || meatOrVeg) && cats.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.05 }}>
                <RatingSlider label={cat.name} emoji={cat.emoji} value={scores[cat.id] ?? 5} onChange={v => setScores(p => ({ ...p, [cat.id]: v }))} />
              </motion.div>
            ))}

            <AnimatePresence>
              {addingCat ? (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3 pt-2 border-t border-[#E8E6E0]">
                  <p className="text-xs font-semibold text-[#9B9894] uppercase tracking-wider">Neue Kategorie</p>
                  <Input placeholder="Name (z.B. Knusprigkeit)" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setNewCatEmoji(e)}
                        className={`text-lg p-1.5 rounded-lg transition-all ${newCatEmoji === e ? 'bg-[#111110] text-white' : 'bg-[#F2F1ED]'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" className="flex-1" loading={addCatMut.isPending} disabled={!newCatName.trim()} onClick={() => addCatMut.mutate()}>
                      Hinzufügen
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAddingCat(false)}>Abbrechen</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setAddingCat(true)}
                  className="w-full text-sm text-[#9B9894] hover:text-[#C8302A] transition-colors text-left pt-1 border-t border-[#E8E6E0]"
                >
                  + Kategorie hinzufügen
                </motion.button>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9894]">Datum des Besuchs</span>
              <input type="date" value={visitedAt} max={new Date().toISOString().split('T')[0]} onChange={e => setVisitedAt(e.target.value)}
                className="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm text-[#111110] outline-none focus:border-[#C8302A] focus:ring-2 focus:ring-[#C8302A]/15 transition-all" />
            </label>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard className="p-4">
            <Textarea label="Anmerkungen (optional)" placeholder="Was war besonders? Tipps für andere?" rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
          </GlassCard>
        </motion.div>

        <Button variant="primary" size="lg" className="w-full" loading={mut.isPending} disabled={needsChoice && !meatOrVeg} onClick={() => mut.mutate()}>
          {isEditing ? 'Bewertung aktualisieren' : 'Bewertung speichern'}
        </Button>
        {mut.isError && <p className="text-sm text-[#C8302A] text-center">{(mut.error as Error).message}</p>}
      </div>
    </div>
  )
}

function ChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
function LeafIcon({ className }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
}
