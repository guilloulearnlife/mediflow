// app/recherche-amelioree/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const MapWrapper = dynamic(() => import('@/components/MapRechercheHybride'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0BA896] mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  )
})

interface Clinique {
  id: string
  nom: string
  adresse: string
  ville: string
  latitude: number
  longitude: number
  telephone?: string
  email?: string
  website?: string
  whatsapp_number?: string
  source: 'mediflow' | 'openstreetmap'
  inscrite: boolean
  specialites?: string[]
  horaires?: unknown
  distance?: number
  osm_id?: number
}

interface ResultatsRecherche {
  success: boolean
  total: number
  mediflow_count: number
  osm_count: number
  ville: string
  specialite: string
  rayon: number
  cliniques: Clinique[]
  note?: string
}

const VILLES_CAMEROUN = [
  'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam',
  'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi',
  'Limbé', 'Buéa', 'Dschang', 'Kumba', 'Foumban'
]

const SPECIALITES = [
  { value: 'hospital', label: 'Hôpitaux' },
  { value: 'clinique', label: 'Cliniques' },
  { value: 'pharmacie', label: 'Pharmacies' },
  { value: 'dentiste', label: 'Dentistes' },
  { value: 'laboratoire', label: 'Laboratoires' },
  { value: 'maternite', label: 'Maternités' },
  { value: 'all', label: 'Tous les établissements' }
]

const RAYONS = [
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
  { value: 50000, label: '50 km' }
]

export default function RechercheAmelioree() {
  const [ville, setVille] = useState('Yaoundé')
  const [specialite, setSpecialite] = useState('hospital')
  const [rayon, setRayon] = useState(10000)
  const [loading, setLoading] = useState(false)
  const [resultats, setResultats] = useState<ResultatsRecherche | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedClinique, setSelectedClinique] = useState<Clinique | null>(null)

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/search-cliniques', window.location.origin)
      url.searchParams.set('ville', ville)
      url.searchParams.set('specialite', specialite)
      url.searchParams.set('rayon', rayon.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la recherche')
      }

      setResultats(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
      console.error('Erreur recherche:', err)
    } finally {
      setLoading(false)
    }
  }, [ville, specialite, rayon])

  useEffect(() => {
    handleSearch()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Recherche de <span className="text-[#0BA896]">Cliniques</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Trouvez des établissements de santé partout au Cameroun
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ville */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
              <select
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BA896] focus:border-transparent"
              >
                {VILLES_CAMEROUN.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Spécialité */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type d&apos;établissement
              </label>
              <select
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BA896] focus:border-transparent"
              >
                {SPECIALITES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Rayon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rayon de recherche
              </label>
              <select
                value={rayon}
                onChange={(e) => setRayon(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BA896] focus:border-transparent"
              >
                {RAYONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Bouton */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-[#0BA896] hover:bg-[#097A6E] text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>
          </div>

          {/* Statistiques */}
          {resultats && (
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0BA896] rounded-full"></div>
                <span><strong>{resultats.mediflow_count}</strong> inscrites sur MediFlow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span><strong>{resultats.osm_count}</strong> depuis OpenStreetMap</span>
              </div>
              <div><strong>{resultats.total}</strong> au total</div>
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Carte + Liste */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte (2/3) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[600px]">
            {resultats && (
              <MapWrapper
                cliniques={resultats.cliniques}
                onSelectClinique={setSelectedClinique}
                selectedClinique={selectedClinique}
              />
            )}
          </div>

          {/* Liste (1/3) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                Résultats ({resultats?.total || 0})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0BA896] mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Recherche en cours...</p>
                </div>
              )}

              {!loading && resultats && resultats.cliniques.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-600">Aucun résultat trouvé</p>
                  <p className="text-sm text-gray-500 mt-2">Essayez d&apos;élargir le rayon de recherche</p>
                </div>
              )}

              {!loading && resultats && resultats.cliniques.map(clinique => (
                <button
                  key={clinique.id}
                  onClick={() => setSelectedClinique(clinique)}
                  className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                    selectedClinique?.id === clinique.id ? 'bg-blue-50 border-l-4 border-l-[#0BA896]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{clinique.nom}</h4>
                    {clinique.inscrite ? (
                      <span className="ml-2 px-2 py-1 bg-[#0BA896] text-white text-xs rounded-full whitespace-nowrap">
                        MediFlow
                      </span>
                    ) : (
                      <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full whitespace-nowrap">
                        OSM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">{clinique.adresse}</p>
                  {clinique.distance && (
                    <p className="text-xs text-gray-500">📍 {clinique.distance.toFixed(1)} km</p>
                  )}
                  {clinique.telephone && (
                    <p className="text-xs text-gray-500 mt-1">📞 {clinique.telephone}</p>
                  )}
                  {!clinique.inscrite && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">→ Réclamer cet établissement</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Détails clinique sélectionnée */}
        {selectedClinique && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedClinique.nom}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedClinique.adresse}</p>
              </div>
              {selectedClinique.inscrite ? (
                <span className="px-3 py-1 bg-[#0BA896] text-white text-sm rounded-full">
                  Inscrit sur MediFlow
                </span>
              ) : (
                <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                  Données OpenStreetMap
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations</h4>
                <div className="space-y-2 text-sm">
                  {selectedClinique.telephone && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-600">Téléphone:</span>
                      <a href={`tel:${selectedClinique.telephone}`} className="text-[#0BA896] hover:underline">
                        {selectedClinique.telephone}
                      </a>
                    </p>
                  )}
                  {selectedClinique.email && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-600">Email:</span>
                      <a href={`mailto:${selectedClinique.email}`} className="text-[#0BA896] hover:underline">
                        {selectedClinique.email}
                      </a>
                    </p>
                  )}
                  {selectedClinique.website && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-600">Site web:</span>
                      <a href={selectedClinique.website} target="_blank" rel="noopener noreferrer" className="text-[#0BA896] hover:underline">
                        Visiter
                      </a>
                    </p>
                  )}
                  {selectedClinique.distance && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-600">Distance:</span>
                      <span className="text-gray-900">{selectedClinique.distance.toFixed(1)} km</span>
                    </p>
                  )}
                </div>
              </div>

              {selectedClinique.specialites && selectedClinique.specialites.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Spécialités</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClinique.specialites.map((spec, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {selectedClinique.inscrite ? (
                <a
                  href={`/booking?clinique_id=${selectedClinique.id}`}
                  className="px-6 py-2 bg-[#0BA896] hover:bg-[#097A6E] text-white font-semibold rounded-lg transition-colors"
                >
                  Prendre rendez-vous
                </a>
              ) : (
                <button
                  onClick={() => alert('Fonctionnalité "Réclamer" à venir !')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Réclamer cet établissement
                </button>
              )}

              {selectedClinique.whatsapp_number && (
                <a
                  href={`https://wa.me/${selectedClinique.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  WhatsApp
                </a>
              )}
            </div>

            {!selectedClinique.inscrite && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>C&apos;est votre établissement ?</strong> Réclamez-le pour gérer vos rendez-vous,
                  mettre à jour vos informations et communiquer avec vos patients via MediFlow.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Note OpenStreetMap */}
        {resultats?.note && (
          <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
            <p><strong>ℹ️ {resultats.note}</strong></p>
            <p className="mt-2">
              Les données OpenStreetMap sont collaboratives et maintenues par la communauté.
              Si vous trouvez des informations incorrectes, vous pouvez les corriger sur{' '}
              <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-[#0BA896] hover:underline font-medium">
                OpenStreetMap.org
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
