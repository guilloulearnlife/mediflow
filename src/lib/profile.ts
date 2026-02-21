import { createClient } from '@/lib/supabase-server'

export type Role = 'super_admin' | 'directeur' | 'gerant' | 'secretaire' | 'medecin'

export interface Profile {
  id: string
  clinique_id: string | null
  role: Role
  nom: string | null
  prenom: string | null
  telephone: string | null
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data ?? null
}

export function redirectByRole(role: Role): string {
  switch (role) {
    case 'super_admin': return '/dashboard/admin'
    case 'directeur': return '/dashboard'
    case 'gerant': return '/dashboard'
    case 'secretaire': return '/dashboard'
    case 'medecin': return '/dashboard/medecin'
    default: return '/dashboard'
  }
}