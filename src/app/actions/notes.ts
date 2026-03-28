'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function saveNotes(rdvId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('rendez_vous')
    .update({ notes })
    .eq('id', rdvId)

  if (error) throw error

  revalidatePath('/dashboard/medecin')
}
