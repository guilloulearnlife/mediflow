'use client'

import { useEffect, useRef } from 'react'

interface Clinique {
  id: string
  nom: string
  ville: string
  adresse?: string
  latitude?: number
  longitude?: number
  specialites?: string[]
}

export default function MapCliniques({ cliniques }: { cliniques: Clinique[] }) {
  const mapRef = useRef<unknown>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return

      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })
      L.Marker.prototype.options.icon = DefaultIcon

      const map = L.map(containerRef.current).setView([5.5, 12.5], 6)
      mapRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 18,
      }).addTo(map)

      const villes = [
        { nom: 'Yaoundé', lat: 3.8480, lng: 11.5021 },
        { nom: 'Douala', lat: 4.0511, lng: 9.7679 },
        { nom: 'Bafoussam', lat: 5.4737, lng: 10.4175 },
        { nom: 'Garoua', lat: 9.3017, lng: 13.3921 },
        { nom: 'Bamenda', lat: 5.9527, lng: 10.1460 },
        { nom: 'Maroua', lat: 10.5950, lng: 14.3187 },
        { nom: 'Ngaoundéré', lat: 7.3267, lng: 13.5840 },
        { nom: 'Bertoua', lat: 4.5769, lng: 13.6836 },
        { nom: 'Ebolowa', lat: 2.9000, lng: 11.1500 },
        { nom: 'Buea', lat: 4.1527, lng: 9.2422 },
      ]

      villes.forEach((ville) => {
        L.circleMarker([ville.lat, ville.lng], {
          radius: 8,
          fillColor: '#00E5A0',
          color: '#00E5A0',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3,
        }).addTo(map).bindTooltip(ville.nom, {
          permanent: false,
          direction: 'top',
        })
      })

      cliniques.forEach((clinique) => {
        if (!clinique.latitude || !clinique.longitude) return
        L.marker([clinique.latitude, clinique.longitude])
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:180px;">
              <div style="font-weight:800;font-size:14px;color:#0C1E35;margin-bottom:4px;">🏥 ${clinique.nom}</div>
              <div style="font-size:12px;color:#64748B;margin-bottom:6px;">📍 ${clinique.adresse ?? clinique.ville}</div>
              ${clinique.specialites ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${clinique.specialites.map(s => `<span style="background:#E6F7F5;color:#0BA896;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;">${s}</span>`).join('')}</div>` : ''}
            </div>
          `)
      })
    })

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [cliniques])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ height: '100%', width: '100%', borderRadius: '16px' }} />
    </>
  )
}