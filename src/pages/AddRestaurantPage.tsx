import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRestaurant, uploadPhoto } from '../lib/queries'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export function AddRestaurantPage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', address: '', neighborhood: '',
    lat: '', lng: '', google_maps_url: '', website: '',
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Nicht eingeloggt')
      let cover_photo_url: string | null = null
      if (coverFile) {
        setUploading(true)
        cover_photo_url = await uploadPhoto(coverFile, 'restaurant-photos')
        setUploading(false)
      }
      return createRestaurant({
        name: form.name.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim(),
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        google_maps_url: form.google_maps_url || null,
        website: form.website || null,
        cover_photo_url,
        created_by: user.id,
      })
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['restaurants'] })
      nav(`/restaurant/${r.id}`)
    },
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
  }

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  }

  if (!user) {
    return (
      <div className="px-4 pt-24 text-center">
        <p className="text-[#6B6560]">Bitte zuerst einloggen.</p>
        <Button variant="primary" className="mt-4 mx-auto" onClick={() => nav('/auth')}>
          Einloggen
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-[#9E9791] mb-6">
          <ChevronLeft /> Zurück
        </button>
        <h1 className="font-serif text-3xl text-[#1A1714] mb-6">Restaurant<br />hinzufügen</h1>
      </motion.div>

      <div className="space-y-4">
        {/* Cover Photo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <GlassCard className="overflow-hidden">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full relative"
              aria-label="Foto auswählen"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-48 object-cover" />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-[#9E9791]">
                  <span className="text-4xl">📸</span>
                  <span className="text-sm font-medium">Titelbild hinzufügen</span>
                  <span className="text-xs">Tippe zum Auswählen</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </GlassCard>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard className="p-4 space-y-4">
            <Input label="Name des Restaurants *" placeholder="z.B. Bánh Mì Saigon" value={form.name} onChange={set('name')} required />
            <Input label="Adresse *" placeholder="z.B. Sendlinger Str. 1, München" value={form.address} onChange={set('address')} required />
            <Input label="Viertel" placeholder="z.B. Altstadt, Schwabing…" value={form.neighborhood} onChange={set('neighborhood')} />
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-4 space-y-4">
            <p className="text-xs font-semibold text-[#9E9791] uppercase tracking-wider">Koordinaten (für Karte)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Breitengrad" placeholder="48.1351" type="number" step="any" value={form.lat} onChange={set('lat')} />
              <Input label="Längengrad" placeholder="11.5820" type="number" step="any" value={form.lng} onChange={set('lng')} />
            </div>
            <p className="text-xs text-[#9E9791]">Koordinaten findest du z.B. bei Google Maps per Rechtsklick.</p>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard className="p-4 space-y-4">
            <Input label="Google Maps Link" placeholder="https://maps.google.com/…" type="url" value={form.google_maps_url} onChange={set('google_maps_url')} />
            <Input label="Website" placeholder="https://…" type="url" value={form.website} onChange={set('website')} />
          </GlassCard>
        </motion.div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={mut.isPending || uploading}
          disabled={!form.name || !form.address}
          onClick={() => mut.mutate()}
        >
          Restaurant speichern
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
