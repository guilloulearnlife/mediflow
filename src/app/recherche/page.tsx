'use client'

import { useState, useCallback, useRef, useEffect, useDeferredValue } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Search, MapPin, Phone, ArrowRight, CheckCircle, Loader2, X, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import ClinicCardSkeleton from '@/components/ClinicCardSkeleton'

const MapRechercheHybride = dynamic(() => import('@/components/MapRechercheHybride'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-white/5">
      <Loader2 className="w-6 h-6 text-[#00E5A0] animate-spin" />
    </div>
  ),
})

// ─── Base de lieux (villes + quartiers) ──────────────────────────────────────

interface Lieu {
  label: string  // affiché
  ville: string  // ville parente (pour le contexte)
  lat: number
  lon: number
}

const LIEUX: Lieu[] = [
  // ── Villes principales ───────────────────────────────────────────────────
  { label: 'Yaoundé',      ville: 'Yaoundé',      lat: 3.8667,  lon: 11.5167 },
  { label: 'Douala',       ville: 'Douala',        lat: 4.0511,  lon: 9.7679  },
  { label: 'Garoua',       ville: 'Garoua',        lat: 9.3017,  lon: 13.3974 },
  { label: 'Bamenda',      ville: 'Bamenda',       lat: 5.9597,  lon: 10.1460 },
  { label: 'Bafoussam',    ville: 'Bafoussam',     lat: 5.4764,  lon: 10.4175 },
  { label: 'Maroua',       ville: 'Maroua',        lat: 10.5918, lon: 14.3158 },
  { label: 'Ngaoundéré',   ville: 'Ngaoundéré',    lat: 7.3167,  lon: 13.5833 },
  { label: 'Bertoua',      ville: 'Bertoua',       lat: 4.5797,  lon: 13.6853 },
  { label: 'Ebolowa',      ville: 'Ebolowa',       lat: 2.9000,  lon: 11.1500 },
  { label: 'Kribi',        ville: 'Kribi',         lat: 2.9400,  lon: 9.9100  },
  { label: 'Limbé',        ville: 'Limbé',         lat: 4.0203,  lon: 9.1997  },
  { label: 'Buéa',         ville: 'Buéa',          lat: 4.1527,  lon: 9.2369  },
  { label: 'Dschang',      ville: 'Dschang',       lat: 5.4500,  lon: 10.0500 },
  { label: 'Kumba',        ville: 'Kumba',         lat: 4.6364,  lon: 9.4469  },
  { label: 'Foumban',      ville: 'Foumban',       lat: 5.7264,  lon: 10.9067 },
  { label: 'Edéa',         ville: 'Edéa',          lat: 3.7997,  lon: 10.1333 },
  { label: 'Mbalmayo',     ville: 'Mbalmayo',      lat: 3.5167,  lon: 11.5000 },
  { label: 'Nkongsamba',   ville: 'Nkongsamba',    lat: 4.9500,  lon: 9.9333  },
  { label: 'Bafia',        ville: 'Bafia',         lat: 4.7497,  lon: 11.2333 },
  { label: 'Mbouda',       ville: 'Mbouda',        lat: 5.6333,  lon: 10.2500 },

  // ── Quartiers Yaoundé ────────────────────────────────────────────────────
  { label: 'Bastos',           ville: 'Yaoundé', lat: 3.8847,  lon: 11.5114 },
  { label: 'Nlongkak',         ville: 'Yaoundé', lat: 3.8789,  lon: 11.5028 },
  { label: 'Essos',            ville: 'Yaoundé', lat: 3.8570,  lon: 11.5320 },
  { label: 'Biyem-Assi',       ville: 'Yaoundé', lat: 3.8333,  lon: 11.5000 },
  { label: 'Mimboman',         ville: 'Yaoundé', lat: 3.8456,  lon: 11.5489 },
  { label: 'Mvog-Mbi',         ville: 'Yaoundé', lat: 3.8580,  lon: 11.5220 },
  { label: 'Elig-Edzoa',       ville: 'Yaoundé', lat: 3.8700,  lon: 11.5050 },
  { label: 'Nkolbisson',       ville: 'Yaoundé', lat: 3.8833,  lon: 11.4667 },
  { label: 'Mfandena',         ville: 'Yaoundé', lat: 3.8619,  lon: 11.5006 },
  { label: 'Mvolyé',           ville: 'Yaoundé', lat: 3.8417,  lon: 11.5167 },
  { label: 'Nsimeyong',        ville: 'Yaoundé', lat: 3.8297,  lon: 11.5167 },
  { label: 'Emana',            ville: 'Yaoundé', lat: 3.9128,  lon: 11.5322 },
  { label: 'Olembe',           ville: 'Yaoundé', lat: 3.9217,  lon: 11.5058 },
  { label: 'Odza',             ville: 'Yaoundé', lat: 3.8344,  lon: 11.5597 },
  { label: 'Ekounou',          ville: 'Yaoundé', lat: 3.8311,  lon: 11.5422 },
  { label: 'Tsinga',           ville: 'Yaoundé', lat: 3.8753,  lon: 11.5056 },
  { label: 'Omnisports',       ville: 'Yaoundé', lat: 3.8694,  lon: 11.5178 },
  { label: 'Mendong',          ville: 'Yaoundé', lat: 3.8167,  lon: 11.4833 },
  { label: 'Djoungolo',        ville: 'Yaoundé', lat: 3.8694,  lon: 11.5353 },
  { label: 'Nkol-Eton',        ville: 'Yaoundé', lat: 3.8542,  lon: 11.5397 },
  { label: 'Ngousso',          ville: 'Yaoundé', lat: 3.8861,  lon: 11.5369 },
  { label: 'Mokolo',           ville: 'Yaoundé', lat: 3.8794,  lon: 11.5233 },
  { label: 'Elig-Essono',      ville: 'Yaoundé', lat: 3.8678,  lon: 11.5183 },
  { label: 'Obili',            ville: 'Yaoundé', lat: 3.8500,  lon: 11.4989 },
  { label: 'Santa Barbara',    ville: 'Yaoundé', lat: 3.8597,  lon: 11.5072 },
  { label: 'Mvog-Betsi',       ville: 'Yaoundé', lat: 3.8475,  lon: 11.4933 },
  { label: 'Nkoldongo',        ville: 'Yaoundé', lat: 3.8272,  lon: 11.5028 },
  { label: 'Biteng',           ville: 'Yaoundé', lat: 3.8833,  lon: 11.4500 },
  { label: 'Soa',              ville: 'Yaoundé', lat: 3.9667,  lon: 11.5667 },
  { label: 'Etoug-Ebe',        ville: 'Yaoundé', lat: 3.8564,  lon: 11.4872 },
  { label: 'Messa',            ville: 'Yaoundé', lat: 3.8894,  lon: 11.5242 },

  // ── Quartiers Douala ─────────────────────────────────────────────────────
  { label: 'Akwa',             ville: 'Douala', lat: 4.0511,  lon: 9.7072  },
  { label: 'Bonanjo',          ville: 'Douala', lat: 4.0453,  lon: 9.6978  },
  { label: 'Bonaberi',         ville: 'Douala', lat: 4.0658,  lon: 9.6800  },
  { label: 'Bali',             ville: 'Douala', lat: 4.0583,  lon: 9.7100  },
  { label: 'Deido',            ville: 'Douala', lat: 4.0667,  lon: 9.7178  },
  { label: 'New Bell',         ville: 'Douala', lat: 4.0558,  lon: 9.7289  },
  { label: 'Bonapriso',        ville: 'Douala', lat: 4.0381,  lon: 9.7069  },
  { label: 'Makepe',           ville: 'Douala', lat: 4.0728,  lon: 9.7544  },
  { label: 'Kotto',            ville: 'Douala', lat: 4.0361,  lon: 9.7733  },
  { label: 'Logbessou',        ville: 'Douala', lat: 4.0783,  lon: 9.7769  },
  { label: 'Ndogbong',         ville: 'Douala', lat: 4.0872,  lon: 9.7456  },
  { label: 'Ndog-Passi',       ville: 'Douala', lat: 4.0611,  lon: 9.7644  },
  { label: 'Mboppi',           ville: 'Douala', lat: 4.0478,  lon: 9.7367  },
  { label: 'Cité des Palmiers', ville: 'Douala', lat: 4.0694,  lon: 9.7478  },
  { label: 'Bassa',            ville: 'Douala', lat: 4.0219,  lon: 9.7561  },
  { label: 'Nylon',            ville: 'Douala', lat: 4.0806,  lon: 9.7089  },
  { label: 'Nyalla',           ville: 'Douala', lat: 4.0161,  lon: 9.7889  },
  { label: 'Pk11',             ville: 'Douala', lat: 4.0044,  lon: 9.8000  },
  { label: 'Pk14',             ville: 'Douala', lat: 3.9811,  lon: 9.8222  },
  { label: 'Yassa',            ville: 'Douala', lat: 4.0000,  lon: 9.8333  },
  { label: 'Ngodi-Bakoko',     ville: 'Douala', lat: 4.0894,  lon: 9.7267  },
  { label: 'Denver',           ville: 'Douala', lat: 4.0561,  lon: 9.7433  },
  { label: 'Village',          ville: 'Douala', lat: 4.0344,  lon: 9.7233  },
  { label: 'Beedi',            ville: 'Douala', lat: 4.0261,  lon: 9.7189  },
  { label: 'Mabanda',          ville: 'Douala', lat: 4.0133,  lon: 9.7311  },

  // ── Quartiers Garoua ─────────────────────────────────────────────────────
  { label: 'Marouaré',         ville: 'Garoua', lat: 9.2978,  lon: 13.3908 },
  { label: 'Roumdé Adjia',     ville: 'Garoua', lat: 9.3100,  lon: 13.4022 },
  { label: 'Lopéré',           ville: 'Garoua', lat: 9.3056,  lon: 13.3817 },

  // ── Quartiers Bafoussam ──────────────────────────────────────────────────
  { label: 'Kamkop',           ville: 'Bafoussam', lat: 5.4789,  lon: 10.4200 },
  { label: 'Famla',            ville: 'Bafoussam', lat: 5.4694,  lon: 10.4094 },

  // ── Quartiers Bamenda ────────────────────────────────────────────────────
  { label: 'Up Station',       ville: 'Bamenda', lat: 5.9611,  lon: 10.1456 },
  { label: 'Commercial Ave',   ville: 'Bamenda', lat: 5.9567,  lon: 10.1478 },
]

