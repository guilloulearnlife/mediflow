// /api/search-cliniques → Supabase UNIQUEMENT (rapide, <1s)
// L'appel Overpass est fait côté browser pour éviter le timeout Vercel (10s)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client public statique — pas de cookies nécessaires pour cette route GET publique
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function calcDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const specialite = searchParams.get('specialite') || 'hospital'
    const q          = searchParams.get('q')          || '' // texte libre
    // Nouveau : coordonnées + rayon km (priorité sur ville)
    const latParam   = searchParams.get('lat')
    const lonParam   = searchParams.get('lon')
    const rayonKm    = parseFloat(searchParams.get('rayon') || '10')
    // Fallback legacy : filtre par nom de ville
    const ville      = searchParams.get('ville')      || ''

    const today = new Date().toISOString().split('T')[0]
    const TOTAL_SLOTS = 15 // créneaux par jour

    const [{ data: rawAll, error }, { data: rawMedecins }, { data: rawRdvs }] = await Promise.all([
      supabase.from('cliniques').select('*').eq('actif', true),
      supabase.from('profiles').select('id, clinique_id, nom, prenom').eq('role', 'medecin'),
      supabase.from('rendez_vous').select('clinique_id').eq('date_rdv', today).eq('statut', 'confirme'),
    ])
    if (error) throw error

    // Index médecins par clinique
    const medecinsByClinic: Record<string, { id: string; nom: string | null; prenom: string | null }[]> = {}
    for (const m of rawMedecins ?? []) {
      if (!m.clinique_id) continue
      if (!medecinsByClinic[m.clinique_id]) medecinsByClinic[m.clinique_id] = []
      medecinsByClinic[m.clinique_id].push({ id: m.id, nom: m.nom, prenom: m.prenom })
    }

    // RDV pris aujourd'hui par clinique
    const rdvCountByClinic: Record<string, number> = {}
    for (const r of rawRdvs ?? []) {
      rdvCountByClinic[r.clinique_id] = (rdvCountByClinic[r.clinique_id] ?? 0) + 1
    }

    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    // ── Filtre géographique ──────────────────────────────────────────────────
    let all: typeof rawAll
    if (latParam && lonParam) {
      // Mode coordonnées + rayon km (priorité)
      const refLat = parseFloat(latParam)
      const refLon = parseFloat(lonParam)
      all = (rawAll ?? []).filter(c => {
        const lat = parseFloat(c.latitude)
        const lon = parseFloat(c.longitude)
        if (!lat || !lon) return false
        return calcDistKm(refLat, refLon, lat, lon) <= rayonKm
      })
    } else {
      // Mode legacy : filtre par nom de ville
      const villeN = norm(ville.trim())
      all = villeN
        ? (rawAll ?? []).filter(c => norm(c.ville ?? '').includes(villeN))
        : (rawAll ?? [])
    }

    // Catégories générales → retourne toutes les cliniques
    const GENERAL = ['all', 'hospital', 'hopital', 'urgences', 'clinique', '']

    // Mapping valeur dropdown → mots-clés à chercher dans specialites[]
    const KEYWORD_MAP: Record<string, string[]> = {
      pediatrie:      ['pédiatrie', 'pediatrie', 'enfant'],
      gynecologie:    ['gynécologie', 'gynecologie', 'maternité', 'maternite'],
      cardiologie:    ['cardiologie', 'cardio'],
      ophtalmologie:  ['ophtalmologie', 'ophtalmo', 'oeil', 'yeux'],
      dermatologie:   ['dermatologie', 'dermato', 'peau'],
      radiologie:     ['radiologie', 'imagerie', 'scanner', 'radio'],
      kinesitherapie: ['kinésithérapie', 'kinesitherapie', 'kiné', 'kine', 'physio'],
      laboratoire:    ['laboratoire', 'analyse', 'biologie'],
      maternite:      ['maternité', 'maternite', 'gynécologie', 'gynecologie'],
      dentiste:       ['dentiste', 'dentisterie', 'stomatologie'],
      pharmacie:      ['pharmacie'],
    }

    let cliniques
    if (q.trim()) {
      // Recherche texte libre : filtre sur nom ET specialites[]
      const qLower = q.trim().toLowerCase()
      cliniques = (all ?? []).filter(c => {
        const specs = (c.specialites as string[] | null) ?? []
        return (
          c.nom?.toLowerCase().includes(qLower) ||
          specs.some(s => s.toLowerCase().includes(qLower))
        )
      })
    } else {
      const specialiteLower = specialite.toLowerCase()
      if (GENERAL.includes(specialiteLower)) {
        cliniques = all
      } else {
        const keywords = KEYWORD_MAP[specialiteLower] ?? [specialiteLower]
        cliniques = (all ?? []).filter(c => {
          const specs = (c.specialites as string[] | null) ?? []
          return specs.some(s => {
            const sLower = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            return keywords.some(kw => {
              const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              return sLower.includes(kwNorm)
            })
          })
        })
      }
    }

    return NextResponse.json({
      success:  true,
      cliniques: (cliniques ?? []).map(c => ({
        id:              c.id,
        nom:             c.nom,
        adresse:         c.adresse ?? '',
        ville:           c.ville ?? '',
        latitude:        parseFloat(c.latitude) || 0,
        longitude:       parseFloat(c.longitude) || 0,
        telephone:       c.telephone,
        email:           c.email,
        whatsapp_number: c.whatsapp_number,
        website:         c.website,
        specialites:     c.specialites ?? [],
        source:          'mediflow',
        inscrite:        true,
        medecins:        medecinsByClinic[c.id] ?? [],
        slots_disponibles: Math.max(0, TOTAL_SLOTS * Math.max(1, (medecinsByClinic[c.id]?.length ?? 1)) - (rdvCountByClinic[c.id] ?? 0)),
      })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
