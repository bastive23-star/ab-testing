import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRestaurant } from '../lib/queries'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/utils'

const FOOD_TYPES = ['Bánh Mì', 'Ramen', 'Pizza', 'Burger', 'Sushi', 'Döner', 'Tacos', 'Andere']

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    house_number?: string
    suburb?: string
    neighbourhood?: string
    city_district?: string
    postcode?: string
    city?: string
  }
}

export function AddRestaurantPage() {
  const nav = useNavigate()
  const { name } = useAuth()
  const qc = useQueryClient()

  const [form, setForm] = useState({ name: '', address: '', neighborhood: '', google_maps_url: '', website: '' })
  const [foodType, setFoodType] = useState('Bánh Mì')
  const [customType, setCustomType] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const q = form.name.trim()
    if (q.length < 3) { setSuggestions([]); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' München')}&format=json&limit=5&addressdetails=1&countrycodes=de`,
          { headers: { 'Accept-Language': 'de', 'User-Agent': 'ab-testing-app' } },
        )
        const data: NominatimResult[] = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch { setSuggestions([]) }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [form.name])

  function pickSuggestion(s: NominatimResult) {
    const a = s.address
    const street = [a.road, a.house_number].filter(Boolean).join(' ')
    const address = street ? `${street}, München` : s.display_name.split(',').slice(0, 2).join(',').trim()
    const neighborhood = a.suburb ?? a.neighbourhood ?? a.city_district ?? ''
    const lat = parseFloat(s.lat)
    const lng = parseFloat(s.lon)
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    setForm(p => ({ ...p, address, neighborhood, google_maps_url: p.google_maps_url || mapsUrl }))
    setCoords({ lat, lng })
    setSuggestions([])
    setShowSuggestions(false)
  }

  const mut = useMutation({
    mutationFn: async () => {
      let lat = coords?.lat ?? null
      let lng = coords?.lng ?? null
      if (!lat && form.address.trim()) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address.trim())}&format=json&limit=1`, {
            headers: { 'Accept-Language': 'de', 'User-Agent': 'ab-testing-app' },
          })
          const data = await res.json()
          if (data[0]) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon) }
        } catch { /* map bleibt leer */ }
      }
      return createRestaurant({
        name: form.name.trim(),
        food_type: foodType === 'Andere' ? customType.trim() || 'Andere' : foodType,
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim(),
        lat, lng,
        google_maps_url: form.google_maps_url || null,
        website: form.website || null,
        cover_photo_url: null,
        created_by: name,
      })
    },
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['restaurants'] }); nav(`/restaurant/${r.id}`) },
  })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [k]: e.target.value }))
      if (k === 'address') setCoords(null)
    }
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-[#9E9791] mb-6"><ChevronLeft /> Zurück</button>
        <h1 className="font-serif text-3xl text-[#1A1714] mb-6">Restaurant<br />hinzufügen</h1>
      </motion.div>

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard className="p-4 space-y-3">
            <p className="text-xs font-semibold text-[#9E9791] uppercase tracking-wider">Kategorie</p>
            <div className="flex flex-wrap gap-2">
              {FOOD_TYPES.map(t => (
                <button key={t} onClick={() => setFoodType(t)}
                  className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition-all', foodType === t ? 'bg-[#C8302A] text-white' : 'glass-subtle text-[#6B6560]')}>
                  {t}
                </button>
              ))}
            </div>
            {foodType === 'Andere' && (
              <Input placeholder="z.B. Pho, Falafel…" value={customType} onChange={e => setCustomType(e.target.value)} />
            )}
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-4 space-y-4">
            {/* Name + Autocomplete */}
            <div className="relative">
              <Input
                label="Name des Restaurants *"
                placeholder="z.B. Bánh Mì Saigon"
                value={form.name}
                onChange={set('name')}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                required
              />
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 glass-strong rounded-[16px] overflow-hidden shadow-lg"
                  >
                    {suggestions.map((s, i) => {
                      const a = s.address
                      const street = [a.road, a.house_number].filter(Boolean).join(' ')
                      const sub = a.suburb ?? a.neighbourhood ?? a.city_district ?? ''
                      return (
                        <button
                          key={i}
                          onMouseDown={() => pickSuggestion(s)}
                          className="w-full text-left px-4 py-3 hover:bg-black/5 transition-colors border-b border-black/6 last:border-0"
                        >
                          <p className="text-sm font-medium text-[#1A1714] truncate">{street || s.display_name.split(',')[0]}</p>
                          {sub && <p className="text-xs text-[#9E9791] mt-0.5">{sub}</p>}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Input label="Adresse *" placeholder="z.B. Sendlinger Str. 1, München" value={form.address} onChange={set('address')} required />
            <Input label="Viertel" placeholder="z.B. Altstadt, Schwabing…" value={form.neighborhood} onChange={set('neighborhood')} />
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard className="p-4 space-y-4">
            <Input label="Google Maps Link" placeholder="https://maps.google.com/…" type="url" value={form.google_maps_url} onChange={set('google_maps_url')} />
            <Input label="Website" placeholder="https://…" type="url" value={form.website} onChange={set('website')} />
          </GlassCard>
        </motion.div>

        <Button variant="primary" size="lg" className="w-full" loading={mut.isPending} disabled={!form.name || !form.address} onClick={() => mut.mutate()}>
          Restaurant speichern
        </Button>
        {mut.isError && <p className="text-sm text-red-500 text-center">{(mut.error as Error).message}</p>}
      </div>
    </div>
  )
}

function ChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