// ─── Spécialités (pills — pas de dropdown) ───────────────────────────────────

const SPECIALITES = [
  { value: 'all',            label: 'Tous',                  osmTags: ['amenity=hospital','amenity=clinic','amenity=doctors','amenity=pharmacy'] },
  { value: 'hospital',       label: 'Hôpitaux',              osmTags: ['amenity=hospital'] },
  { value: 'clinique',       label: 'Cliniques',             osmTags: ['amenity=clinic','amenity=doctors'] },
  { value: 'urgences',       label: 'Urgences',              osmTags: ['amenity=hospital'] },
  { value: 'pharmacie',      label: 'Pharmacies',            osmTags: ['amenity=pharmacy'] },
  { value: 'dentiste',       label: 'Dentistes',             osmTags: ['healthcare=dentist','amenity=dentist','amenity=clinic'] },
  { value: 'laboratoire',    label: 'Laboratoires',          osmTags: ['healthcare=laboratory','amenity=clinic'] },
  { value: 'maternite',      label: 'Maternités',            osmTags: ['healthcare=midwife','amenity=maternity','amenity=hospital'] },
  { value: 'pediatrie',      label: 'Pédiatrie',             osmTags: ['healthcare=paediatrician','amenity=clinic','amenity=hospital'] },
  { value: 'gynecologie',    label: 'Gynécologie',           osmTags: ['healthcare=gynaecologist','amenity=clinic','amenity=hospital'] },
  { value: 'cardiologie',    label: 'Cardiologie',           osmTags: ['healthcare=cardiologist','amenity=hospital','amenity=clinic'] },
  { value: 'ophtalmologie',  label: 'Ophtalmologie',         osmTags: ['healthcare=optometrist','amenity=clinic','amenity=hospital'] },
  { value: 'dermatologie',   label: 'Dermatologie',          osmTags: ['healthcare=dermatologist','amenity=clinic','amenity=hospital'] },
  { value: 'radiologie',     label: 'Radiologie',            osmTags: ['healthcare=radiologist','healthcare=laboratory','amenity=hospital'] },
  { value: 'kinesitherapie', label: 'Kinésithérapie',        osmTags: ['healthcare=physiotherapist','amenity=clinic'] },
  { value: 'dialyse',        label: 'Dialyse',               osmTags: ['healthcare=dialysis','amenity=hospital','amenity=clinic'] },
  { value: 'orl',            label: 'ORL',                   osmTags: ['amenity=clinic','amenity=hospital'] },
  { value: 'neurologie',     label: 'Neurologie',            osmTags: ['amenity=hospital','amenity=clinic'] },
]

