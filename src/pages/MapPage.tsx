import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { fetchRestaurantsWithStats } from '../lib/queries'
import { scoreColor, scoreLabel } from '../lib/scoring'

function createMarkerIcon(score: number, name: string) {
  const color = scoreColor(score)
  const label = name.length > 18 ? name.slice(0, 17) + '…' : name
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.22)"/>
        </filter>
      </defs>
      <path d="M20 2C11.163 2 4 9.163 4 18c0 10.5 16 28 16 28S36 28.5 36 18C36 9.163 28.837 2 20 2z"
        fill="${color}" filter="url(#s)"/>
      <circle cx="20" cy="18" r="11" fill="white"/>
      <text x="20" y="22" text-anchor="middle" font-size="9.5" font-weight="700"
        font-family="Inter,sans-serif" fill="${color}">${score.toFixed(1)}</text>
    </svg>
    <div style="position:absolute;top:50px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#FFFFFF;border-radius:6px;padding:3px 8px;font-size:10.5px;font-weight:600;color:#111110;box-shadow:0 2px 8px rgba(0,0,0,0.14);letter-spacing:-0.01em">${label}</div>
  `
  return L.divIcon({
    html: `<div style="position:relative">${svg}</div>`,
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -52],
  })
}

export function MapPage() {
  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurantsWithStats,
  })

  const withCoords = restaurants.filter(r => r.lat && r.lng)
  const center: [number, number] = [48.1351, 11.582]

  return (
    <div className="relative h-dvh flex flex-col">
      <MapContainer
        center={center}
        zoom={13}
        className="flex-1 z-0"
        style={{ height: '100dvh' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        {withCoords.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat!, r.lng!]}
            icon={createMarkerIcon(r.avg_score, r.name)}
          >
            <Popup className="clean-popup">
              <Link to={`/restaurant/${r.id}`} className="block no-underline">
                <div className="flex items-center gap-3" style={{ minWidth: 200, padding: '4px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#F0EEE8' }}>
                    {r.cover_photo_url
                      ? <img src={r.cover_photo_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🥖</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#111110', lineHeight: 1.3, margin: 0 }}>{r.name}</p>
                    {r.neighborhood && <p style={{ fontSize: 11, color: '#9B9894', margin: '2px 0 0' }}>{r.neighborhood}</p>}
                    <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 0 0', color: scoreColor(r.avg_score) }}>
                      {r.avg_score.toFixed(1)} <span style={{ fontWeight: 400, color: '#9B9894' }}>— {scoreLabel(r.avg_score)}</span>
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
