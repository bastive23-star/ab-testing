import { useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import L from 'leaflet'
import { fetchRestaurantsWithStats } from '../lib/queries'
import { scoreColor, scoreLabel } from '../lib/scoring'
import { cn } from '../lib/utils'
import type { RestaurantWithStats } from '../types'

const SHEET_OPEN = 340
const SHEET_PEEK = 44

function createMarkerIcon(score: number, name: string, highlighted = false) {
  const color = scoreColor(score)
  const label = name.length > 18 ? name.slice(0, 17) + '…' : name
  const size = highlighted ? 48 : 40
  const r = highlighted ? 14 : 11
  const fontSize = highlighted ? 10.5 : 9.5
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.2}" viewBox="0 0 40 48">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="${highlighted ? 6 : 4}" flood-color="rgba(0,0,0,${highlighted ? 0.35 : 0.22})"/>
        </filter>
      </defs>
      <path d="M20 2C11.163 2 4 9.163 4 18c0 10.5 16 28 16 28S36 28.5 36 18C36 9.163 28.837 2 20 2z"
        fill="${color}" filter="url(#s)" stroke="${highlighted ? 'white' : 'none'}" stroke-width="${highlighted ? 1.5 : 0}"/>
      <circle cx="20" cy="18" r="${r}" fill="white"/>
      <text x="20" y="22" text-anchor="middle" font-size="${fontSize}" font-weight="700"
        font-family="Inter,sans-serif" fill="${color}">${score > 0 ? score.toFixed(1) : '—'}</text>
    </svg>
    <div style="position:absolute;top:${size * 1.2 + 4}px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#FFFFFF;border-radius:6px;padding:3px 8px;font-size:10.5px;font-weight:600;color:#111110;box-shadow:0 2px 8px rgba(0,0,0,0.14);letter-spacing:-0.01em">${label}</div>
  `
  return L.divIcon({
    html: `<div style="position:relative">${svg}</div>`,
    className: '',
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size * 1.2 - 8],
  })
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  if (target) map.flyTo(target, 16, { duration: 0.8 })
  return null
}

export function MapPage() {
  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurantsWithStats,
  })

  const withCoords = restaurants.filter(r => r.lat && r.lng)
  const center: [number, number] = [48.1351, 11.582]

  const [foodFilter, setFoodFilter] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  const foodTypes = [...new Set(restaurants.map(r => r.food_type))].sort()

  const filtered = foodFilter
    ? withCoords.filter(r => r.food_type === foodFilter)
    : withCoords

  const sorted = [...filtered].sort((a, b) => b.avg_score - a.avg_score)

  // Bottom sheet drag
  const y = useMotionValue(0)
  const [isOpen, setIsOpen] = useState(true)
  const sheetRef = useRef<HTMLDivElement>(null)

  const snapTo = useCallback((open: boolean) => {
    setIsOpen(open)
    animate(y, open ? 0 : SHEET_OPEN - SHEET_PEEK, { type: 'spring', stiffness: 400, damping: 40 })
  }, [y])

  const handleDragEnd = useCallback(() => {
    const currentY = y.get()
    snapTo(currentY < (SHEET_OPEN - SHEET_PEEK) / 2)
  }, [y, snapTo])

  const handleBarOpacity = useTransform(y, [0, SHEET_OPEN - SHEET_PEEK], [0.3, 1])

  function selectRestaurant(r: RestaurantWithStats) {
    setHighlighted(r.id)
    setFlyTarget([r.lat!, r.lng!])
    snapTo(false)
  }

  return (
    <div className="relative" style={{ height: '100dvh', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100dvh' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <FlyTo target={flyTarget} />
        {filtered.map(r => (
          <Marker
            key={r.id}
            position={[r.lat!, r.lng!]}
            icon={createMarkerIcon(r.avg_score, r.name, highlighted === r.id)}
            eventHandlers={{ click: () => { setHighlighted(r.id); setFlyTarget(null) } }}
          >
            <Popup className="clean-popup">
              <Link to={`/restaurant/${r.id}`} className="block no-underline">
                <div className="flex items-center gap-3" style={{ minWidth: 200, padding: '4px 0' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#F0EEE8' }}>
                    {r.cover_photo_url
                      ? <img src={r.cover_photo_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥖</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#111110', lineHeight: 1.3, margin: 0 }}>{r.name}</p>
                    {r.neighborhood && <p style={{ fontSize: 11, color: '#9B9894', margin: '2px 0 0' }}>{r.neighborhood}</p>}
                    <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 0 0', color: scoreColor(r.avg_score) }}>
                      {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'} <span style={{ fontWeight: 400, color: '#9B9894' }}>{r.avg_score > 0 ? `— ${scoreLabel(r.avg_score)}` : 'Noch keine Bewertung'}</span>
                    </p>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: SHEET_OPEN - SHEET_PEEK }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        style={{ y, height: SHEET_OPEN }}
        className="absolute bottom-[112px] left-0 right-0 z-[1000] bg-white rounded-t-[24px] shadow-[0_-8px_40px_rgba(0,0,0,0.14)] flex flex-col touch-none"
      >
        {/* Handle + Filter row */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <motion.div style={{ opacity: handleBarOpacity }} className="w-10 h-1 rounded-full bg-[#D5D3CE] mx-auto mb-3" />

          {/* Filters */}
          {foodTypes.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              {[null, ...foodTypes].map(t => (
                <button
                  key={t ?? 'alle'}
                  onClick={() => setFoodFilter(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all shrink-0',
                    foodFilter === t
                      ? 'bg-[#111110] text-white'
                      : 'bg-[#F2F1ED] text-[#6B6560] hover:bg-[#E8E6E0]'
                  )}
                >
                  {t ?? 'Alle'}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] font-semibold text-[#9B9894] uppercase tracking-wider">
              {sorted.length} {sorted.length === 1 ? 'Restaurant' : 'Restaurants'}
            </p>
            <button
              onClick={() => snapTo(!isOpen)}
              className="text-[11px] font-semibold text-[#C8302A] py-1"
            >
              {isOpen ? 'Karte vollbild' : 'Liste öffnen'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 touch-pan-y" onPointerDown={e => e.stopPropagation()}>
          {sorted.map((r, i) => (
            <button
              key={r.id}
              onClick={() => selectRestaurant(r)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#F2F1ED] last:border-0',
                highlighted === r.id ? 'bg-[#FFF8F7]' : 'hover:bg-[#F9F8F5]'
              )}
            >
              {/* Rank */}
              <span className="font-serif text-2xl text-[#E8E6E0] tabular-nums w-8 shrink-0 text-right leading-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#9B9894] mb-0.5">{r.food_type}</p>
                <p className="font-serif text-[16px] leading-tight text-[#111110] truncate">{r.name}</p>
                {r.neighborhood && <p className="text-[11px] text-[#9B9894] mt-0.5 truncate">{r.neighborhood}</p>}
              </div>
              {/* Score */}
              <div className="shrink-0 text-right">
                <span
                  className="font-serif text-2xl leading-none tabular-nums"
                  style={{ color: r.avg_score > 0 ? scoreColor(r.avg_score) : '#D5D3CE' }}
                >
                  {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'}
                </span>
                {highlighted === r.id && (
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#C8302A] mt-0.5">Pin aktiv</p>
                )}
              </div>
            </button>
          ))}
          {sorted.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-[#9B9894]">Keine Restaurants mit Koordinaten</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
