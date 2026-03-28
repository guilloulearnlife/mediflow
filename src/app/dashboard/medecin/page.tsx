import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getProfile } from '@/lib/profile'
import {
  CalendarDays, CheckCircle2, Clock, Star,
  Activity, FileText, Users
} from 'lucide-react'

const statusConfig = {
  confirme: { label: 'Confirmé', classes: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-500' },
  termine:  { label: 'Terminé',  classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  annule:   { label: 'Annulé',   classes: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-400' },
  absent:   { label: 'Absent',   classes: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-500' },
}

export default async function MedecinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'medecin'

  const today = new Date().toISOString().split('T')[0]
  const { data: rdvDuJour } = await supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .eq('date_rdv', today)
    .eq('medecin', 'Dr. Kamga')
    .order('heure_rdv', { ascending: true })

  const total    = rdvDuJour?.length ?? 0
  const termines = rdvDuJour?.filter(r => r.statut === 'termine').length ?? 0
  const aVenir   = rdvDuJour?.filter(r => r.statut === 'confirme').length ?? 0
  const enCours  = rdvDuJour?.find(r => r.statut === 'confirme')

  const kpis = [
    { label: "RDV aujourd'hui", value: total,     Icon: CalendarDays },
    { label: 'Terminés',        value: termines,  Icon: CheckCircle2 },
    { label: 'À venir',         value: aVenir,    Icon: Clock },
    { label: 'Satisfaction',    value: '4.9',     Icon: Star,  unit: '/5' },
  ]

  const monthlyStats = [
    { label: 'Patients consultés', value: '247', pct: 88, color: 'bg-teal-500' },
    { label: 'Taux de présence',   value: '94%', pct: 94, color: 'bg-blue-500' },
    { label: 'Nouveaux patients',  value: '38',  pct: 45, color: 'bg-violet-500' },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar
        email={user.email!}
        role={role}
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* Doctor header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            KP
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Dr. Kamga Paul</h1>
            <p className="text-sm text-slate-400 mt-0.5">Cardiologue · Clinique de l&apos;Espoir · Yaoundé</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En consultation
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => (
            <div key={k.label}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgb(0,0,0,0.08)] transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{k.label}</span>
                <k.Icon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">{k.value}</span>
                {'unit' in k && k.unit && <span className="text-sm text-slate-400">{k.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Agenda (2/3) */}
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Agenda du jour</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {total} rendez-vous · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                  const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme
                  const initials = `${patient?.prenom?.[0] ?? ''}${patient?.nom?.[0] ?? ''}`.toUpperCase() || '?'
                  return (
                    <div key={rdv.id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                      <span className="text-sm font-mono font-medium text-slate-900 w-10 flex-shrink-0 tabular-nums">
                        {rdv.heure_rdv.slice(0, 5)}
                      </span>
                      <span className="text-xs text-slate-300 w-10 flex-shrink-0">30 min</span>
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {patient?.prenom} {patient?.nom}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {rdv.motif && `${rdv.motif} · `}{patient?.telephone}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0 ${s.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="px-6 py-16 text-center">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Aucun rendez-vous aujourd&apos;hui</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (1/3) */}
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

            {/* Monthly stats */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">Ce mois</h3>
              </div>
              <div className="flex flex-col gap-4">
                {monthlyStats.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-slate-500">{s.label}</span>
                      <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-500`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
              <button className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-medium transition-colors duration-150 flex items-center justify-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
