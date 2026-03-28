'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Search, MapPin, Phone, ArrowRight, CheckCircle, Loader2, ChevronDown, X } from 'lucide-react'

const MapRechercheHybride = dynamic(() => import('@/components/MapRechercheHybride'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-white/5">
      <Loader2 className="w-6 h-6 text-[#00E5A0] animate-spin" />
    </div>
  ),
})

// ─── Données statiques ────────────────────────────────────────────────────────

const VILLES: Record<string, { lat: number; lon: number }> = {
  'Yaoundé':       { lat: 3.8667,  lon: 11.5167 },
  'Douala':        { lat: 4.0511,  lon: 9.7679  },
  'Garoua':        { lat: 9.3017,  lon: 13.3974 },
  'Bamenda':       { lat: 5.9597,  lon: 10.1460 },
  'Bafoussam':     { lat: 5.4764,  lon: 10.4175 },
  'Maroua':        { lat: 10.5918, lon: 14.3158 },
  'Ngaoundéré':    { lat: 7.3167,  lon: 13.5833 },
  'Bertoua':       { lat: 4.5797,  lon: 13.6853 },
  'Ebolowa':       { lat: 2.9000,  lon: 11.1500 },
  'Kribi':         { lat: 2.9400,  lon: 9.9100  },
  'Limbé':         { lat: 4.0203,  lon: 9.1997  },
  'Buéa':          { lat: 4.1527,  lon: 9.2369  },
  'Dschang':       { lat: 5.4500,  lon: 10.0500 },
  'Kumba':         { lat: 4.6364,  lon: 9.4469  },
  'Foumban':       { lat: 5.7264,  lon: 10.9067 },
  'Edéa':          { lat: 3.7997,  lon: 10.1333 },
  'Mbalmayo':      { lat: 3.5167,  lon: 11.5000 },
  'Nkongsamba':    { lat: 4.9500,  lon: 9.9333  },
  'Loum':          { lat: 4.7000,  lon: 9.7333  },
  'Bafia':         { lat: 4.7497,  lon: 11.2333 },
  'Mbouda':        { lat: 5.6333,  lon: 10.2500 },
  'Meiganga':      { lat: 6.5167,  lon: 14.3000 },
  'Kousséri':      { lat: 12.0833, lon: 15.0333 },
  'Mora':          { lat: 11.0500, lon: 14.1500 },
  'Wum':           { lat: 6.3833,  lon: 10.0667 },
  'Kumbo':         { lat: 6.2167,  lon: 10.6500 },
  'Batouri':       { lat: 4.4333,  lon: 14.3667 },
  'Sangmélima':    { lat: 2.9333,  lon: 11.9833 },
  'Fundong':       { lat: 6.3667,  lon: 10.2833 },
  'Tibati':        { lat: 6.4667,  lon: 12.6167 },
  'Banyo':         { lat: 6.7500,  lon: 11.8167 },
  'Yokadouma':     { lat: 3.5167,  lon: 15.0500 },
  'Abong-Mbang':   { lat: 3.9833,  lon: 13.1833 },
  'Bafang':        { lat: 5.1500,  lon: 10.1833 },
  'Melong':        { lat: 5.1167,  lon: 9.9500  },
}

const SPECIALITES = [
  { value: 'all',            label: 'Tous les établissements', osmTags: ['amenity=hospital','amenity=clinic','amenity=doctors','amenity=pharmacy'] },
  { value: 'hospital',       label: 'Hôpitaux',                osmTags: ['amenity=hospital'] },
  { value: 'clinique',       label: 'Cliniques',               osmTags: ['amenity=clinic','amenity=doctors'] },
  { value: 'urgences',       label: 'Urgences',                osmTags: ['amenity=hospital'] },
  { value: 'pharmacie',      label: 'Pharmacies',              osmTags: ['amenity=pharmacy'] },
  { value: 'dentiste',       label: 'Dentistes',               osmTags: ['healthcare=dentist','amenity=dentist','amenity=clinic'] },
  { value: 'laboratoire',    label: "Laboratoires d'analyses", osmTags: ['healthcare=laboratory','amenity=clinic'] },
  { value: 'maternite',      label: 'Maternités',              osmTags: ['healthcare=midwife','amenity=maternity','amenity=hospital'] },
  { value: 'pediatrie',      label: 'Pédiatrie',               osmTags: ['healthcare=paediatrician','amenity=clinic','amenity=hospital'] },
  { value: 'gynecologie',    label: 'Gynécologie',             osmTags: ['healthcare=gynaecologist','amenity=clinic','amenity=hospital'] },
  { value: 'cardiologie',    label: 'Cardiologie',             osmTags: ['healthcare=cardiologist','amenity=hospital','amenity=clinic'] },
  { value: 'ophtalmologie',  label: 'Ophtalmologie',           osmTags: ['healthcare=optometrist','amenity=clinic','amenity=hospital'] },
  { value: 'dermatologie',   label: 'Dermatologie',            osmTags: ['healthcare=dermatologist','amenity=clinic','amenity=hospital'] },
  { value: 'radiologie',     label: 'Radiologie / Imagerie',   osmTags: ['healthcare=radiologist','healthcare=laboratory','amenity=hospital'] },
  { value: 'kinesitherapie', label: 'Kinésithérapie',          osmTags: ['healthcare=physiotherapist','amenity=clinic'] },
]

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Utilitaires Overpass (browser-side) ─────────────────────────────────────

