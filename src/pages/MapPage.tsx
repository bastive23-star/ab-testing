import { useRef, useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import { fetchRestaurantsWithStats } from '../lib/queries'
import { scoreColor, scoreLabel } from '../lib/scoring'
import { cn } from '../lib/utils'
import type { RestaurantWithStats } from '../types'

// Nav height (pill + margins + safe area)
const NAV_H = 112

function createMarkerIcon(score: number, highlighted = false) {
  const color = highlighted ? '#C8302A' : scoreColor(score)
  const size = highlighted ? 48 : 38
  const r = highlighted ? 14 : 10
  const fs = highlighted ? 10.5 : 9
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 48 58">
    <defs><filter id="s" x="-50%" y="-30%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="${highlighted ? 6 : 3}" flood-color="${highlighted ? 'rgba(200,48,42,0.4)' : 'rgba(0,0,0,0.2)'}"/>
    </filter></defs>
    <path d="M24 2C13.507 2 5 10.507 5 21c0 12.5 19 35 19 35S43 33.5 43 21C43 10.507 34.493 2 24 2z"
      fill="${color}" filter="url(#s)"${highlighted ? ' stroke="white" stroke-width="1.5"' : ''}/>
    <circle cx="24" cy="21" r="${r}" fill="white"/>
    <text x="24" y="25" text-anchor="middle" font-size="${fs}" font-weight="700"
      font-family="Inter,system-ui,sans-serif" fill="${color}">${score > 0 ? score.toFixed(1) : '–'}</text>
  </svg>`
  return L.divIcon({
    html: svg, className: '',
    iconSize: [size, Math.round(size * 1.2)],
    iconAnchor: [size / 2, Math.round(size * 1.2)],
    popupAnchor: [0, -Math.round(size * 1.2) - 4],
  })
}

// Tells Leaflet to recalculate its size after the container resizes
function MapResizer({ trigger }: { trigger: unknown }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(t)
  }, [trigger, map])
  return null
}

function MapController({ flyCoords, panCoords }: {
  flyCoords: [number, number] | null
  panCoords: [number, number] | null
}) {
  const map = useMap()
  useEffect(() => {
    if (flyCoords) map.flyTo(flyCoords, 16, { duration: 0.7, animate: true })
  }, [flyCoords]) // eslint-disable-line
  useEffect(() => {
    if (panCoords) map.setView(panCoords, map.getZoom(), { animate: true, duration: 0.4 })
  }, [panCoords]) // eslint-disable-line
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
  const [panCoords, setPanCoords] = useState<[number, number] | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  // Pixel heights computed once from viewport
  const [heights, setHeights] = useState({ map: 0, total: 0 })
  useEffect(() => {
    const total = window.innerHeight - NAV_H
    setHeights({ map: Math.round(total * 0.42), total })
  }, [])

  const filtered = foodFilter ? withCoords.filter(r => r.food_type === foodFilter) : withCoords
  const sorted = [...filtered].sort((a, b) => b.avg_score - a.avg_score)

  // Scroll → debounced panTo
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLElement | null>>({})
  const panTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const refY = el.getBoundingClientRect().top + 48
    let nearest: string | null = null, minD = Infinity
    for (const r of sorted) {
      const ref = itemRefs.current[r.id]
      if (!ref) continue
      const d = Math.abs(ref.getBoundingClientRect().top - refY)
      if (d < minD) { minD = d; nearest = r.id }
    }
    if (!nearest || nearest === highlighted) return
    setHighlighted(nearest)
    if (panTimer.current) clearTimeout(panTimer.current)
    panTimer.current = setTimeout(() => {
      const r = sorted.find(r => r.id === nearest)
      if (r?.lat && r?.lng) setPanCoords([r.lat, r.lng])
    }, 220)
  }, [sorted, highlighted])

  function tap(r: RestaurantWithStats) {
    setHighlighted(r.id)
    if (r.lat && r.lng) { setFlyCoords([r.lat, r.lng]); setPanCoords(null) }
  }

  const mapPx = fullscreen ? heights.total : heights.map
  const listPx = heights.total - heights.map

  // Don't render until we have real pixel values
  if (heights.total === 0) return null

  return (
    // Full-page fixed container — sits below nav (z-50)
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Map ─────────────────────────────────────────── */}
      <motion.div
        animate={{ height: mapPx }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        style={{ position: 'relative', flexShrink: 0, overflow: 'hidden' }}
      >
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
          <MapResizer trigger={mapPx} />
          <MapController flyCoords={flyCoords} panCoords={panCoords} />
          {filtered.map(r => (
            <Marker
              key={r.id}
              position={[r.lat!, r.lng!]}
              icon={createMarkerIcon(r.avg_score, highlighted === r.id)}
              eventHandlers={{ click: () => tap(r) }}
            >
              <Popup className="clean-popup">
                <Link to={`/restaurant/${r.id}`} className="block no-underline">
                  <div style={{ minWidth: 188, padding: '2px 0' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#111110', margin: '0 0 2px', lineHeight: 1.3 }}>{r.name}</p>
                    {r.neighborhood && <p style={{ fontSize: 11, color: '#9B9894', margin: '0 0 5px' }}>{r.neighborhood}</p>}
                    <span style={{ fontSize: 17, fontWeight: 700, color: r.avg_score > 0 ? scoreColor(r.avg_score) : '#D5D3CE', fontFamily: 'Georgia,serif' }}>
                      {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'}
                    </span>
                    {r.avg_score > 0 && <span style={{ fontSize: 11, color: '#9B9894', marginLeft: 6 }}>{scoreLabel(r.avg_score)}</span>}
                  </div>
                </Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen(v => !v)}
          style={{ position: 'absolute', top: 14, right: 14, zIndex: 10 }}
          className="bg-white/90 backdrop-blur-sm border border-[#E8E6E0] shadow-md rounded-xl px-3 py-2 flex items-center gap-1.5"
        >
          {fullscreen ? <ListIcon /> : <ExpandIcon />}
          <span className="text-[11px] font-semibold text-[#6B6560]">{fullscreen ? 'Liste' : 'Vollbild'}</span>
        </button>

        {/* Floating filters in fullscreen mode */}
        <AnimatePresence>
          {fullscreen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ position: 'absolute', top: 14, left: 14, right: 88, zIndex: 10 }}
              className="flex gap-1.5 overflow-x-auto no-scrollbar"
            >
              {[null, ...foodTypes].map(t => (
                <button key={t ?? 'alle'} onClick={() => setFoodFilter(t)}
                  className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 shadow-sm backdrop-blur-sm border transition-all',
                    foodFilter === t ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white/90 text-[#6B6560] border-[#E8E6E0]')}>
                  {t ?? 'Alle'}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── List ────────────────────────────────────────── */}
      <motion.div
        animate={{ height: fullscreen ? 0 : listPx }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        style={{ overflow: 'hidden', flexShrink: 0, background: 'white' }}
      >
        {/* Filter + count */}
        <div className="px-4 pt-3 pb-2 border-b border-[#F0EEE8]">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2">
            {[null, ...foodTypes].map(t => (
              <button key={t ?? 'alle'} onClick={() => setFoodFilter(t)}
                className={cn('px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all',
                  foodFilter === t ? 'bg-[#111110] text-white' : 'bg-[#F2F1ED] text-[#6B6560]')}>
                {t ?? 'Alle'}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#B0ADA8]">
            {sorted.length} {sorted.length === 1 ? 'Restaurant' : 'Restaurants'}
          </p>
        </div>

        {/* Scrollable list */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          style={{ overflowY: 'auto', height: listPx - 72, WebkitOverflowScrolling: 'touch' }}
        >
          {sorted.map((r, i) => {
            const active = highlighted === r.id
            return (
              <button
                key={r.id}
                ref={el => { itemRefs.current[r.id] = el }}
                onClick={() => tap(r)}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-3.5 text-left border-b border-[#F4F3F0] last:border-0 transition-colors',
                  active ? 'bg-[#FFF6F5]' : 'active:bg-[#F9F8F5]'
                )}
              >
                <span className="font-serif tabular-nums shrink-0 leading-none"
                  style={{ fontSize: 22, color: active ? '#E8C8C6' : '#ECEAE4', width: 32, textAlign: 'right' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#B0ADA8] mb-0.5">{r.food_type}</p>
                  <p className={cn('font-serif text-[16px] leading-snug truncate transition-colors', active ? 'text-[#C8302A]' : 'text-[#111110]')}>
                    {r.name}
                  </p>
                  {r.neighborhood && <p className="text-[11px] text-[#9B9894] mt-0.5 truncate">{r.neighborhood}</p>}
                </div>
                <span className="font-serif tabular-nums shrink-0"
                  style={{ fontSize: 22, color: r.avg_score > 0 ? scoreColor(r.avg_score) : '#D5D3CE' }}>
                  {r.avg_score > 0 ? r.avg_score.toFixed(1) : '—'}
                </span>
              </button>
            )
          })}
          {sorted.length === 0 && (
            <div className="py-12 text-center">
              <p className="font-serif text-4xl text-[#ECEAE4] mb-2">—</p>
              <p className="text-sm text-[#9B9894]">Keine Restaurants mit Koordinaten</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* White fill behind nav so no ugly gap */}
      <div style={{ flex: 1, background: fullscreen ? 'transparent' : 'white' }} />
    </div>
  )
}

function ExpandIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
}
function ListIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
}
