// Appel Overpass OSM côté serveur avec cache Supabase (TTL 24h)
// Remplace l'appel direct depuis le browser (lent sur 3G, timeout fréquent)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TTL_MS = 24 * 60 * 60 * 1000 // 24h

function buildOverpassQuery(lat: string, lon: string, rayonM: number, osmTags: string[]): string {
  const blocks = osmTags.flatMap(tag => {
    const [k, v] = tag.split('=')
    return [
      `node["${k}"="${v}"](around:${rayonM},${lat},${lon});`,
      `way["${k}"="${v}"](around:${rayonM},${lat},${lon});`,
    ]
  }).join('\n')
  return `[out:json][timeout:8];\n(\n${blocks}\n);\nout body center;`
}

interface OsmElement {
  id: number
  type: string
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

interface OsmClinique {
  id: string
  nom: string
  adresse: string
  ville: string
  latitude: number
  longitude: number
  telephone: string | null
  source: 'openstreetmap'
  inscrite: false
  specialites: string[]
}

function parseOsmResults(data: { elements: OsmElement[] }, lat: string, lon: string): OsmClinique[] {
  return (data.elements ?? [])
    .filter(e => e.tags?.name)
    .map(e => ({
      id: `osm_${e.type}_${e.id}`,
      nom: e.tags['name:fr'] || e.tags.name,
      adresse: [e.tags['addr:housenumber'], e.tags['addr:street'], e.tags['addr:city']]
        .filter(Boolean).join(', '),
      ville: e.tags['addr:city'] || '',
      latitude: e.lat ?? e.center?.lat ?? 0,
      longitude: e.lon ?? e.center?.lon ?? 0,
      telephone: e.tags['contact:phone'] ?? e.tags.phone ?? null,
      source: 'openstreetmap' as const,
      inscrite: false as const,
      specialites: [e.tags.amenity, e.tags.healthcare, e.tags['healthcare:speciality']].filter(Boolean) as string[],
      rawTags: e.tags,
      refLat: parseFloat(lat),
      refLon: parseFloat(lon),
    }))
    .filter(c => c.latitude !== 0 && c.longitude !== 0)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const rayon = searchParams.get('rayon') || '10'
  const specialite = searchParams.get('specialite') || 'all'
  const osmTagsParam = searchParams.get('osmTags') || 'amenity=hospital,amenity=clinic,amenity=doctors,amenity=pharmacy'

  if (!lat || !lon) {
    return NextResponse.json({ success: false, error: 'lat et lon requis' }, { status: 400 })
  }

  const latRound = parseFloat(lat).toFixed(2)
  const lonRound = parseFloat(lon).toFixed(2)
  const cacheKey = `${latRound}:${lonRound}:${rayon}:${specialite}`
  const rayonM = parseInt(rayon) * 1000
  const osmTags = osmTagsParam.split(',').filter(Boolean)

  // 1. Vérifier cache Supabase (< 24h)
  const { data: cached } = await supabase
    .from('cliniques_osm_cache')
    .select('id, nom, adresse, ville, latitude, longitude, telephone, specialites')
    .eq('cache_key', cacheKey)
    .gte('last_updated', new Date(Date.now() - TTL_MS).toISOString())
    .limit(200)

  if (cached && cached.length > 0) {
    const cliniques = cached.map(c => ({
      ...c,
      source: 'openstreetmap' as const,
      inscrite: false,
    }))
    return NextResponse.json({ success: true, cliniques, source: 'cache' })
  }

  // 2. Fetch Overpass avec timeout 8s
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(buildOverpassQuery(lat, lon, rayonM, osmTags))}`,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!resp.ok) throw new Error(`Overpass HTTP ${resp.status}`)

    const osmData = await resp.json()
    const cliniques = parseOsmResults(osmData, lat, lon)

    // 3. Stocker en cache Supabase (upsert par id)
    if (cliniques.length > 0) {
      const rows = cliniques.map(c => ({
        id: c.id,
        nom: c.nom,
        adresse: c.adresse,
        ville: c.ville,
        latitude: c.latitude,
        longitude: c.longitude,
        telephone: c.telephone,
        specialites: c.specialites,
        cache_key: cacheKey,
        last_updated: new Date().toISOString(),
      }))
      // Upsert par batch de 100
      for (let i = 0; i < rows.length; i += 100) {
        await supabase.from('cliniques_osm_cache').upsert(rows.slice(i, i + 100), { onConflict: 'id' })
      }
    }

    return NextResponse.json({ success: true, cliniques, source: 'osm' })
  } catch (err) {
    clearTimeout(timeoutId)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    return NextResponse.json({
      success: true,
      cliniques: [],
      source: 'error',
      error: isTimeout ? 'OSM timeout' : 'OSM temporairement indisponible',
    })
  }
}