function buildOverpassQuery(lat: number, lon: number, rayon: number, osmTags: string[]): string {
  const blocks = osmTags.map(tag => {
    const [k, v] = tag.split('=')
    return `nwr["${k}"="${v}"](around:${rayon},${lat},${lon});`
  }).join('\n')
  return `[out:json][timeout:25];\n(\n${blocks}\n);\nout body center;`
}

function buildOverpassQueryLibre(lat: number, lon: number, rayon: number, terme: string): string {
  // Escape special regex chars sauf les lettres/chiffres
  const safe = terme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `[out:json][timeout:30];
(
  nwr["name"~"${safe}",i]["amenity"~"hospital|clinic|doctors|pharmacy|laboratory"](around:${rayon},${lat},${lon});
  nwr["name"~"${safe}",i]["healthcare"](around:${rayon},${lat},${lon});
  nwr["healthcare:speciality"~"${safe}",i](around:${rayon},${lat},${lon});
  nwr["description"~"${safe}",i]["amenity"~"hospital|clinic"](around:${rayon},${lat},${lon});
);
out body center;`
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3, toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')
}

function dice(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const s1 = new Set(Array.from({length:a.length-1},(_,i)=>a.slice(i,i+2)))
  const s2 = new Set(Array.from({length:b.length-1},(_,i)=>b.slice(i,i+2)))
  const inter = [...s1].filter(x=>s2.has(x)).length
  return (2*inter)/(s1.size+s2.size)
}

async function fetchOverpass(lat: number, lon: number, rayon: number, osmTags: string[], texteLibre?: string): Promise<Clinique[]> {
  const tryQuery = async (query: string): Promise<Clinique[]> => {
    const body = `data=${encodeURIComponent(query)}`
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.elements ?? [])
      .filter((e: Record<string,unknown>) => (e.tags as Record<string,string>)?.name)
      .map((e: Record<string,unknown>) => {
        const tags = e.tags as Record<string,string>
        const elLat = (e.lat as number) ?? (e.center as {lat:number})?.lat ?? 0
        const elLon = (e.lon as number) ?? (e.center as {lon:number})?.lon ?? 0
        return {
          id:       `osm_${e.type}_${e.id}`,
          nom:      tags.name,
          adresse:  [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
          ville:    tags['addr:city'] ?? '',
          latitude: elLat,
          longitude:elLon,
          telephone:tags['contact:phone'] ?? tags.phone,
          source:   'openstreetmap' as const,
          inscrite: false,
          specialites: [tags.amenity, tags.healthcare, tags['healthcare:speciality']].filter(Boolean) as string[],
          distance: calcDist(lat, lon, elLat, elLon) / 1000,
        }
      })
      .filter((c: Clinique) => c.latitude !== 0 && c.longitude !== 0)
  }

  // Mode texte libre : requête Overpass par regex sur nom + healthcare:speciality
  if (texteLibre && texteLibre.trim().length >= 2) {
    const results = await tryQuery(buildOverpassQueryLibre(lat, lon, rayon, texteLibre.trim()))
    // Fallback large si rien trouvé avec le terme exact
    if (results.length === 0) {
      return await tryQuery(buildOverpassQuery(lat, lon, rayon, ['amenity=hospital', 'amenity=clinic', 'amenity=doctors']))
    }
    return results
  }

  // Mode tags standards
  const results = await tryQuery(buildOverpassQuery(lat, lon, rayon, osmTags))
  // Fallback si 0 résultats : essaie avec les tags healthcare génériques
  if (results.length === 0) {
    return await tryQuery(buildOverpassQuery(lat, lon, rayon, ['amenity=hospital', 'amenity=clinic', 'amenity=doctors']))
  }
  return results
}

