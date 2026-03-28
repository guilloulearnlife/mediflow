import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import NouveauRdvForm from './NouveauRdvForm'

interface Props {
  searchParams: Promise<{ telephone?: string; nom?: string; prenom?: string }>
}

export default async function NouveauRdvPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'secretaire'
  const cliniqueId = profile?.clinique_id

  if (!cliniqueId) {
    redirect('/dashboard')
  }

  const { data: clinique } = await supabase
    .from('cliniques')
    .select('nom')
    .eq('id', cliniqueId)
    .single()

  const { data: medecins } = await supabase
    .from('profiles')
    .select('id, nom, prenom')
    .eq('clinique_id', cliniqueId)
    .eq('role', 'medecin')
    .order('nom', { ascending: true })

  const params = await searchParams

  return (
    <>
      <Navbar
        email={user.email!}
        role={role}
        cliniqueName={clinique?.nom}
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />
      <NouveauRdvForm
        cliniqueId={cliniqueId}
        medecins={medecins ?? []}
        defaultNom={params.nom}
        defaultPrenom={params.prenom}
        defaultTelephone={params.telephone}
      />
    </>
  )
}
