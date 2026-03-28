// /api/search-cliniques → Supabase UNIQUEMENT (rapide, <1s)
// L'appel Overpass est fait côté browser pour éviter le timeout Vercel (10s)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const ville     = searchParams.get('ville')     || 'Yaoundé'
    const specialite = searchParams.get('specialite') || 'hospital'
    const q         = searchParams.get('q')         || '' // texte libre (ex: dialyse)

    const supabase = await createClient()
    let query = supabase.from('cliniques').select('*').eq('actif', true)

    if (ville.trim()) query = query.ilike('ville', `%${ville.trim()}%`)

    const { data: all, error } = await query
    if (error) throw error

    // Catégories générales → retourne toutes les cliniques actives
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
        // Catégorie générale → toutes les cliniques
        cliniques = all
      } else {
        // Recherche par mots-clés (FR normalisé) + valeur brute
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
      })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
