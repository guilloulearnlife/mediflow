import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const TOUS_LES_CRENEAUX = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00',
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cliniqueId = searchParams.get('clinique_id')
  const medecinNom = searchParams.get('medecin') // e.g. "Dr. Jean Dupont"
  const date = searchParams.get('date')

  if (!cliniqueId) {
    return NextResponse.json({ error: 'clinique_id requis' }, { status: 400 })
  }

  const supabase = await createClient()

  // Médecins de la clinique
  const { data: medecins } = await supabase
    .from('profiles')
    .select('id, nom, prenom')
    .eq('clinique_id', cliniqueId)
    .eq('role', 'medecin')
    .order('nom', { ascending: true })

  // Spécialités de la clinique
  const { data: clinique } = await supabase
    .from('cliniques')
    .select('specialites')
    .eq('id', cliniqueId)
    .single()

  // Créneaux pris (si date + médecin fournis)
  let slotsDisponibles = TOUS_LES_CRENEAUX

  if (date && medecinNom) {
    const nomFilter = medecinNom.replace(/^Dr\.?\s*/i, '').trim().split(' ').pop() ?? ''

    const { data: rdvsPris } = await supabase
      .from('rendez_vous')
      .select('heure_rdv')
      .eq('clinique_id', cliniqueId)
      .eq('date_rdv', date)
      .eq('statut', 'confirme')
      .ilike('medecin', `%${nomFilter}%`)

    const heuresPrises = new Set((rdvsPris ?? []).map(r => r.heure_rdv.slice(0, 5)))
    slotsDisponibles = TOUS_LES_CRENEAUX.filter(h => !heuresPrises.has(h))
  }

  return NextResponse.json({
    medecins: medecins ?? [],
    specialites: clinique?.specialites ?? [],
    slots_disponibles: slotsDisponibles,
    tous_les_creneaux: TOUS_LES_CRENEAUX,
  })
}
