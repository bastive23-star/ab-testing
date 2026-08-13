import { useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { motion, useDragControls, useMotionValue, animate } from 'framer-motion'
import L from 'leaflet'
import { fetchRestaurantsWithStats } from '../lib/queries'
import { scoreColor, scoreLabel } from '../lib/scoring'
import { cn } from '../lib/utils'
import type { RestaurantWithStats } from '../types'

// How much of the sheet is visible when collapsed (handle only)
const PEEK = 52
// Full open height — sheet sits above nav (76px) and shows most of the screen
const OPEN = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.62) : 480
// Nav bar height offset
const NAV = 112

function createMarkerIcon(score: number, highlighted = false) {
  const color = highlighted ? '#C8302A' : scoreColor(score)
  const size = highlighted ? 52 : 40
  const innerR = highlighted ? 15 : 11
  const fontSize = highlighted ? 11 : 9.5
  const shadow = highlighted
    ? 'rgba(200,48,42,0.45)'
    : 'rgba(0,0,0,0.22)'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.22)}" viewBox="0 0 52 64">
    <defs>
      <filter id="sh" x="-50%" y="-30%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="${highlighted ? 7 : 4}" flood-color="${shadow}"/>
      </filter>
    </defs>
    <path d="M26 3C15.507 3 7 11.507 7 22c0 13 19 39 19 39S45 35 45 22C45 11.507 36.493 3 26 3z"
      fill="${color}" filter="url(#sh)" ${highlighted ? 'stroke="white" stroke-width="2"' : ''}/>
    <circle cx="26" cy="22" r="${innerR}" fill="white"/>
    <text x="26" y="26.5" text-anchor="middle" font-size="${fontSize}" font-weight="700"
      font-family="Inter,system-ui,sans-serif" fill="${color}">${score > 0 ? score.toFixed(1) : '–'}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, Math.round(size * 1.22)],
    iconAnchor: [size / 2, Math.round(size * 1.22)],
    popupAnchor: [0, -Math.round(size * 1.22) - 4],
  })
}

function FlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  if (coords) map.flyTo(coords, 16, { duration: 0.75, easeLinearity: 0.5 })
  return null
}

