'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type Statut = 'confirme' | 'termine' | 'annule' | 'absent'

export async function updateStatut(rdvId: string, statut: Statut) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('rendez_vous')
    .update({ statut })
    .eq('id', rdvId)

  if (error) throw error

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/rdv')
  revalidatePath('/dashboard/medecin')
  revalidatePath('/dashboard/clinique')
}