const RAYONS = [2, 5, 10, 20, 50]

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
  medecins?: { id: string; nom: string | null; prenom: string | null }[]
  slots_disponibles?: number
}

interface LocationCoords { lat: number; lon: number; label: string }

// ─── Nominatim autocomplete (debounced) ──────────────────────────────────────

async function fetchNominatimSuggestions(query: string): Promise<Lieu[]> {
  if (query.length < 2) return []
  try {
    const q = encodeURIComponent(`${query} Cameroun`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=cm&accept-language=fr`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data as Array<{ display_name: string; lat: string; lon: string; type: string }>)
      .filter(d => d.display_name)
      .map(d => {
        const parts = d.display_name.split(',')
        const label = parts[0]?.trim() ?? d.display_name
        const ville = parts[1]?.trim() ?? ''
        return { label, ville, lat: parseFloat(d.lat), lon: parseFloat(d.lon) }
      })
  } catch {
    return []
  }
}

// ─── Géolocalisation GPS ──────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`)
    const data = await res.json()
    return data.address?.suburb ?? data.address?.city_district ?? data.address?.quarter ?? data.address?.city ?? 'Ma position'
  } catch {
    return 'Ma position'
  }
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3, toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '')
}

function dice(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const s1 = new Set(Array.from({length:a.length-1},(_,i)=>a.slice(i,i+2)))
  const s2 = new Set(Array.from({length:b.length-1},(_,i)=>b.slice(i,i+2)))
  const inter = [...s1].filter(x=>s2.has(x)).length
  return (2*inter)/(s1.size+s2.size)
}

