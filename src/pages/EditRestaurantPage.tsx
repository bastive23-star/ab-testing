import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRestaurant, updateRestaurant, deleteRestaurant } from '../lib/queries'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

const FOOD_TYPES = ['Bánh Mì', 'Ramen', 'Pizza', 'Burger', 'Sushi', 'Döner', 'Tacos', 'Andere']

interface NominatimResult {
  lat: string; lon: string; display_name: string
  address: { road?: string; house_number?: string; suburb?: string; neighbourhood?: string; city_district?: string }
}

async function searchNominatim(q: string): Promise<NominatimResult[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=de`,
    { headers: { 'Accept-Language': 'de', 'User-Agent': 'ab-testing-app' } },
  )
  return res.json()
}
function formatStreet(a: NominatimResult['address']) { return [a.road, a.house_number].filter(Boolean).join(' ') }
function formatNeighborhood(a: NominatimResult['address']) { return a.suburb ?? a.neighbourhood ?? a.city_district ?? '' }

export function EditRestaurantPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const qc = useQueryClient()

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => fetchRestaurant(id!),
    enabled: !!id,
  })

  const [form, setForm] = useState({ name: '', address: '', neighborhood: '', google_maps_url: '', website: '' })
  const [foodType, setFoodType] = useState('Bánh Mì')
  const [customType, setCustomType] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [prefilled, setPrefilled] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [addrSuggestions, setAddrSuggestions] = useState<NominatimResult[]>([])
  const [showAddrSug, setShowAddrSug] = useState(false)
  const addrDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (restaurant && !prefilled) {
      const knownType = FOOD_TYPES.includes(restaurant.food_type)
      setForm({
        name: restaurant.name,
        address: restaurant.address ?? '',
        neighborhood: restaurant.neighborhood ?? '',
        google_maps_url: restaurant.google_maps_url ?? '',
        website: restaurant.website ?? '',
      })
      setFoodType(knownType ? restaurant.food_type : 'Andere')
      if (!knownType) setCustomType(restaurant.food_type)
      if (restaurant.lat && restaurant.lng) setCoords({ lat: restaurant.lat, lng: restaurant.lng })
      setPrefilled(true)
    }
  }, [restaurant, prefilled])

  useEffect(() => {
    const q = form.address.trim()
    if (q.length < 4) { setAddrSuggestions([]); return }
    if (addrDebounce.current) clearTimeout(addrDebounce.current)
    addrDebounce.current = setTimeout(async () => {
      try {
        const data = await searchNominatim(q + ' München')
        setAddrSuggestions(data); setShowAddrSug(data.length > 0)
      } catch { setAddrSuggestions([]) }
    }, 400)
    return () => { if (addrDebounce.current) clearTimeout(addrDebounce.current) }
  }, [form.address])

  function applyAddr(s: NominatimResult) {
    const a = s.address
    const street = formatStreet(a)
    const address = street ? `${street}, München` : s.display_name.split(',').slice(0, 2).join(',').trim()
    const lat = parseFloat(s.lat); const lng = parseFloat(s.lon)
    setForm(p => ({ ...p, address, neighborhood: p.neighborhood || formatNeighborhood(a), google_maps_url: p.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` }))
    setCoords({ lat, lng }); setAddrSuggestions([]); setShowAddrSug(false)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      let lat = coords?.lat ?? null; let lng = coords?.lng ?? null
      if (!lat && form.address.trim()) {
        try { const d = await searchNominatim(form.address.trim()); if (d[0]) { lat = parseFloat(d[0].lat); lng = parseFloat(d[0].lon) } } catch { /* skip */ }
      }
      return updateRestaurant(id!, {
        name: form.name.trim(),
        food_type: foodType === 'Andere' ? customType.trim() || 'Andere' : foodType,
        address: form.address.trim(), neighborhood: form.neighborhood.trim(),
        lat, lng,
        google_maps_url: form.google_maps_url || null,
        website: form.website || null,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurant', id] }); qc.invalidateQueries({ queryKey: ['restaurants'] }); nav(`/restaurant/${id}`) },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteRestaurant(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurants'] }); nav('/') },
  })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [k]: e.target.value }))
      if (k === 'address') setCoords(null)
    }
  }

  if (isLoading) return <div className="px-4 pt-12 text-sm text-[#9B9894]">Lädt…</div>

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-[#9B9894] mb-6"><ChevronLeft /> Zurück</button>
        <h1 className="font-serif text-3xl text-[#111110] mb-6">Restaurant<br />bearbeiten</h1>
      </motion.div>

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard className="p-4 space-y-3">
            <p className="text-xs font-semibold text-[#9B9894] uppercase tracking-wider">Kategorie</p>
            <div className="flex flex-wrap gap-2">
              {FOOD_TYPES.map(t => (
                <button key={t} onClick={() => setFoodType(t)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                    foodType === t ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#5C5B57] border-[#E8E6E0] hover:border-[#C8C6C0]')}>
                  {t}
                </button>
              ))}
            </div>
            {foodType === 'Andere' && <Input placeholder="z.B. Pho, Falafel…" value={customType} onChange={e => setCustomType(e.target.value)} />}
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-4 space-y-4">
            <Input label="Name des Restaurants *" value={form.name} onChange={set('name')} required />
            <div className="relative">
              <Input label="Adresse" value={form.address} onChange={set('address')}
                onFocus={() => addrSuggestions.length > 0 && setShowAddrSug(true)}
                onBlur={() => setTimeout(() => setShowAddrSug(false), 150)} />
              <AnimatePresence>
                {showAddrSug && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-lg">
                    {addrSuggestions.map((s, i) => (
                      <button key={i} onMouseDown={() => applyAddr(s)}
                        className="w-full text-left px-4 py-3 hover:bg-[#F9F8F5] transition-colors border-b border-[#F0EEE8] last:border-0">
                        <p className="text-sm font-medium text-[#111110] truncate">{formatStreet(s.address) || s.display_name.split(',')[0]}</p>
                        {formatNeighborhood(s.address) && <p className="text-xs text-[#9B9894] mt-0.5">{formatNeighborhood(s.address)}</p>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Input label="Viertel" value={form.neighborhood} onChange={set('neighborhood')} />
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard className="p-4 space-y-4">
            <Input label="Google Maps Link" type="url" value={form.google_maps_url} onChange={set('google_maps_url')} />
            <Input label="Website" type="url" value={form.website} onChange={set('website')} />
          </GlassCard>
        </motion.div>

        <Button variant="primary" size="lg" className="w-full" loading={saveMut.isPending} disabled={!form.name} onClick={() => saveMut.mutate()}>
          Änderungen speichern
        </Button>

        {/* Delete */}
        <div className="pt-2">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="w-full text-sm text-[#9B9894] hover:text-[#C8302A] transition-colors py-2">
              Restaurant löschen
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <p className="text-sm text-center text-[#6B6560]">Wirklich löschen? Das kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-2">
                <Button variant="danger" size="md" className="flex-1" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
                  Ja, löschen
                </Button>
                <Button variant="ghost" size="md" onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
              </div>
            </motion.div>
          )}
        </div>

        {(saveMut.isError || deleteMut.isError) && (
          <p className="text-sm text-[#C8302A] text-center">{((saveMut.error || deleteMut.error) as Error).message}</p>
        )}
      </div>
    </div>
  )
}

function ChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