export function MapPage() {
  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurantsWithStats,
  })

  const withCoords = restaurants.filter(r => r.lat && r.lng)
  const foodTypes = [...new Set(restaurants.map(r => r.food_type))].sort()

  const [foodFilter, setFoodFilter] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [flyCoords, setFlyCoords] = useState<[number, number] | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  const filtered = foodFilter ? withCoords.filter(r => r.food_type === foodFilter) : withCoords
  const sorted = [...filtered].sort((a, b) => b.avg_score - a.avg_score)

  // Drag — only from the handle bar
  const dragControls = useDragControls()
  const y = useMotionValue(0)

  const snapTo = useCallback((open: boolean) => {
    setIsOpen(open)
    animate(y, open ? 0 : OPEN - PEEK, { type: 'spring', stiffness: 380, damping: 38 })
  }, [y])

  const handleDragEnd = useCallback(() => {
    snapTo(y.get() < (OPEN - PEEK) / 2)
  }, [y, snapTo])

  // Scroll → highlight nearest pin (no fly)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLElement | null>>({})

  const handleScroll = useCallback(() => {
    const container = listRef.current
    if (!container) return
    const top = container.getBoundingClientRect().top + 56
    let nearest: string | null = null
    let minDist = Infinity
    for (const r of sorted) {
      const el = itemRefs.current[r.id]
      if (!el) continue
      const dist = Math.abs(el.getBoundingClientRect().top - top)
      if (dist < minDist) { minDist = dist; nearest = r.id }
    }
    if (nearest && nearest !== highlighted) setHighlighted(nearest)
  }, [sorted, highlighted])

  function selectRestaurant(r: RestaurantWithStats) {
    setHighlighted(r.id)
    if (r.lat && r.lng) setFlyCoords([r.lat, r.lng])
    snapTo(false)
  }

  return (
    <div className="relative" style={{ height: '100dvh' }}>
      {/* Map isolated in its own stacking context (z:0) so sheet can sit above it */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <MapContainer
        center={[48.1351, 11.582]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <FlyTo coords={flyCoords} />
        {filtered.map(r => (
          <Marker
            key={r.id}
            position={[r.lat!, r.lng!]}
            icon={createMarkerIcon(r.avg_score, highlighted === r.id)}
            eventHandlers={{
              click: () => {
                setHighlighted(r.id)
                setFlyCoords(null)
                snapTo(false)
              },
            }}
          >
            <Popup className="clean-popup">
              <Link to={`/restaurant/${r.id}`} className="block no-underline">
                <div style={{ minWidth: 196, padding: '2px 0' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111110', margin: '0 0 2px', lineHeight: 1.3 }}>{r.name}</p>
                  {r.neighborhood && <p style={{ fontSize: 11, color: '#9B9894', margin: '0 0 6px' }}>{r.neighborhood}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: r.avg_score > 0 ? scoreColor(r.avg_score) : '#D5D3CE', fontFamily: 'Georgia,serif' }}>
                      {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'}
                    </span>
                    {r.avg_score > 0 && <span style={{ fontSize: 11, color: '#9B9894' }}>{scoreLabel(r.avg_score)}</span>}
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      </div>

      {/* Bottom Sheet — absolute, z-45 so nav (z-50) stays on top */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: OPEN - PEEK }}
        dragElastic={0.06}
        onDragEnd={handleDragEnd}
        style={{
          y,
          height: OPEN,
          bottom: NAV,
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 45,
          borderRadius: '20px 20px 0 0',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.10), 0 -1px 0 rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle area — drag initiates here */}
        <div
          className="shrink-0 cursor-grab active:cursor-grabbing select-none"
          onPointerDown={e => dragControls.start(e)}
          style={{ padding: '14px 16px 0' }}
        >
          <div className="w-9 h-[3px] rounded-full bg-[#D5D3CE] mx-auto mb-4" />

          {/* Food type filters — always shown */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {[null, ...foodTypes].map(t => (
              <button
                key={t ?? 'alle'}
                onClick={() => setFoodFilter(t)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all shrink-0',
                  foodFilter === t
                    ? 'bg-[#111110] text-white'
                    : 'bg-[#F2F1ED] text-[#6B6560]'
                )}
              >
                {t ?? 'Alle'}
              </button>
            ))}
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-3 mb-1">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#B0ADA8]">
              {sorted.length} {sorted.length === 1 ? 'Restaurant' : 'Restaurants'}
            </p>
            <button
              onClick={() => snapTo(!isOpen)}
              className="text-[11px] font-semibold text-[#C8302A] py-0.5"
            >
              {isOpen ? 'Karte vollbild' : 'Liste öffnen'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#F0EEE8] shrink-0" />

        {/* Scrollable list — no drag interference */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}
        >
          {sorted.map((r, i) => {
            const active = highlighted === r.id
            return (
              <button
                key={r.id}
                ref={el => { itemRefs.current[r.id] = el }}
                onClick={() => selectRestaurant(r)}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 text-left border-b border-[#F4F3F0] last:border-0 transition-colors duration-150',
                  active ? 'bg-[#FFF6F5]' : 'active:bg-[#F9F8F5]'
                )}
              >
                {/* Rank */}
                <span
                  className="font-serif tabular-nums shrink-0 leading-none"
                  style={{ fontSize: 26, color: active ? '#E8C8C6' : '#ECEAE4', width: 36, textAlign: 'right' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#B0ADA8] mb-0.5">{r.food_type}</p>
                  <p className={cn('font-serif text-[17px] leading-snug truncate transition-colors', active ? 'text-[#C8302A]' : 'text-[#111110]')}>
                    {r.name}
                  </p>
                  {r.neighborhood && (
                    <p className="text-[11px] text-[#9B9894] mt-0.5 truncate">{r.neighborhood}</p>
                  )}
                </div>

                {/* Score */}
                <div className="shrink-0 text-right">
                  <span
                    className="font-serif leading-none tabular-nums"
                    style={{ fontSize: 26, color: r.avg_score > 0 ? scoreColor(r.avg_score) : '#D5D3CE' }}
                  >
                    {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'}
                  </span>
                  {active && r.lat && r.lng && (
                    <p className="text-[8px] font-bold uppercase tracking-wider text-[#C8302A] mt-0.5">aktiv</p>
                  )}
                </div>
              </button>
            )
          })}

          {sorted.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-serif text-4xl text-[#ECEAE4] mb-2">—</p>
              <p className="text-sm text-[#9B9894]">Keine Restaurants mit Koordinaten</p>
            </div>
          )}

          {/* Bottom padding so last item clears above safe area */}
          <div style={{ height: 20 }} />
        </div>
      </motion.div>
    </div>
  )
}
