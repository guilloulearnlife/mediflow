'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Search, MapPin, Phone, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'

const MapRechercheHybride = dynamic(() => import('@/components/MapRechercheHybride'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-white/5">
      <Loader2 className="w-6 h-6 text-[#00E5A0] animate-spin" />
    </div>
  )
})

const VILLES = [
  'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam',
  'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi',
  'Limbé', 'Buéa', 'Dschang', 'Kumba', 'Foumban',
  'Edéa', 'Mbalmayo', 'Nkongsamba', 'Loum', 'Bafia',
  'Mbouda', 'Meiganga', 'Kousséri', 'Mora', 'Wum',
  'Kumbo', 'Batouri', 'Sangmélima', 'Fundong', 'Tibati',
  'Banyo', 'Yokadouma', 'Abong-Mbang', 'Bafang', 'Melong',
]

const SPECIALITES = [
  { value: 'all',           label: 'Tous les établissements' },
  { value: 'hospital',      label: 'Hôpitaux' },
  { value: 'clinique',      label: 'Cliniques générales' },
  { value: 'urgences',      label: 'Urgences' },
  { value: 'pharmacie',     label: 'Pharmacies' },
  { value: 'dentiste',      label: 'Dentistes' },
  { value: 'laboratoire',   label: 'Laboratoires d\'analyses' },
  { value: 'maternite',     label: 'Maternités' },
  { value: 'pediatrie',     label: 'Pédiatrie' },
  { value: 'gynecologie',   label: 'Gynécologie' },
  { value: 'cardiologie',   label: 'Cardiologie' },
  { value: 'ophtalmologie', label: 'Ophtalmologie' },
  { value: 'dermatologie',  label: 'Dermatologie' },
  { value: 'radiologie',    label: 'Radiologie / Imagerie' },
  { value: 'kinesitherapie',label: 'Kinésithérapie' },
]

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
  specialites?: string[]
  distance?: number
  whatsapp_number?: string
}

export default function RecherchePage() {
  const [ville, setVille] = useState('Yaoundé')
  const [specialite, setSpecialite] = useState('hospital')
  const [loading, setLoading] = useState(false)
  const [resultats, setResultats] = useState<Clinique[] | null>(null)
  const [meta, setMeta] = useState<{ total: number; mediflow: number; osm: number } | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Clinique | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!ville.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    setSelected(null)

    try {
      const res = await fetch(
        `/api/search-cliniques?ville=${encodeURIComponent(ville)}&specialite=${specialite}&rayon=15000`
      )
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erreur de recherche')
      setResultats(data.cliniques)
      setMeta({ total: data.total, mediflow: data.mediflow_count, osm: data.osm_count })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [ville, specialite])

  const specialiteLabel = SPECIALITES.find(s => s.value === specialite)?.label ?? ''

  return (
    <main className="min-h-screen bg-[#060D1A]">

      {/* Navbar */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 bg-[#060D1A]/90 backdrop-blur z-40">
        <Link href="/" className="text-2xl font-black text-white">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </Link>
        <Link
          href="/auth/login"
          className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
        >
          Espace clinique →
        </Link>
      </nav>

      {/* Hero + Formulaire */}
      <div className="px-8 py-14 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
          MediFlow + OpenStreetMap · Cameroun
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Trouvez votre <span className="text-[#00E5A0]">médecin</span>
        </h1>
        <p className="text-white/50 text-lg mb-10">
          Choisissez votre ville et la spécialité — nous trouvons les établissements à proximité
        </p>

        {/* Barre de recherche */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
          <select
            value={ville}
            onChange={e => setVille(e.target.value)}
            className="flex-1 px-4 py-3 text-[#0C1E35] text-sm outline-none rounded-xl bg-[#F4F7FB] cursor-pointer"
          >
            {VILLES.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select
            value={specialite}
            onChange={e => setSpecialite(e.target.value)}
            className="flex-1 px-4 py-3 text-[#0C1E35] text-sm outline-none rounded-xl bg-[#F4F7FB] cursor-pointer"
          >
            {SPECIALITES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#00E5A0] text-[#060D1A] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#00B87D] transition-colors disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />
            }
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Meta résultats */}
        {meta && !loading && (
          <div className="mt-5 flex items-center justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5A0]" />
              <strong className="text-white">{meta.mediflow}</strong> sur MediFlow
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <strong className="text-white">{meta.osm}</strong> depuis OpenStreetMap
            </span>
            <span>
              <strong className="text-white">{meta.total}</strong> au total
            </span>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="max-w-5xl mx-auto px-8 mb-6">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Résultats */}
      {searched && !loading && resultats !== null && (
        <div className="px-8 pb-12 max-w-7xl mx-auto">

          {resultats.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-lg">Aucun établissement trouvé à {ville}</p>
              <p className="text-sm mt-2">Essayez une autre ville ou une autre spécialité</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Carte (2/3) */}
              <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10" style={{ height: '520px' }}>
                <div className="h-full">
                  <MapRechercheHybride
                    cliniques={resultats}
                    onSelectClinique={setSelected}
                    selectedClinique={selected}
                  />
                </div>
              </div>

              {/* Liste (1/3) */}
              <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '520px' }}>
                <h2 className="text-white font-bold text-sm sticky top-0 bg-[#060D1A] py-1">
                  {resultats.length} résultat{resultats.length > 1 ? 's' : ''} · {specialiteLabel} à {ville}
                </h2>
                {resultats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`text-left bg-white/5 border rounded-2xl p-4 hover:border-[#00E5A0]/40 transition-all ${
                      selected?.id === c.id
                        ? 'border-[#00E5A0]/60 bg-[#00E5A0]/5'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{c.nom}</p>
                      {c.inscrite ? (
                        <span className="flex-shrink-0 flex items-center gap-1 bg-[#00E5A0]/15 border border-[#00E5A0]/30 text-[#00E5A0] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> MediFlow
                        </span>
                      ) : (
                        <span className="flex-shrink-0 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          OSM
                        </span>
                      )}
                    </div>
                    {c.adresse && (
                      <p className="text-white/40 text-xs flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{c.adresse}</span>
                      </p>
                    )}
                    {c.telephone && (
                      <p className="text-white/40 text-xs flex items-center gap-1 mb-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {c.telephone}
                      </p>
                    )}
                    {c.distance !== undefined && (
                      <p className="text-white/30 text-xs mt-1">{c.distance.toFixed(1)} km</p>
                    )}
                    {c.inscrite && (
                      <Link
                        href={`/booking?clinique_id=${c.id}`}
                        onClick={e => e.stopPropagation()}
                        className="mt-3 w-full flex items-center justify-center gap-1 bg-[#00E5A0] text-[#060D1A] text-xs font-black py-2 rounded-xl hover:bg-[#00B87D] transition-colors"
                      >
                        Prendre RDV <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </button>
                ))}
              </div>

            </div>
          )}
        </div>
      )}

      {/* État initial — pas encore recherché */}
      {!searched && (
        <div className="px-8 pb-16 text-center">
          <p className="text-white/20 text-sm">Sélectionnez votre ville et une spécialité, puis cliquez sur Rechercher</p>
        </div>
      )}

    </main>
  )
}
