// app/api/search-cliniques/route.ts
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
    'addr:postcode'?: string
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
  version: number
  generator: string
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
// API ROUTE PRINCIPALE
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ville = searchParams.get('ville') || 'Yaoundé'
    const specialite = searchParams.get('specialite') || 'hospital'
    const rayon = parseInt(searchParams.get('rayon') || '10000')

    // 1. RÉCUPÉRER LES CLINIQUES MEDIFLOW (Supabase)
    const supabase = await createClient()
    const { data: cliniquesMediaflow, error } = await supabase
      .from('cliniques')
      .select('*')
      .eq('actif', true)
      .ilike('ville', `%${ville}%`)

    if (error) {
      console.error('Erreur Supabase:', error)
    }

    // 2. RÉCUPÉRER LES CLINIQUES OPENSTREETMAP
    const cliniquesOSM = await searchOpenStreetMap(ville, specialite, rayon)

    // 3. FUSIONNER ET DÉDUPLIQUER
    const cliniquesUnifiees = mergeAndDeduplicate(
      cliniquesMediaflow || [],
      cliniquesOSM
    )

    // 4. TRIER PAR PERTINENCE (inscrites en premier, puis par distance)
    const cliniquesTriees = cliniquesUnifiees.sort((a, b) => {
      if (a.inscrite && !b.inscrite) return -1
      if (!a.inscrite && b.inscrite) return 1
      const distanceA = a.distance || 999999
      const distanceB = b.distance || 999999
      return distanceA - distanceB
    })

    return NextResponse.json({
      success: true,
      total: cliniquesTriees.length,
      mediflow_count: cliniquesMediaflow?.length || 0,
      osm_count: cliniquesOSM.length,
      ville,
      specialite,
      rayon,
      cliniques: cliniquesTriees,
      note: "Source: MediFlow + OpenStreetMap (données communautaires)"
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur recherche cliniques:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ============================================================================
// FONCTION: Recherche OpenStreetMap via Overpass API
// ============================================================================

async function searchOpenStreetMap(
  ville: string,
  specialite: string,
  rayon: number
): Promise<CliniqueUnifiee[]> {
  try {
    const coordsVille = await getCityCoordinates(ville)
    if (!coordsVille) {
      console.warn(`Ville "${ville}" non trouvée dans Nominatim`)
      return []
    }

    const overpassQuery = buildOverpassQuery(coordsVille.lat, coordsVille.lon, rayon, specialite)

    const overpassUrl = 'https://overpass-api.de/api/interpreter'
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`
    })

    if (!response.ok) {
      console.error('Erreur Overpass API:', response.status, response.statusText)
      return []
    }

    const data: OverpassResponse = await response.json()

    const cliniques: CliniqueUnifiee[] = data.elements
      .filter(element => element.tags?.name)
      .map(element => {
        const lat = element.lat || element.center?.lat || 0
        const lon = element.lon || element.center?.lon || 0
        const distance = calculateDistance(coordsVille.lat, coordsVille.lon, lat, lon) / 1000

        return {
          id: `osm_${element.type}_${element.id}`,
          nom: element.tags?.name || 'Clinique',
          adresse: buildAddress(element.tags),
          ville: element.tags?.['addr:city'] || ville,
          latitude: lat,
          longitude: lon,
          telephone: element.tags?.['contact:phone'] || element.tags?.phone,
          email: element.tags?.['contact:email'] || element.tags?.email,
          website: element.tags?.website,
          source: 'openstreetmap' as const,
          actif: true,
          inscrite: false,
          osm_id: element.id,
          osm_type: element.type,
          specialites: extractSpecialites(element.tags),
          horaires: parseOpeningHours(element.tags?.opening_hours),
          distance
        }
      })
      .filter(c => c.latitude !== 0 && c.longitude !== 0)

    return cliniques

  } catch (error) {
    console.error('Erreur recherche OpenStreetMap:', error)
    return []
  }
}

// ============================================================================
// FONCTION: Obtenir coordonnées d'une ville via Nominatim
// ============================================================================

async function getCityCoordinates(ville: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', `${ville}, Cameroun`)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'cm')

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MediFlow/1.0 (contact@mediflow.cm)' }
    })

    const data = await response.json()
    if (data.length === 0) return null

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    }
  } catch (error) {
    console.error('Erreur Nominatim:', error)
    return null
  }
}

// ============================================================================
// FONCTION: Construire requête Overpass QL
// ============================================================================

function buildOverpassQuery(lat: number, lon: number, rayon: number, specialite: string): string {
  const specialiteMapping: Record<string, string[]> = {
    'hospital': ['amenity=hospital', 'amenity=clinic'],
    'clinique': ['amenity=clinic', 'amenity=doctors'],
    'pharmacie': ['amenity=pharmacy'],
    'dentiste': ['healthcare=dentist'],
    'laboratoire': ['healthcare=laboratory'],
    'maternite': ['healthcare=midwife', 'amenity=hospital'],
    'all': ['amenity=hospital', 'amenity=clinic', 'amenity=doctors']
  }

  const tags = specialiteMapping[specialite.toLowerCase()] || specialiteMapping['hospital']

  const queries = tags.map(tag => {
    const [key, value] = tag.split('=')
    return `
      node["${key}"="${value}"](around:${rayon},${lat},${lon});
      way["${key}"="${value}"](around:${rayon},${lat},${lon});
      relation["${key}"="${value}"](around:${rayon},${lat},${lon});
    `
  }).join('')

  return `
    [out:json][timeout:25];
    (
      ${queries}
    );
    out center tags;
  `
}

// ============================================================================
// FONCTION: Fusionner et dédupliquer
// ============================================================================

function mergeAndDeduplicate(
  cliniquesMediaflow: Record<string, unknown>[],
  cliniquesOSM: CliniqueUnifiee[]
): CliniqueUnifiee[] {
  const mediflowUnifiees: CliniqueUnifiee[] = cliniquesMediaflow.map(c => ({
    id: c.id as string,
    nom: c.nom as string,
    adresse: (c.adresse as string) || '',
    ville: (c.ville as string) || '',
    latitude: parseFloat(c.latitude as string) || 0,
    longitude: parseFloat(c.longitude as string) || 0,
    telephone: c.telephone as string | undefined,
    email: c.email as string | undefined,
    whatsapp_number: c.whatsapp_number as string | undefined,
    source: 'mediflow' as const,
    actif: c.actif as boolean,
    inscrite: true,
    specialites: c.specialites as string[] | undefined,
    horaires: c.horaires as Record<string, unknown> | null
  }))

  const osmFiltrees = cliniquesOSM.filter(osmClinique => {
    return !mediflowUnifiees.some(mediflowClinique => {
      const nomSimilaire = similarity(
        normalizeString(osmClinique.nom),
        normalizeString(mediflowClinique.nom)
      ) > 0.7
      const distance = calculateDistance(
        osmClinique.latitude, osmClinique.longitude,
        mediflowClinique.latitude, mediflowClinique.longitude
      )
      return nomSimilaire && distance < 100
    })
  })

  return [...mediflowUnifiees, ...osmFiltrees]
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function buildAddress(tags?: OSMElement['tags']): string {
  if (!tags) return ''
  const parts: string[] = []
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']!)
  if (tags['addr:street']) parts.push(tags['addr:street']!)
  if (tags['addr:city']) parts.push(tags['addr:city']!)
  return parts.join(', ') || 'Adresse non renseignée'
}

function extractSpecialites(tags?: OSMElement['tags']): string[] {
  if (!tags) return []
  const mapping: Record<string, string> = {
    'hospital': 'Hôpital',
    'clinic': 'Clinique',
    'doctors': 'Médecine générale',
    'dentist': 'Dentisterie',
    'pharmacy': 'Pharmacie',
    'laboratory': 'Laboratoire',
    'midwife': 'Maternité',
    'physiotherapist': 'Kinésithérapie',
    'optician': 'Ophtalmologie'
  }
  const specialites: string[] = []
  if (tags.amenity && mapping[tags.amenity]) specialites.push(mapping[tags.amenity])
  if (tags.healthcare && mapping[tags.healthcare]) specialites.push(mapping[tags.healthcare])
  if (tags['healthcare:speciality']) specialites.push(tags['healthcare:speciality']!)
  return [...new Set(specialites)]
}

function parseOpeningHours(openingHours?: string): Record<string, unknown> | null {
  if (!openingHours) return null
  try {
    const horaires: Record<string, unknown> = {}
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
    const joursAbrev = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    joursAbrev.forEach((abrev, index) => {
      if (openingHours.includes(abrev)) {
        const match = openingHours.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/)
        if (match) {
          horaires[jours[index]] = { ouverture: match[1], fermeture: match[2] }
        }
      }
    })
    return Object.keys(horaires).length > 0 ? horaires : null
  } catch {
    return null
  }
}

function normalizeString(str: string): string {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function similarity(s1: string, s2: string): number {
  if (s1 === s2) return 1
  if (s1.length < 2 || s2.length < 2) return 0
  const bigrams1 = new Set<string>()
  const bigrams2 = new Set<string>()
  for (let i = 0; i < s1.length - 1; i++) bigrams1.add(s1.substring(i, i + 2))
  for (let i = 0; i < s2.length - 1; i++) bigrams2.add(s2.substring(i, i + 2))
  const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)))
  return (2 * intersection.size) / (bigrams1.size + bigrams2.size)
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
