import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// ============================================================================
// TYPES
// ============================================================================

interface OSMElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: {
    name?: string
    'addr:street'?: string
    'addr:housenumber'?: string
    'addr:city'?: string
    'contact:phone'?: string
    phone?: string
    'contact:email'?: string
    email?: string
    website?: string
    opening_hours?: string
    amenity?: string
    healthcare?: string
    'healthcare:speciality'?: string
    [key: string]: string | undefined
  }
}

interface OverpassResponse {
  elements: OSMElement[]
}

interface CliniqueUnifiee {
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
  actif: boolean
  inscrite: boolean
  osm_id?: number
  osm_type?: string
  specialites?: string[]
  horaires?: Record<string, unknown> | null
  distance?: number
}

// ============================================================================
// COORDONNÉES PRÉ-CACHÉES — élimine l'appel Nominatim pour les villes connues
// ============================================================================

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
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
  'Tignère':       { lat: 7.3667,  lon: 12.6500 },
  'Yokadouma':     { lat: 3.5167,  lon: 15.0500 },
  'Abong-Mbang':   { lat: 3.9833,  lon: 13.1833 },
  'Melong':        { lat: 5.1167,  lon: 9.9500  },
  'Bafang':        { lat: 5.1500,  lon: 10.1833 },
  'Nanga-Eboko':   { lat: 4.6833,  lon: 12.3667 },
}

// ============================================================================
// MAPPING SPÉCIALITÉS → TAGS OSM
// Chaque spécialité a des tags primaires + des tags de fallback (tous établissements)
// ============================================================================

const SPECIALITE_OSM: Record<string, { primary: string[]; fallback: string[] }> = {
  'hospital':       { primary: ['amenity=hospital'],              fallback: [] },
  'clinique':       { primary: ['amenity=clinic', 'amenity=doctors'], fallback: ['amenity=hospital'] },
  'pharmacie':      { primary: ['amenity=pharmacy'],              fallback: [] },
  'dentiste':       { primary: ['healthcare=dentist', 'amenity=dentist'], fallback: ['amenity=clinic', 'amenity=hospital'] },
  'laboratoire':    { primary: ['healthcare=laboratory', 'amenity=laboratory'], fallback: ['amenity=clinic', 'amenity=hospital'] },
  'maternite':      { primary: ['healthcare=midwife', 'amenity=maternity'], fallback: ['amenity=hospital', 'amenity=clinic'] },
  'ophtalmologie':  { primary: ['healthcare=optometrist', 'amenity=optometrist'], fallback: ['amenity=clinic', 'amenity=hospital'] },
  'pediatrie':      { primary: ['healthcare=paediatrician'],      fallback: ['amenity=clinic', 'amenity=hospital'] },
  'gynecologie':    { primary: ['healthcare=gynaecologist'],      fallback: ['amenity=clinic', 'amenity=hospital'] },
  'cardiologie':    { primary: ['healthcare=cardiologist'],       fallback: ['amenity=hospital', 'amenity=clinic'] },
  'dermatologie':   { primary: ['healthcare=dermatologist'],      fallback: ['amenity=clinic', 'amenity=hospital'] },
  'radiologie':     { primary: ['healthcare=radiologist', 'healthcare=laboratory'], fallback: ['amenity=hospital'] },
  'urgences':       { primary: ['amenity=hospital'],              fallback: [] },
  'kinesitherapie': { primary: ['healthcare=physiotherapist'],    fallback: ['amenity=clinic'] },
  'all':            { primary: ['amenity=hospital', 'amenity=clinic', 'amenity=doctors', 'amenity=pharmacy'], fallback: [] },
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ville     = searchParams.get('ville')     || 'Yaoundé'
    const specialite = searchParams.get('specialite') || 'hospital'
    const rayon     = Math.min(parseInt(searchParams.get('rayon') || '15000'), 30000)

    // 1. CLINIQUES MEDIFLOW (Supabase) — parallèle avec OSM
    const supabase = await createClient()
    const supabasePromise = supabase
      .from('cliniques')
      .select('*')
      .eq('actif', true)
      .ilike('ville', `%${ville}%`)

    // 2. COORDONNÉES VILLE — cache en premier, Nominatim en fallback
    const coords = CITY_COORDS[ville] ?? await getCityCoordinates(ville)

    // 3. RECHERCHE OSM (seulement si coordonnées disponibles)
    let cliniquesOSM: CliniqueUnifiee[] = []
    if (coords) {
      cliniquesOSM = await searchOverpass(coords.lat, coords.lon, rayon, specialite)
    }

    // 4. RÉSULTATS SUPABASE
    const { data: cliniquesMediaflow } = await supabasePromise

    // 5. FUSION + DÉDUPLICATION
    const merged = mergeAndDeduplicate(cliniquesMediaflow || [], cliniquesOSM)

    const sorted = merged.sort((a, b) => {
      if (a.inscrite && !b.inscrite) return -1
      if (!a.inscrite && b.inscrite) return 1
      return (a.distance ?? 9999) - (b.distance ?? 9999)
    })

    return NextResponse.json({
      success:        true,
      total:          sorted.length,
      mediflow_count: cliniquesMediaflow?.length ?? 0,
      osm_count:      cliniquesOSM.length,
      ville,
      specialite,
      rayon,
      cliniques:      sorted,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur API search-cliniques:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ============================================================================
// OVERPASS — query optimisée avec nwr + fallback automatique
// ============================================================================

async function searchOverpass(
  lat: number, lon: number, rayon: number, specialite: string
): Promise<CliniqueUnifiee[]> {
  const mapping = SPECIALITE_OSM[specialite] ?? SPECIALITE_OSM['all']

  // Tentative 1 : tags primaires
  let results = await runOverpassQuery(lat, lon, rayon, mapping.primary)

  // Fallback : si 0 résultats avec les tags primaires, on cherche tous les établissements
  if (results.length === 0 && mapping.fallback.length > 0) {
    results = await runOverpassQuery(lat, lon, rayon, mapping.fallback)
  }

  return results.map(el => {
    const elLat = el.lat ?? el.center?.lat ?? 0
    const elLon = el.lon ?? el.center?.lon ?? 0
    return {
      id:        `osm_${el.type}_${el.id}`,
      nom:       el.tags?.name ?? 'Établissement de santé',
      adresse:   buildAddress(el.tags),
      ville:     el.tags?.['addr:city'] ?? '',
      latitude:  elLat,
      longitude: elLon,
      telephone: el.tags?.['contact:phone'] ?? el.tags?.phone,
      email:     el.tags?.['contact:email'] ?? el.tags?.email,
      website:   el.tags?.website,
      source:    'openstreetmap' as const,
      actif:     true,
      inscrite:  false,
      osm_id:    el.id,
      osm_type:  el.type,
      specialites: extractSpecialites(el.tags),
      horaires:  null,
      distance:  calculateDistance(lat, lon, elLat, elLon) / 1000,
    }
  }).filter(c => c.latitude !== 0 && c.longitude !== 0 && c.nom !== 'Établissement de santé')
}

async function runOverpassQuery(
  lat: number, lon: number, rayon: number, tags: string[]
): Promise<OSMElement[]> {
  if (tags.length === 0) return []

  // nwr = node + way + relation en une seule ligne → query plus courte et plus rapide
  const tagBlocks = tags.map(tag => {
    const [key, value] = tag.split('=')
    return `nwr["${key}"="${value}"](around:${rayon},${lat},${lon});`
  }).join('\n      ')

  const query = `[out:json][timeout:20];
(
  ${tagBlocks}
);
out center tags;`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 18000)

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `data=${encodeURIComponent(query)}`,
      signal:  controller.signal,
    })

    clearTimeout(timer)
    if (!res.ok) return []

    const data: OverpassResponse = await res.json()
    return data.elements.filter(e => e.tags?.name)
  } catch {
    return []
  }
}

