import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import RdvStatusSelect from '@/components/RdvStatusSelect'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock } from 'lucide-react'
import type { Statut } from '@/app/actions/rdv'

const statusConfig = {
  confirme: { label: 'Confirmé', classes: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  termine:  { label: 'Terminé',  classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  annule:   { label: 'Annulé',   classes: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-400' },
  absent:   { label: 'Absent',   classes: 'bg-red-50 text-red-600 border border-red-200', dot: 'bg-red-500' },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function MedecinDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'directeur'
  const cliniqueId = profile?.clinique_id

  // Seuls directeur, gérant et super_admin peuvent accéder
  if (!['directeur', 'gerant', 'super_admin'].includes(role)) redirect('/dashboard')

  // Charger le médecin (doit appartenir à la même clinique)
  const { data: medecin } = await supabase
    .from('profiles')
    .select('id, nom, prenom, role, clinique_id')
    .eq('id', id)
    .eq('role', 'medecin')
    .single()

  if (!medecin || (cliniqueId && medecin.clinique_id !== cliniqueId)) redirect('/dashboard/clinique')

  const { data: clinique } = cliniqueId
    ? await supabase.from('cliniques').select('nom, ville').eq('id', cliniqueId).single()
    : { data: null }

  const today = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const nomFilter = medecin.nom ?? ''

  // RDV d'aujourd'hui pour ce médecin
  const [{ data: rdvAujourdhui }, { data: rdvAVenir }] = await Promise.all([
    supabase
      .from('rendez_vous')
      .select('*, patients(nom, prenom, telephone)')
      .eq('clinique_id', cliniqueId ?? '')
      .eq('date_rdv', today)
      .ilike('medecin', `%${nomFilter}%`)
      .order('heure_rdv', { ascending: true }),
    supabase
      .from('rendez_vous')
      .select('*, patients(nom, prenom, telephone)')
      .eq('clinique_id', cliniqueId ?? '')
      .gt('date_rdv', today)
      .lte('date_rdv', in7days)
      .ilike('medecin', `%${nomFilter}%`)
      .order('date_rdv', { ascending: true })
      .order('heure_rdv', { ascending: true }),
  ])

  const total    = rdvAujourdhui?.length ?? 0
  const termines = rdvAujourdhui?.filter(r => r.statut === 'termine').length ?? 0
  const confirmes = rdvAujourdhui?.filter(r => r.statut === 'confirme').length ?? 0

  // Statut occupé/disponible : occupé si au moins 1 RDV confirmé aujourd'hui
  const estOccupe = confirmes > 0
  const nomComplet = `${medecin.prenom ?? ''} ${medecin.nom ?? ''}`.trim()
  const initiales = `${medecin.prenom?.[0] ?? ''}${medecin.nom?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar
        email={user.email!}
        role={role}
        cliniqueName={clinique?.nom}
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />

      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Back */}
        <Link href="/dashboard/clinique" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Ma clinique
        </Link>

        {/* Header médecin */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initiales}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Dr. {nomComplet}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{clinique?.nom}{clinique?.ville && ` · ${clinique.ville}`}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border ${
            estOccupe
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${estOccupe ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {estOccupe ? 'Occupé' : 'Disponible'}
          </span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "RDV aujourd'hui", value: total,    Icon: CalendarDays },
            { label: 'Terminés',        value: termines, Icon: CheckCircle2 },
            { label: 'À venir',         value: confirmes, Icon: Clock },
          ].map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{k.label}</span>
                <k.Icon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Agenda du jour */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Agenda du jour</h2>
              <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {rdvAujourdhui && rdvAujourdhui.length > 0 ? (
              rdvAujourdhui.map((rdv) => {
                const patient = rdv.patients as { nom: string; prenom: string; telephone: string } | null
                const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme
                const ini = `${patient?.prenom?.[0] ?? ''}${patient?.nom?.[0] ?? ''}`.toUpperCase() || '?'
                return (
                  <div key={rdv.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                    <span className="text-sm font-mono font-medium text-slate-900 w-10 flex-shrink-0 tabular-nums">{rdv.heure_rdv.slice(0, 5)}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">{ini}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{patient?.prenom} {patient?.nom}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{rdv.motif && `${rdv.motif} · `}{patient?.telephone}</p>
                    </div>
                    <RdvStatusSelect rdvId={rdv.id} statut={rdv.statut as Statut} />
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Aucun rendez-vous aujourd&apos;hui</p>
              </div>
            )}
          </div>
        </div>

        {/* Prochains RDV */}
        {rdvAVenir && rdvAVenir.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Prochains rendez-vous</h2>
              <p className="text-xs text-slate-400 mt-0.5">7 prochains jours · {rdvAVenir.length} RDV</p>
            </div>
            <div className="divide-y divide-slate-100">
              {rdvAVenir.map((rdv) => {
                const patient = rdv.patients as { nom: string; prenom: string; telephone: string } | null
                const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme
                const ini = `${patient?.prenom?.[0] ?? ''}${patient?.nom?.[0] ?? ''}`.toUpperCase() || '?'
                return (
                  <div key={rdv.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                    <div className="w-16 flex-shrink-0">
                      <p className="text-xs font-medium text-slate-900">
                        {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs font-mono text-slate-400 tabular-nums">{rdv.heure_rdv.slice(0, 5)}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">{ini}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{patient?.prenom} {patient?.nom}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{rdv.motif}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0 ${s.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
