'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function creerMedecin(data: {
  email: string
  password: string
  nom: string
  prenom: string
  cliniqueId: string
}) {
  // Vérifier que l'appelant est directeur de cette clinique
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, clinique_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['directeur', 'gerant', 'super_admin'].includes(profile.role)) {
    throw new Error('Non autorisé')
  }
  if (profile.clinique_id !== data.cliniqueId) {
    throw new Error('Non autorisé')
  }

  const admin = createAdminClient()

  // Créer le compte Supabase Auth sans envoyer d'email
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // confirme directement sans email
  })
  if (authErr) throw new Error(authErr.message)

  const userId = authData.user.id

  // Créer le profil médecin
  const { error: profileErr } = await admin
    .from('profiles')
    .insert({
      id:          userId,
      clinique_id: data.cliniqueId,
      role:        'medecin',
      nom:         data.nom,
      prenom:      data.prenom,
    })

  if (profileErr) {
    // Rollback : supprimer le user Auth si le profil échoue
    await admin.auth.admin.deleteUser(userId)
    throw new Error(profileErr.message)
  }

  revalidatePath('/dashboard/clinique')
}
