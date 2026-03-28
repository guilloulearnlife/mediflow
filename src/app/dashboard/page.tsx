import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import { CalendarDays, CheckCircle2, Clock, UserX, TrendingUp, TrendingDown } from 'lucide-react'

const statusConfig = {
  confirme: {
    label: 'Confirmé',
    classes: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
  },
  termine: {
    label: 'Terminé',
    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  annule: {
    label: 'Annulé',
    classes: 'bg-slate-50 text-slate-500 border border-slate-200',
    dot: 'bg-slate-400',
  },
  absent: {
    label: 'Absent',
    classes: 'bg-red-50 text-red-600 border border-red-200',
    dot: 'bg-red-500',
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'secretaire'

  const { data: cliniques } = await supabase.from('cliniques').select('*').limit(1)
  const clinique = cliniques?.[0]

  const today = new Date().toISOString().split('T')[0]
  const { data: rdvDuJour } = await supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .eq('date_rdv', today)
    .order('heure_rdv', { ascending: true })

  const total    = rdvDuJour?.length ?? 0
  const termines = rdvDuJour?.filter(r => r.statut === 'termine').length ?? 0
  const confirmes= rdvDuJour?.filter(r => r.statut === 'confirme').length ?? 0
  const absents  = rdvDuJour?.filter(r => r.statut === 'absent').length ?? 0

  const kpis = [
    { label: "RDV aujourd'hui", value: total,     Icon: CalendarDays,  trend: null },
    { label: 'Terminés',        value: termines,  Icon: CheckCircle2,  trend: total > 0 ? `${Math.round((termines/total)*100)}%` : null, up: true },
    { label: 'En attente',      value: confirmes, Icon: Clock,         trend: null },
    { label: 'Absents',         value: absents,   Icon: UserX,         trend: absents > 0 ? `${absents}` : null, up: false },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar
        email={user.email!}
        role={role}
        cliniqueName={clinique?.nom}
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {clinique?.nom ?? 'Ma Clinique'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {clinique?.ville && `${clinique.ville} · `}
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => (
            <div key={k.label}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgb(0,0,0,0.08)] transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {k.label}
                </span>
                <k.Icon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {k.value}
              </div>
              {k.trend && (
                <div className={`flex items-center gap-1 mt-2 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {k.up
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  <span className="text-xs font-medium">{k.trend}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Agenda du jour */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Agenda du jour</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {total} rendez-vous · Temps réel
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
                  <div key={rdv.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                    <span className="text-sm font-mono font-medium text-slate-900 w-10 flex-shrink-0 tabular-nums">
                      {rdv.heure_rdv.slice(0, 5)}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {patient?.prenom} {patient?.nom}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {rdv.motif && `${rdv.motif} · `}{rdv.medecin}{patient?.telephone && ` · ${patient.telephone}`}
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
      </div>
    </main>
  )
}