// ─── Composant principal ──────────────────────────────────────────────────────

// Suggestions supplémentaires non présentes dans SPECIALITES
const EXTRA_SUGGESTIONS = [
  'Dialyse','Oncologie','Neurologie','ORL','Urologie',
  'Orthopédie','Psychiatrie','Endocrinologie','Pneumologie',
  'Gastro-entérologie','Rhumatologie','Hématologie',
  'Infectiologie','Chirurgie générale','Réanimation',
]

export default function RecherchePage() {
  const [villeKey, setVilleKey]           = useState('Yaoundé')
  const [specialiteIdx, setSpecialiteIdx] = useState(1) // "Hôpitaux"
  const [texteLibre, setTexteLibre]       = useState('')
  // Combobox
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [comboInput, setComboInput]       = useState(SPECIALITES[1].label)
  const comboRef                          = useRef<HTMLDivElement>(null)
  const inputRef                          = useRef<HTMLInputElement>(null)

  const [loadingMF, setLoadingMF]         = useState(false)
  const [loadingOSM, setLoadingOSM]       = useState(false)
  const [cliniques, setCliniques]         = useState<Clinique[]>([])
  const [osmCount, setOsmCount]           = useState(0)
  const [mfCount, setMfCount]             = useState(0)
  const [error, setError]                 = useState('')
  const [selected, setSelected]           = useState<Clinique | null>(null)
  const [searched, setSearched]           = useState(false)

  // Fermer le dropdown si clic à l'extérieur
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Suggestions filtrées (prédéfinies + extras)
  const allSuggestions = [
    ...SPECIALITES.map((s, i) => ({ label: s.label, idx: i, isPredef: true })),
    ...EXTRA_SUGGESTIONS
      .filter(s => !SPECIALITES.some(sp => sp.label.toLowerCase() === s.toLowerCase()))
      .map(s => ({ label: s, idx: -1, isPredef: false })),
  ]
  const filtered = comboInput.trim()
    ? allSuggestions.filter(s => s.label.toLowerCase().includes(comboInput.trim().toLowerCase()))
    : allSuggestions

  function selectOption(item: typeof allSuggestions[0]) {
    setComboInput(item.label)
    if (item.isPredef && item.idx >= 0) {
      setSpecialiteIdx(item.idx)
      setTexteLibre('')
    } else {
      setTexteLibre(item.label)
    }
    setDropdownOpen(false)
  }

  function handleComboChange(val: string) {
    setComboInput(val)
    const match = SPECIALITES.findIndex(s => s.label.toLowerCase() === val.toLowerCase())
    if (match >= 0) {
      setSpecialiteIdx(match)
      setTexteLibre('')
    } else {
      setTexteLibre(val)
    }
  }

  const specialite = SPECIALITES[specialiteIdx]
  const labelRecherche = texteLibre.trim() || specialite.label

  const handleSearch = useCallback(async () => {
    const coords = VILLES[villeKey]
    if (!coords) return

    setLoadingMF(true)
    setLoadingOSM(true)
    setError('')
    setSearched(true)
    setSelected(null)
    setCliniques([])
    setOsmCount(0)
    setMfCount(0)

    const libre = texteLibre.trim()

    // ── 1. Supabase (rapide) ──────────────────────────────────────────────────
    const apiUrl = libre
      ? `/api/search-cliniques?ville=${encodeURIComponent(villeKey)}&q=${encodeURIComponent(libre)}`
      : `/api/search-cliniques?ville=${encodeURIComponent(villeKey)}&specialite=${specialite.value}`

    const mfPromise = fetch(apiUrl).then(r => r.json()).then(data => {
      if (data.success) {
        const mf: Clinique[] = data.cliniques
        setMfCount(mf.length)
        setCliniques(prev => mergeResults(prev, mf, coords.lat, coords.lon))
      }
    }).catch(() => {}).finally(() => setLoadingMF(false))

    // ── 2. Overpass depuis le browser (sans limite de timeout Vercel) ─────────
    const osmPromise = fetchOverpass(coords.lat, coords.lon, 15000, specialite.osmTags, libre || undefined).then(osm => {
      setOsmCount(osm.length)
      setCliniques(prev => mergeResults(prev, osm, coords.lat, coords.lon))
    }).catch(e => {
      console.error('Overpass error:', e)
      setError('OpenStreetMap temporairement indisponible. Résultats MediFlow affichés.')
    }).finally(() => setLoadingOSM(false))

    await Promise.allSettled([mfPromise, osmPromise])
  }, [villeKey, specialite, texteLibre])

  const loading = loadingMF || loadingOSM

  return (
    <main className="min-h-screen bg-[#060D1A]">

      {/* Navbar */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 bg-[#060D1A]/90 backdrop-blur z-40">
        <Link href="/" className="text-2xl font-black text-white">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </Link>
        <Link href="/auth/login"
          className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
          Espace clinique →
        </Link>
      </nav>

      {/* Hero + Search */}
      <div className="px-8 py-14 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
          MediFlow + OpenStreetMap · Cameroun
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Trouvez votre <span className="text-[#00E5A0]">médecin</span>
        </h1>
        <p className="text-white/50 text-lg mb-10">
          Choisissez votre ville et la spécialité pour voir tous les établissements à proximité
        </p>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
          {/* Ville */}
          <select value={villeKey} onChange={e => setVilleKey(e.target.value)}
            className="flex-1 px-4 py-3 text-[#0C1E35] text-sm outline-none rounded-xl bg-[#F4F7FB] cursor-pointer">
            {Object.keys(VILLES).sort().map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Combobox spécialité */}
          <div className="flex-1 relative" ref={comboRef}>
            <button
              type="button"
              onClick={() => { setDropdownOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 10) }}
              className="w-full px-4 py-3 text-[#0C1E35] text-sm rounded-xl bg-[#F4F7FB] flex items-center justify-between gap-2 hover:bg-[#e8edf5] transition-colors"
            >
              <span className="truncate text-left">{comboInput || 'Spécialité…'}</span>
              <ChevronDown className={`w-4 h-4 text-[#0C1E35]/40 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                {/* Input de recherche */}
                <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={comboInput}
                    onChange={e => handleComboChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { setDropdownOpen(false); handleSearch() }
                      if (e.key === 'Escape') setDropdownOpen(false)
                    }}
                    placeholder="Tapez une spécialité… (ex: dialyse, ORL)"
                    className="flex-1 text-sm text-[#0C1E35] outline-none placeholder:text-slate-400 bg-transparent"
                  />
                  {comboInput && (
                    <button type="button" onMouseDown={() => { handleComboChange(''); setSpecialiteIdx(0); setTexteLibre('') }}
                      className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Liste des options */}
                <div className="max-h-60 overflow-y-auto py-1">
                  {filtered.length > 0 ? filtered.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onMouseDown={() => selectOption(item)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2
                        ${!item.isPredef ? 'text-slate-500 italic' : 'text-[#0C1E35]'}
                        ${item.isPredef && item.idx === specialiteIdx && !texteLibre ? 'bg-[#00E5A0]/10 text-[#007A56] font-semibold' : 'hover:bg-[#F4F7FB]'}
                      `}
                    >
                      <span>{item.label}</span>
                      {!item.isPredef && <span className="text-[10px] text-slate-400 font-normal not-italic">Recherche libre</span>}
                    </button>
                  )) : (
                    <button
                      type="button"
                      onMouseDown={() => { setTexteLibre(comboInput); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-[#0C1E35] hover:bg-[#F4F7FB] transition-colors"
                    >
                      Rechercher <strong>&ldquo;{comboInput}&rdquo;</strong>
                      <span className="ml-2 text-xs text-slate-400">Appuyez Entrée</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bouton rechercher */}
          <button onClick={handleSearch} disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#00E5A0] text-[#060D1A] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#00B87D] transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Indicateur de chargement en 2 étapes */}
        {searched && (
          <div className="mt-5 flex items-center justify-center gap-5 text-xs text-white/40">
            <span className={`flex items-center gap-1.5 ${loadingMF ? 'text-white/60' : 'text-white/40'}`}>
              {loadingMF
                ? <Loader2 className="w-3 h-3 animate-spin text-[#00E5A0]" />
                : <span className="w-2.5 h-2.5 rounded-full bg-[#00E5A0]" />
              }
              {loadingMF ? 'MediFlow...' : <><strong className="text-white">{mfCount}</strong> MediFlow</>}
            </span>
            <span className={`flex items-center gap-1.5 ${loadingOSM ? 'text-white/60' : 'text-white/40'}`}>
              {loadingOSM
                ? <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                : <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              }
              {loadingOSM ? 'OpenStreetMap...' : <><strong className="text-white">{osmCount}</strong> OSM</>}
            </span>
            {!loading && (
              <span><strong className="text-white">{cliniques.length}</strong> au total</span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="max-w-5xl mx-auto px-8 mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Résultats */}
      {searched && cliniques.length > 0 && (
        <div className="px-8 pb-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Carte 2/3 */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10" style={{ height: '520px' }}>
              <MapRechercheHybride
                cliniques={cliniques}
                onSelectClinique={setSelected}
                selectedClinique={selected}
              />
            </div>

            {/* Liste 1/3 */}
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '520px' }}>
              <h2 className="text-white font-bold text-sm sticky top-0 bg-[#060D1A] py-1">
                {cliniques.length} résultat{cliniques.length > 1 ? 's' : ''} · {labelRecherche} à {villeKey}
                {loadingOSM && <span className="ml-2 text-white/30 font-normal text-xs">+ OSM en cours...</span>}
              </h2>
              {cliniques.map(c => (
                <button key={c.id} onClick={() => setSelected(c)}
                  className={`text-left bg-white/5 border rounded-2xl p-4 hover:border-[#00E5A0]/40 transition-all ${
                    selected?.id === c.id ? 'border-[#00E5A0]/60 bg-[#00E5A0]/5' : 'border-white/10'
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{c.nom}</p>
                    {c.inscrite
                      ? <span className="flex-shrink-0 flex items-center gap-1 bg-[#00E5A0]/15 border border-[#00E5A0]/30 text-[#00E5A0] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> MediFlow
                        </span>
                      : <span className="flex-shrink-0 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">OSM</span>
                    }
                  </div>
                  {c.adresse && (
                    <p className="text-white/40 text-xs flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{c.adresse}</span>
                    </p>
                  )}
                  {c.telephone && (
                    <p className="text-white/40 text-xs flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3 flex-shrink-0" />{c.telephone}
                    </p>
                  )}
                  {c.distance !== undefined && (
                    <p className="text-white/30 text-xs mt-1">{c.distance.toFixed(1)} km</p>
                  )}
                  {c.inscrite ? (
                    <Link
                      href={`/booking?clinique_id=${c.id}&clinique_nom=${encodeURIComponent(c.nom)}&specialite=${encodeURIComponent(labelRecherche)}`}
                      onClick={e => e.stopPropagation()}
                      className="mt-3 w-full flex items-center justify-center gap-1 bg-[#00E5A0] text-[#060D1A] text-xs font-black py-2 rounded-xl hover:bg-[#00B87D] transition-colors">
                      Prendre RDV <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                      {c.telephone && (
                        <a href={`tel:${c.telephone}`}
                          className="flex-1 flex items-center justify-center gap-1 bg-white/10 border border-white/20 text-white text-xs font-bold py-2 rounded-xl hover:bg-white/20 transition-colors">
                          <Phone className="w-3 h-3" /> Appeler
                        </a>
                      )}
                      <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 bg-white/10 border border-white/20 text-white text-xs font-bold py-2 rounded-xl hover:bg-white/20 transition-colors">
                        <MapPin className="w-3 h-3" /> Maps
                      </a>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {searched && !loading && cliniques.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg">Aucun établissement trouvé pour &ldquo;{labelRecherche}&rdquo; à {villeKey}</p>
          <p className="text-sm mt-2">Essayez une autre ville, une autre spécialité, ou reformulez votre recherche</p>
        </div>
      )}

      {!searched && (
        <div className="text-center pb-16">
          <p className="text-white/20 text-sm">Sélectionnez une ville et une spécialité, puis cliquez sur Rechercher</p>
        </div>
      )}
    </main>
  )
}

// ─── Fusion des résultats (déduplique par nom+distance) ───────────────────────

function mergeResults(existing: Clinique[], incoming: Clinique[], refLat: number, refLon: number): Clinique[] {
  const combined = [...existing]
  for (const c of incoming) {
    const dup = combined.some(e =>
      dice(normStr(c.nom), normStr(e.nom)) > 0.7 &&
      calcDist(c.latitude, c.longitude, e.latitude, e.longitude) < 100
    )
    if (!dup) combined.push(c)
  }
  return combined.sort((a, b) => {
    if (a.inscrite && !b.inscrite) return -1
    if (!a.inscrite && b.inscrite) return 1
    const da = a.distance ?? calcDist(refLat, refLon, a.latitude, a.longitude) / 1000
    const db = b.distance ?? calcDist(refLat, refLon, b.latitude, b.longitude) / 1000
    return da - db
  })
}

