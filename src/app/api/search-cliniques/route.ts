// /api/search-cliniques → Supabase UNIQUEMENT (rapide, <1s)
// L'appel Overpass est fait côté browser pour éviter le timeout Vercel (10s)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const ville     = searchParams.get('ville')     || 'Yaoundé'
    const specialite = searchParams.get('specialite') || 'hospital'

    const supabase = await createClient()
    let query = supabase.from('cliniques').select('*').eq('actif', true)

    if (ville.trim()) query = query.ilike('ville', `%${ville.trim()}%`)

    // Filtre spécialité sur la colonne array si ce n'est pas "all"
    // (filtre JS car Supabase ne fait pas ilike sur array)
    const { data: all, error } = await query
    if (error) throw error

    const specialiteLower = specialite.toLowerCase()
    const cliniques = specialiteLower === 'all' || specialiteLower === 'hospital'
      ? all
      : (all ?? []).filter(c => {
          const specs = (c.specialites as string[] | null) ?? []
          return specs.some(s => s.toLowerCase().includes(specialiteLower))
        })

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
