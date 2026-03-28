import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getProfile } from '@/lib/profile'
import RdvStatusSelect from '@/components/RdvStatusSelect'
import { CalendarDays, CheckCircle2, Clock, FileText } from 'lucide-react'
import type { Statut } from '@/app/actions/rdv'

const statusConfig = {
  confirme: { label: 'Confirmé', classes: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-500' },
  termine:  { label: 'Terminé',  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  annule:   { label: 'Annulé',   classes: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-400' },
  absent:   { label: 'Absent',   classes: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-500' },
}

export default async function MedecinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'medecin'
  const cliniqueId = profile?.clinique_id
  const nomComplet = profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : ''
  const initiales = `${profile?.prenom?.[0] ?? ''}${profile?.nom?.[0] ?? ''}`.toUpperCase() || '?'

  const { data: clinique } = cliniqueId
    ? await supabase.from('cliniques').select('nom, ville').eq('id', cliniqueId).single()
    : { data: null }

  const today = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Build name filter — match on last name contained in the medecin field
  const nomFilter = profile?.nom ?? ''

  let rdvTodayQuery = supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .eq('date_rdv', today)
    .order('heure_rdv', { ascending: true })

  let rdvUpcomingQuery = supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .gt('date_rdv', today)
    .lte('date_rdv', in7days)
    .order('date_rdv', { ascending: true })
    .order('heure_rdv', { ascending: true })

  if (cliniqueId) {
    rdvTodayQuery = rdvTodayQuery.eq('clinique_id', cliniqueId)
    rdvUpcomingQuery = rdvUpcomingQuery.eq('clinique_id', cliniqueId)
  }

  if (nomFilter) {
    rdvTodayQuery = rdvTodayQuery.ilike('medecin', `%${nomFilter}%`)
    rdvUpcomingQuery = rdvUpcomingQuery.ilike('medecin', `%${nomFilter}%`)
  }

  const [{ data: rdvDuJour }, { data: rdvAVenir }] = await Promise.all([
    rdvTodayQuery,
    rdvUpcomingQuery,
  ])

  const total    = rdvDuJour?.length ?? 0
  const termines = rdvDuJour?.filter(r => r.statut === 'termine').length ?? 0
  const aVenir   = rdvDuJour?.filter(r => r.statut === 'confirme').length ?? 0
  const enCours  = rdvDuJour?.find(r => r.statut === 'confirme')

  const kpis = [
    { label: "RDV aujourd'hui", value: total,    Icon: CalendarDays },
    { label: 'Terminés',        value: termines, Icon: CheckCircle2 },
    { label: 'À venir',         value: aVenir,   Icon: Clock },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar
        email={user.email!}
        role={role}
        cliniqueName={clinique?.nom}
        nomPrenom={nomComplet || undefined}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* Doctor header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initiales}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {nomComplet ? `Dr. ${nomComplet}` : user.email}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {clinique?.nom}{clinique?.ville && ` · ${clinique.ville}`}
            </p>
          </div>
          {enCours && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En consultation
            </span>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {kpis.map((k) => (
            <div key={k.label}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgb(0,0,0,0.08)] transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{k.label}</span>
                <k.Icon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Left: Agendas (2/3) */}
          <div className="col-span-2 flex flex-col gap-6">

            {/* Agenda du jour */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Agenda du jour</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {rdvDuJour && rdvDuJour.length > 0 ? (
                  rdvDuJour.map((rdv) => {
                    const patient = rdv.patients as { nom: string; prenom: string; telephone: string } | null
                    const ini = `${patient?.prenom?.[0] ?? ''}${patient?.nom?.[0] ?? ''}`.toUpperCase() || '?'
                    return (
                      <div key={rdv.id}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                        <span className="text-sm font-mono font-medium text-slate-900 w-10 flex-shrink-0 tabular-nums">
                          {rdv.heure_rdv.slice(0, 5)}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                          {ini}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {patient?.prenom} {patient?.nom}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {rdv.motif && `${rdv.motif} · `}{patient?.telephone}
                          </p>
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
                      <div key={rdv.id}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                        <div className="w-16 flex-shrink-0">
                          <p className="text-xs font-medium text-slate-900">
                            {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-xs font-mono text-slate-400 tabular-nums">{rdv.heure_rdv.slice(0, 5)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                          {ini}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {patient?.prenom} {patient?.nom}
                          </p>
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

          {/* Right sidebar (1/3) */}
          <div className="flex flex-col gap-5">

            {/* Current patient */}
            {enCours && (
              <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
                  Patient en cours
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {`${(enCours.patients as { prenom: string })?.prenom?.[0] ?? ''}${(enCours.patients as { nom: string })?.nom?.[0] ?? ''}`.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {(enCours.patients as { prenom: string; nom: string })?.prenom}{' '}
                      {(enCours.patients as { nom: string })?.nom}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{enCours.motif}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  En cours · {enCours.heure_rdv.slice(0, 5)}
                </span>
              </div>
            )}

            {/* Quick notes */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">Notes rapides</h3>
              </div>
              <textarea
                className="w-full h-28 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all"
                placeholder="Notes de consultation..."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
