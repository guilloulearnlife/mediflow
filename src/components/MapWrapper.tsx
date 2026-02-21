'use client'

import dynamic from 'next/dynamic'

const MapCliniques = dynamic(() => import('./MapCliniques'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-2xl">
      <span className="text-white/40 text-sm">Chargement de la carte...</span>
    </div>
  ),
})

interface Clinique {
  id: string
  nom: string
  ville: string
  adresse?: string
  latitude?: number
  longitude?: number
  specialites?: string[]
}

export default function MapWrapper({ cliniques }: { cliniques: Clinique[] }) {
  return <MapCliniques cliniques={cliniques} />
}