// ============================================================================
// NOMINATIM — utilisé uniquement pour les villes hors cache
// ============================================================================

async function getCityCoordinates(ville: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', `${ville}, Cameroun`)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'cm')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MediFlow/1.0 (contact@mediflow.cm)' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// ============================================================================
// FUSION + DÉDUPLICATION
// ============================================================================

function mergeAndDeduplicate(
  mediflow: Record<string, unknown>[],
  osm: CliniqueUnifiee[]
): CliniqueUnifiee[] {
  const mf: CliniqueUnifiee[] = mediflow.map(c => ({
    id:           c.id as string,
    nom:          c.nom as string,
    adresse:      (c.adresse as string) ?? '',
    ville:        (c.ville as string) ?? '',
    latitude:     parseFloat(c.latitude as string) || 0,
    longitude:    parseFloat(c.longitude as string) || 0,
    telephone:    c.telephone as string | undefined,
    email:        c.email as string | undefined,
    whatsapp_number: c.whatsapp_number as string | undefined,
    source:       'mediflow' as const,
    actif:        c.actif as boolean,
    inscrite:     true,
    specialites:  c.specialites as string[] | undefined,
    horaires:     c.horaires as Record<string, unknown> | null,
  }))

  const osmFiltres = osm.filter(o =>
    !mf.some(m => {
      const nomSim = similarity(normalizeString(o.nom), normalizeString(m.nom)) > 0.7
      const dist   = calculateDistance(o.latitude, o.longitude, m.latitude, m.longitude)
      return nomSim && dist < 100
    })
  )

  return [...mf, ...osmFiltres]
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function buildAddress(tags?: OSMElement['tags']): string {
  if (!tags) return ''
  const parts: string[] = []
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']!)
  if (tags['addr:street'])     parts.push(tags['addr:street']!)
  if (tags['addr:city'])       parts.push(tags['addr:city']!)
  return parts.join(', ') || ''
}

function extractSpecialites(tags?: OSMElement['tags']): string[] {
  if (!tags) return []
  const map: Record<string, string> = {
    hospital: 'Hôpital', clinic: 'Clinique', doctors: 'Médecine générale',
    dentist: 'Dentisterie', pharmacy: 'Pharmacie', laboratory: 'Laboratoire',
    midwife: 'Maternité', physiotherapist: 'Kinésithérapie', optometrist: 'Ophtalmologie',
    gynaecologist: 'Gynécologie', paediatrician: 'Pédiatrie', cardiologist: 'Cardiologie',
    dermatologist: 'Dermatologie', radiologist: 'Radiologie',
  }
  const result: string[] = []
  if (tags.amenity   && map[tags.amenity])    result.push(map[tags.amenity]!)
  if (tags.healthcare && map[tags.healthcare]) result.push(map[tags.healthcare]!)
  if (tags['healthcare:speciality'])           result.push(tags['healthcare:speciality']!)
  return [...new Set(result)]
}

function normalizeString(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function similarity(s1: string, s2: string): number {
  if (s1 === s2) return 1
  if (s1.length < 2 || s2.length < 2) return 0
  const b1 = new Set(Array.from({ length: s1.length - 1 }, (_, i) => s1.slice(i, i + 2)))
  const b2 = new Set(Array.from({ length: s2.length - 1 }, (_, i) => s2.slice(i, i + 2)))
  const inter = [...b1].filter(x => b2.has(x)).length
  return (2 * inter) / (b1.size + b2.size)
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
