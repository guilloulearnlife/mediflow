import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import AjouterMedecinForm from '@/components/AjouterMedecinForm'
import {
  Building2, CalendarDays, Users, TrendingUp,
  MapPin, Phone, Mail, CalendarPlus, UserPlus,
  CheckCircle2, Clock, UserX,
} from 'lucide-react'

const statusConfig = {
  confirme: { label: 'Confirmé', classes: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-500' },
  termine:  { label: 'Terminé',  classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  annule:   { label: 'Annulé',   classes: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-400' },
  absent:   { label: 'Absent',   classes: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-500' },
}

export default async function CliniqueePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'gerant'
  const cliniqueId = profile?.clinique_id

  const { data: clinique } = cliniqueId
    ? await supabase.from('cliniques').select('*').eq('id', cliniqueId).single()
    : { data: null }

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: rdvDuJour },
    { data: rdvStats },
    { data: patients },
    { data: medecins },
  ] = await Promise.all([
    cliniqueId
      ? supabase.from('rendez_vous').select('*, patients(nom, prenom, telephone)').eq('clinique_id', cliniqueId).eq('date_rdv', today).order('heure_rdv', { ascending: true })
      : Promise.resolve({ data: [] }),
    cliniqueId
      ? supabase.from('rendez_vous').select('id, statut').eq('clinique_id', cliniqueId)
      : Promise.resolve({ data: [] }),
    cliniqueId
      ? supabase.from('patients').select('id, created_at').eq('clinique_id', cliniqueId)
      : Promise.resolve({ data: [] }),
    cliniqueId
      ? supabase.from('profiles').select('id, nom, prenom, role').eq('clinique_id', cliniqueId).eq('role', 'medecin')
      : Promise.resolve({ data: [] }),
  ])

  const total     = rdvDuJour?.length ?? 0
  const termines  = rdvDuJour?.filter(r => r.statut === 'termine').length ?? 0
  const confirmes = rdvDuJour?.filter(r => r.statut === 'confirme').length ?? 0
  const absents   = rdvDuJour?.filter(r => r.statut === 'absent').length ?? 0

  const totalPatients = patients?.length ?? 0
  const nouveaux = patients?.filter(p =>
    new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length ?? 0

  const rdvTerminesTotal = rdvStats?.filter(r => r.statut === 'termine').length ?? 0
  const tauxPresence = rdvStats && rdvStats.length > 0
    ? Math.round((rdvTerminesTotal / rdvStats.length) * 100)
    : 0

  const kpis = [
    { label: "RDV aujourd'hui", value: total,         Icon: CalendarDays },
    { label: 'Terminés',        value: termines,      Icon: CheckCircle2 },
    { label: 'En attente',      value: confirmes,     Icon: Clock },
    { label: 'Absents',         value: absents,       Icon: UserX },
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                {clinique?.nom ?? 'Ma Clinique'}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                {clinique?.ville && (
                  <>
                    <MapPin className="w-3 h-3" />
                    {clinique.ville}
                    <span className="text-slate-300">·</span>
                  </>
                )}
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/rdv/nouveau"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all duration-150"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Nouveau RDV
            </Link>
            <Link
              href="/dashboard/patients"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors duration-150"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nouveau patient
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Agenda du jour (2/3) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Agenda du jour</h2>
                <p className="text-xs text-slate-400 mt-0.5">{total} rendez-vous</p>
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
                          {rdv.motif && `${rdv.motif} · `}{rdv.medecin}
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

            {/* Clinic info */}
            {clinique && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Clinique</h3>
                <div className="flex flex-col gap-2.5">
                  {clinique.adresse && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{clinique.adresse}</span>
                    </div>
                  )}
                  {clinique.telephone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{clinique.telephone}</span>
                    </div>
                  )}
                  {clinique.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 truncate">{clinique.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 pt-1">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${clinique.actif ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${clinique.actif ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                      {clinique.actif ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats globales */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Statistiques</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Taux de présence</span>
                    <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">{tauxPresence}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${tauxPresence}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Patients</span>
                    </div>
                    <p className="text-lg font-bold font-mono tabular-nums text-slate-900">{totalPatients}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Nouveaux</span>
                    </div>
                    <p className="text-lg font-bold font-mono tabular-nums text-slate-900">{nouveaux}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Médecins */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Médecins <span className="text-slate-300 font-normal normal-case tracking-normal">({medecins?.length ?? 0})</span>
              </h3>
              <div className="flex flex-col gap-2 mb-3">
                {medecins && medecins.map((m) => {
                  const initials = `${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}`.toUpperCase() || '?'
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 flex-shrink-0">
                        {initials}
                      </div>
                      <span className="text-sm text-slate-700 truncate">
                        Dr. {m.prenom} {m.nom}
                      </span>
                    </div>
                  )
                })}
              </div>
              {cliniqueId && <AjouterMedecinForm cliniqueId={cliniqueId} />}
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
