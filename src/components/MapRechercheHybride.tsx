// components/MapRechercheHybride.tsx
'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

// Fix pour les icônes Leaflet dans Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Clinique {
  id: string
  nom: string
  adresse: string
  ville: string
  latitude: number
  longitude: number
  telephone?: string
  source: 'mediflow' | 'openstreetmap'
  inscrite: boolean
  distance?: number
}

interface MapRechercheHybrideProps {
  cliniques: Clinique[]
  onSelectClinique: (clinique: Clinique) => void
  selectedClinique: Clinique | null
}

// Icônes personnalisées
const iconeMediFlow = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 26 16 26s16-14.8 16-26C32 7.2 24.8 0 16 0z" fill="#0BA896"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#0BA896">+</text>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42]
})

const iconeOSM = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 26 16 26s16-14.8 16-26C32 7.2 24.8 0 16 0z" fill="#3B82F6"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <text x="16" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#3B82F6">i</text>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42]
})

const iconeSelected = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z" fill="#F59E0B"/>
      <circle cx="20" cy="20" r="10" fill="white"/>
      <circle cx="20" cy="20" r="6" fill="#F59E0B"/>
    </svg>
  `),
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -52]
})

function MapBounds({ cliniques }: { cliniques: Clinique[] }) {
  const map = useMap()

  useEffect(() => {
    if (cliniques.length === 0) return
    const bounds = L.latLngBounds(
      cliniques.map(c => [c.latitude, c.longitude] as LatLngExpression)
    )
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
  }, [cliniques, map])

  return null
}

export default function MapRechercheHybride({
  cliniques,
  onSelectClinique,
  selectedClinique
}: MapRechercheHybrideProps) {
  const defaultCenter: LatLngExpression = [3.8480, 11.5021]
  const defaultZoom = 12

  const center: LatLngExpression = cliniques.length > 0
    ? [cliniques[0].latitude, cliniques[0].longitude]
    : defaultCenter

  return (
    <MapContainer
      center={center}
      zoom={defaultZoom}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBounds cliniques={cliniques} />

      {cliniques.map(clinique => {
        let icon = clinique.inscrite ? iconeMediFlow : iconeOSM
        if (selectedClinique?.id === clinique.id) icon = iconeSelected

        return (
          <Marker
            key={clinique.id}
            position={[clinique.latitude, clinique.longitude]}
            icon={icon}
            eventHandlers={{ click: () => onSelectClinique(clinique) }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm pr-2">{clinique.nom}</h3>
                  {clinique.inscrite ? (
                    <span className="px-2 py-0.5 bg-[#0BA896] text-white text-xs rounded-full whitespace-nowrap">
                      MediFlow
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full whitespace-nowrap">
                      OSM
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-2">{clinique.adresse}</p>

                {clinique.telephone && (
                  <p className="text-xs text-gray-700 mb-2">📞 {clinique.telephone}</p>
                )}

                {clinique.distance && (
                  <p className="text-xs text-gray-500 mb-3">
                    📍 {clinique.distance.toFixed(1)} km
                  </p>
                )}

                <div className="flex gap-2">
                  {clinique.inscrite ? (
                    <a
                      href={`/booking?clinique_id=${clinique.id}`}
                      className="block text-center px-3 py-1 bg-[#0BA896] hover:bg-[#097A6E] text-white text-xs font-semibold rounded transition-colors"
                    >
                      Prendre RDV
                    </a>
                  ) : (
                    <button
                      onClick={() => alert('Fonctionnalité à venir !')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                    >
                      Réclamer
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
