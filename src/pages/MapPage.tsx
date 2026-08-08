import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { fetchRestaurantsWithStats } from '../lib/queries'
import { scoreColor, scoreLabel } from '../lib/scoring'
import { motion } from 'framer-motion'

function createMarkerIcon(score: number, name: string) {
  const color = scoreColor(score)
  const label = name.length > 16 ? name.slice(0, 15) + '…' : name
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.25)"/>
      </filter>
      <path d="M22 2C12.059 2 4 10.059 4 20c0 12 18 30 18 30S40 32 40 20C40 10.059 31.941 2 22 2z"
        fill="${color}" filter="url(#shadow)"/>
      <circle cx="22" cy="20" r="13" fill="rgba(255,255,255,0.95)"/>
      <text x="22" y="24" text-anchor="middle" font-size="11" font-weight="700"
        font-family="Inter,sans-serif" fill="${color}">${score.toFixed(1)}</text>
    </svg>
    <div style="position:absolute;top:54px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(255,255,255,0.92);backdrop-filter:blur(8px);border-radius:8px;padding:2px 7px;font-size:11px;font-weight:600;color:#1A1714;box-shadow:0 1px 6px rgba(0,0,0,0.18);border:1px solid rgba(0,0,0,0.06)">${label}</div>
  `
  return L.divIcon({
    html: `<div style="position:relative">${svg}</div>`,
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  })
}

export function MapPage() {
  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurantsWithStats,
  })

  const withCoords = restaurants.filter(r => r.lat && r.lng)
  // Munich center
  const center: [number, number] = [48.1351, 11.582]

  return (
    <div className="relative h-dvh flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 inset-x-0 z-[1000] px-4 pt-12 pb-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-strong rounded-[20px] px-5 py-3 pointer-events-auto inline-flex items-center gap-3"
        >
          <span className="text-2xl">📍</span>
          <div>
            <h1 className="font-serif text-[#1A1714] text-base leading-tight">München</h1>
            <p className="text-xs text-[#9E9791]">{withCoords.length} Locations</p>
          </div>
        </motion.div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        className="flex-1 z-0"
        style={{ height: '100dvh' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat!, r.lng!]}
            icon={createMarkerIcon(r.avg_score, r.name)}
          >
            <Popup>
              <Link to={`/restaurant/${r.id}`} className="block no-underline">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#EAE7E1]">
                    {r.cover_photo_url
                      ? <img src={r.cover_photo_url} alt={r.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🥖</div>
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1714] text-sm leading-tight">{r.name}</p>
                    <p className="text-xs text-[#9E9791] mt-0.5">{r.neighborhood}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: scoreColor(r.avg_score) }}>
                      {r.avg_score.toFixed(1)} · {scoreLabel(r.avg_score)}
                    </p>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