// ─── Overpass ────────────────────────────────────────────────────────────────

function buildOverpassQuery(lat: number, lon: number, rayon: number, osmTags: string[]): string {
  const blocks = osmTags.flatMap(tag => {
    const [k, v] = tag.split('=')
    return [`node["${k}"="${v}"](around:${rayon},${lat},${lon});`, `way["${k}"="${v}"](around:${rayon},${lat},${lon});`]
  }).join('\n')
  return `[out:json][timeout:20];\n(\n${blocks}\n);\nout body center;`
}

function buildOverpassQueryLibre(lat: number, lon: number, rayon: number, terme: string): string {
  const safe = terme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `[out:json][timeout:20];
(
  node["name"~"${safe}",i]["amenity"~"hospital|clinic|doctors|pharmacy"](around:${rayon},${lat},${lon});
  way["name"~"${safe}",i]["amenity"~"hospital|clinic|doctors|pharmacy"](around:${rayon},${lat},${lon});
  node["healthcare:speciality"~"${safe}",i](around:${rayon},${lat},${lon});
  way["healthcare:speciality"~"${safe}",i](around:${rayon},${lat},${lon});
);
out body center;`
}

async function fetchOverpass(lat: number, lon: number, rayon: number, osmTags: string[], texteLibre?: string): Promise<Clinique[]> {
  const tryQuery = async (query: string): Promise<Clinique[]> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 22000)
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
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
            id: `osm_${e.type}_${e.id}`, nom: tags.name,
            adresse: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
            ville: tags['addr:city'] ?? '', latitude: elLat, longitude: elLon,
            telephone: tags['contact:phone'] ?? tags.phone, source: 'openstreetmap' as const, inscrite: false,
            specialites: [tags.amenity, tags.healthcare, tags['healthcare:speciality']].filter(Boolean) as string[],
            distance: calcDist(lat, lon, elLat, elLon) / 1000,
          }
        })
        .filter((c: Clinique) => c.latitude !== 0 && c.longitude !== 0)
    } catch { return [] } finally { clearTimeout(timer) }
  }
  if (texteLibre && texteLibre.trim().length >= 2) {
    const r = await tryQuery(buildOverpassQueryLibre(lat, lon, rayon, texteLibre.trim()))
    return r.length ? r : tryQuery(buildOverpassQuery(lat, lon, rayon, ['amenity=hospital','amenity=clinic','amenity=doctors']))
  }
  const r = await tryQuery(buildOverpassQuery(lat, lon, rayon, osmTags))
  return r.length ? r : tryQuery(buildOverpassQuery(lat, lon, rayon, ['amenity=hospital','amenity=clinic','amenity=doctors']))
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RecherchePage() {
  // ── Location ───────────────────────────────────────────────────────────────
  const [locationInput, setLocationInput]     = useState('')
  const [locationCoords, setLocationCoords]   = useState<LocationCoords | null>(null)
  const [suggestions, setSuggestions]         = useState<Lieu[]>([])
  const [showSugg, setShowSugg]               = useState(false)
  const [geocoding, setGeocoding]             = useState(false)
  const locRef                                = useRef<HTMLDivElement>(null)
  const debounceRef                           = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Spécialité (pills) ────────────────────────────────────────────────────
  const [specialiteIdx, setSpecialiteIdx]     = useState(0) // 'Tous' par défaut
  const [texteLibre, setTexteLibre]           = useState('')
  const [searchExtra, setSearchExtra]         = useState('')

  // ── Rayon ──────────────────────────────────────────────────────────────────
  const [rayon, setRayon]                     = useState(10)

  // ── Résultats ─────────────────────────────────────────────────────────────
  const [loadingMF, setLoadingMF]             = useState(false)
  const [loadingOSM, setLoadingOSM]           = useState(false)
  const [cliniques, setCliniques]             = useState<Clinique[]>([])
  const [osmCount, setOsmCount]               = useState(0)
  const [mfCount, setMfCount]                 = useState(0)
  const [error, setError]                     = useState('')
  const [selected, setSelected]               = useState<Clinique | null>(null)
  const [searched, setSearched]               = useState(false)

  const deferredInput = useDeferredValue(locationInput)

  // ── Fermer suggestions si clic extérieur ─────────────────────────────────
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setShowSugg(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // ── Autocomplétion : statique + Nominatim debounced ───────────────────────
  useEffect(() => {
    const query = deferredInput.trim()
    if (!query || query.length < 1) { setSuggestions([]); setShowSugg(false); return }

    // 1. Filtre instantané sur LIEUX statiques
    const n = normStr(query)
    const staticMatches = LIEUX.filter(l =>
      normStr(l.label).startsWith(n) || normStr(l.label).includes(n) || normStr(l.ville).includes(n)
    ).slice(0, 8)

    setSuggestions(staticMatches)
    setShowSugg(staticMatches.length > 0)

    // 2. Nominatim debounced (si < 4 résultats statiques)
    if (staticMatches.length < 4 && query.length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        const dynamic = await fetchNominatimSuggestions(query)
        setSuggestions(prev => {
          // Fusionne en évitant les doublons par label normalisé
          const existing = new Set(prev.map(l => normStr(l.label)))
          const newOnes = dynamic.filter(d => !existing.has(normStr(d.label)))
          return [...prev, ...newOnes].slice(0, 8)
        })
        setShowSugg(true)
      }, 400)
    }
  }, [deferredInput])

  // ── Sélection d'un lieu ───────────────────────────────────────────────────
  function selectLieu(lieu: Lieu) {
    const label = lieu.ville && lieu.ville !== lieu.label ? `${lieu.label}, ${lieu.ville}` : lieu.label
    setLocationInput(label)
    setLocationCoords({ lat: lieu.lat, lon: lieu.lon, label })
    setSuggestions([])
    setShowSugg(false)
  }

  // ── GPS ───────────────────────────────────────────────────────────────────
  function useGPS() {
    if (!navigator.geolocation) return
    setGeocoding(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        const label = await reverseGeocode(lat, lon)
        setLocationInput(label)
        setLocationCoords({ lat, lon, label })
        setGeocoding(false)
      },
      () => setGeocoding(false),
      { timeout: 8000 }
    )
  }

  const specialite = SPECIALITES[specialiteIdx]
  const labelRecherche = texteLibre.trim() || searchExtra.trim() || specialite.label

  // ── Recherche ─────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    // Résoudre coords si pas encore sélectionné
    let coords = locationCoords
    if (!coords && locationInput.trim()) {
      setGeocoding(true)
      const lieu = LIEUX.find(l => normStr(l.label) === normStr(locationInput.trim()))
      if (lieu) {
        const label = lieu.ville && lieu.ville !== lieu.label ? `${lieu.label}, ${lieu.ville}` : lieu.label
        coords = { lat: lieu.lat, lon: lieu.lon, label }
      } else {
        const dynamic = await fetchNominatimSuggestions(locationInput.trim())
        if (dynamic.length > 0) {
          coords = { lat: dynamic[0].lat, lon: dynamic[0].lon, label: locationInput.trim() }
        }
      }
      setGeocoding(false)
      if (!coords) {
        setError(`Lieu introuvable : "${locationInput}". Essayez un nom de ville ou quartier.`)
        return
      }
      setLocationCoords(coords)
    }

    if (!coords) {
      setError('Entrez une ville ou un quartier pour commencer la recherche.')
      return
    }

    setLoadingMF(true)
    setLoadingOSM(true)
    setError('')
    setSearched(true)
    setSelected(null)
    setCliniques([])
    setOsmCount(0)
    setMfCount(0)

    const rayonMetres = rayon * 1000
    const libre = texteLibre.trim() || searchExtra.trim()

    // ── MediFlow API ────────────────────────────────────────────────────────
    const apiUrl = libre
      ? `/api/search-cliniques?lat=${coords.lat}&lon=${coords.lon}&rayon=${rayon}&q=${encodeURIComponent(libre)}`
      : `/api/search-cliniques?lat=${coords.lat}&lon=${coords.lon}&rayon=${rayon}&specialite=${specialite.value}`

    const mfPromise = fetch(apiUrl).then(r => r.json()).then(data => {
      if (data.success) {
        const mf: Clinique[] = data.cliniques.map((c: Clinique) => ({
          ...c, distance: calcDist(coords!.lat, coords!.lon, c.latitude, c.longitude) / 1000,
        }))
        setMfCount(mf.length)
        setCliniques(prev => mergeResults(prev, mf, coords!.lat, coords!.lon))
      }
    }).catch(() => {
      toast.error('Erreur lors du chargement des cliniques MediFlow')
    }).finally(() => setLoadingMF(false))

    // ── Overpass OSM via API route (cache Supabase 24h) ────────────────────
    const osmUrl = libre
      ? `/api/osm-cliniques?lat=${coords.lat}&lon=${coords.lon}&rayon=${rayon}&specialite=all&osmTags=${encodeURIComponent('amenity=hospital,amenity=clinic,amenity=doctors,amenity=pharmacy')}`
      : `/api/osm-cliniques?lat=${coords.lat}&lon=${coords.lon}&rayon=${rayon}&specialite=${specialite.value}&osmTags=${encodeURIComponent(specialite.osmTags.join(','))}`

    const osmPromise = fetch(osmUrl).then(r => r.json()).then(data => {
      if (data.success) {
        const osm: Clinique[] = (data.cliniques ?? []).map((c: Clinique) => ({
          ...c,
          distance: calcDist(coords!.lat, coords!.lon, c.latitude, c.longitude) / 1000,
        }))
        setOsmCount(osm.length)
        setCliniques(prev => mergeResults(prev, osm, coords!.lat, coords!.lon))
      }
    }).catch(() => {
      toast.error('OpenStreetMap temporairement indisponible')
    }).finally(() => setLoadingOSM(false))

    await Promise.allSettled([mfPromise, osmPromise])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationInput, locationCoords, rayon, specialite, texteLibre, searchExtra])

  const loading = loadingMF || loadingOSM || geocoding

  return (
    <main className="min-h-screen bg-[#060D1A]">

      {/* Navbar */}
      <nav className="border-b border-white/10 px-6 md:px-8 py-4 flex items-center justify-between sticky top-0 bg-[#060D1A]/90 backdrop-blur z-40">
        <Link href="/" className="text-2xl font-black text-white">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </Link>
        <Link href="/auth/login"
          className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
          Espace clinique →
        </Link>
      </nav>

      {/* Hero + Search */}
      <div className="px-6 md:px-8 py-12 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
          MediFlow + OpenStreetMap · Cameroun
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
          Trouvez votre <span className="text-[#00E5A0]">médecin</span>
        </h1>
        <p className="text-white/50 mb-10">
          Tapez votre ville ou quartier, choisissez la spécialité et le rayon
        </p>

        <div className="max-w-2xl mx-auto space-y-4">

          {/* ── Barre localisation + bouton ── */}
          <div className="bg-white rounded-2xl p-2 flex gap-2 shadow-2xl">
            <div className="flex-1 relative" ref={locRef}>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F4F7FB] rounded-xl h-full">
                <MapPin className="w-4 h-4 text-[#00E5A0] flex-shrink-0" />
                <input
                  type="text"
                  value={locationInput}
                  onChange={e => { setLocationInput(e.target.value); setLocationCoords(null) }}
                  onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setShowSugg(false); handleSearch() }
                    if (e.key === 'Escape') setShowSugg(false)
                  }}
                  placeholder="Yaoundé, Bastos, Akwa, Douala Bali…"
                  className="flex-1 text-sm text-[#0C1E35] outline-none placeholder:text-[#0C1E35]/40 bg-transparent min-w-0"
                  autoComplete="off"
                />
                {locationInput && (
                  <button type="button" onClick={() => { setLocationInput(''); setLocationCoords(null); setSuggestions([]); setShowSugg(false) }}
                    className="text-[#0C1E35]/30 hover:text-[#0C1E35]/70 transition-colors flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {geocoding
                  ? <Loader2 className="w-4 h-4 text-[#00E5A0] animate-spin flex-shrink-0" />
                  : (
                    <button type="button" onClick={useGPS} title="Utiliser ma position GPS"
                      className="text-[#0C1E35]/40 hover:text-[#00E5A0] transition-colors flex-shrink-0">
                      <Navigation className="w-4 h-4" />
                    </button>
                  )
                }
              </div>

              {/* Suggestions */}
              {showSugg && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                  {suggestions.map((lieu, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectLieu(lieu)}
                      className="w-full text-left px-4 py-3 text-sm text-[#0C1E35] hover:bg-[#F4F7FB] flex items-center gap-3 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#00E5A0] flex-shrink-0" />
                      <span>
                        <span className="font-medium">{lieu.label}</span>
                        {lieu.ville && lieu.ville !== lieu.label && (
                          <span className="text-[#0C1E35]/40 ml-1.5">{lieu.ville}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSearch} disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#00E5A0] text-[#060D1A] px-5 py-3 rounded-xl font-black text-sm hover:bg-[#00B87D] transition-colors disabled:opacity-60 flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">{loading ? 'Recherche...' : 'Rechercher'}</span>
            </button>
          </div>

          {/* ── Spécialité — pills horizontaux (scroll) ── */}
          <div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
              {SPECIALITES.map((s, i) => (
                <button
                  key={s.value}
                  onClick={() => { setSpecialiteIdx(i); setTexteLibre(''); setSearchExtra('') }}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all snap-start ${
                    specialiteIdx === i && !texteLibre && !searchExtra
                      ? 'bg-[#00E5A0] text-[#060D1A]'
                      : 'bg-white/8 border border-white/10 text-white/60 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              {/* Champ texte libre inline */}
              <div className="flex-shrink-0 relative flex items-center bg-white/8 border border-white/10 rounded-full px-3.5 py-1.5">
                <Search className="w-3 h-3 text-white/40 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchExtra}
                  onChange={e => { setSearchExtra(e.target.value); if (e.target.value) setTexteLibre(e.target.value) }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Autre…"
                  className="text-xs text-white outline-none placeholder:text-white/30 bg-transparent w-20"
                />
              </div>
            </div>
          </div>

          {/* ── Rayon ── */}
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <span className="text-white/30 text-xs">Rayon :</span>
            {RAYONS.map(r => (
              <button key={r} onClick={() => setRayon(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rayon === r
                    ? 'bg-[#00E5A0] text-[#060D1A]'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                }`}>
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Statut chargement */}
        {searched && (
          <div className="mt-5 flex items-center justify-center gap-5 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              {loadingMF ? <Loader2 className="w-3 h-3 animate-spin text-[#00E5A0]" /> : <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />}
              {loadingMF ? 'MediFlow...' : <><strong className="text-white">{mfCount}</strong> MediFlow</>}
            </span>
            <span className="flex items-center gap-1.5">
              {loadingOSM ? <Loader2 className="w-3 h-3 animate-spin text-blue-400" /> : <span className="w-2 h-2 rounded-full bg-blue-400" />}
              {loadingOSM ? 'OpenStreetMap...' : <><strong className="text-white">{osmCount}</strong> OSM</>}
            </span>
            {!loading && <span><strong className="text-white">{cliniques.length}</strong> au total</span>}
          </div>
        )}
      </div>

      {error && (
        <div className="max-w-5xl mx-auto px-8 mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl text-sm">{error}</div>
        </div>
      )}

      {/* Résultats */}
      {searched && cliniques.length > 0 && (
        <div className="px-6 md:px-8 pb-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10" style={{ height: '520px' }}>
              <MapRechercheHybride cliniques={cliniques} onSelectClinique={setSelected} selectedClinique={selected} />
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '520px' }}>
              <h2 className="text-white font-bold text-sm sticky top-0 bg-[#060D1A] py-1">
                {cliniques.length} résultat{cliniques.length > 1 ? 's' : ''}
                <span className="text-white/40 font-normal ml-1">· {labelRecherche} · {rayon} km{locationCoords ? ` de ${locationCoords.label}` : ''}</span>
                {loadingOSM && <span className="ml-2 text-white/30 font-normal text-xs">+ OSM en cours...</span>}
              </h2>
              {loadingMF && cliniques.length === 0 && (
                <>
                  {[...Array(4)].map((_, i) => <ClinicCardSkeleton key={i} />)}
                </>
              )}
              {cliniques.map(c => (
                <button key={c.id} onClick={() => setSelected(c)}
                  className={`text-left bg-white/5 border rounded-2xl p-4 hover:border-[#00E5A0]/40 transition-all ${selected?.id === c.id ? 'border-[#00E5A0]/60 bg-[#00E5A0]/5' : 'border-white/10'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{c.nom}</p>
                    {c.inscrite
                      ? <span className="flex-shrink-0 flex items-center gap-1 bg-[#00E5A0]/15 border border-[#00E5A0]/30 text-[#00E5A0] text-[10px] font-bold px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> MediFlow</span>
                      : <span className="flex-shrink-0 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">OSM</span>
                    }
                  </div>
                  {c.adresse && <p className="text-white/40 text-xs flex items-center gap-1 mb-1"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{c.adresse}</span></p>}
                  {c.telephone && <p className="text-white/40 text-xs flex items-center gap-1 mb-1"><Phone className="w-3 h-3 flex-shrink-0" />{c.telephone}</p>}
                  {c.distance !== undefined && <p className="text-white/30 text-xs mt-1">{c.distance.toFixed(1)} km</p>}
                  {c.inscrite && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {c.medecins && c.medecins.length > 0 && (
                        <div className="flex items-center gap-1">
                          {c.medecins.slice(0, 3).map(m => (
                            <div key={m.id} title={`Dr. ${m.prenom ?? ''} ${m.nom ?? ''}`.trim()}
                              className="w-5 h-5 rounded-full bg-[#00E5A0]/20 border border-[#00E5A0]/30 flex items-center justify-center text-[8px] font-bold text-[#00E5A0]">
                              {`${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}`.toUpperCase() || '?'}
                            </div>
                          ))}
                          <span className="text-white/40 text-[10px] ml-1">{c.medecins.length} médecin{c.medecins.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {c.slots_disponibles !== undefined && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.slots_disponibles > 0 ? 'bg-[#00E5A0]/10 text-[#00E5A0]' : 'bg-white/5 text-white/30'}`}>
                          {c.slots_disponibles > 0 ? `${c.slots_disponibles} créneaux libres` : 'Complet aujourd\'hui'}
                        </span>
                      )}
                    </div>
                  )}
                  {c.inscrite ? (
                    <Link href={`/booking?clinique_id=${c.id}&clinique_nom=${encodeURIComponent(c.nom)}&specialite=${encodeURIComponent(labelRecherche)}`}
                      onClick={e => e.stopPropagation()}
                      className="mt-3 w-full flex items-center justify-center gap-1 bg-[#00E5A0] text-[#060D1A] text-xs font-black py-2 rounded-xl hover:bg-[#00B87D] transition-colors">
                      Prendre RDV <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                      {c.telephone && (
                        <a href={`tel:${c.telephone}`} className="flex-1 flex items-center justify-center gap-1 bg-white/10 border border-white/20 text-white text-xs font-bold py-2 rounded-xl hover:bg-white/20 transition-colors">
                          <Phone className="w-3 h-3" /> Appeler
                        </a>
                      )}
                      <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer"
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
          <p className="text-lg">Aucun résultat pour &ldquo;{labelRecherche}&rdquo;</p>
          {locationCoords && <p className="text-sm mt-1">à {rayon} km de {locationCoords.label}</p>}
          <p className="text-sm mt-2 text-white/20">Essayez un rayon plus grand ou une autre spécialité</p>
        </div>
      )}

      {!searched && (
        <div className="text-center pb-16 text-white/20 text-sm">
          Tapez un quartier ou une ville, choisissez une spécialité et lancez la recherche
        </div>
      )}
    </main>
  )
}

// ─── Fusion des résultats ─────────────────────────────────────────────────────

function mergeResults(existing: Clinique[], incoming: Clinique[], refLat: number, refLon: number): Clinique[] {
  const combined = [...existing]
  for (const c of incoming) {
    const dupIdx = combined.findIndex(e =>
      dice(normStr(c.nom), normStr(e.nom)) > 0.7 &&
      calcDist(c.latitude, c.longitude, e.latitude, e.longitude) < 100
    )
    if (dupIdx === -1) combined.push(c)
    else if (c.inscrite && !combined[dupIdx].inscrite) combined[dupIdx] = c
  }
  return combined.sort((a, b) => {
    if (a.inscrite && !b.inscrite) return -1
    if (!a.inscrite && b.inscrite) return 1
    const da = a.distance ?? calcDist(refLat, refLon, a.latitude, a.longitude) / 1000
    const db = b.distance ?? calcDist(refLat, refLon, b.latitude, b.longitude) / 1000
    return da - db
  })
}
