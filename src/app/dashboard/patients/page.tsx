import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getProfile } from '@/lib/profile'
import { Users, UserPlus, Phone } from 'lucide-react'

export default async function PatientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'secretaire'
  const cliniqueId = profile?.clinique_id

  let patQuery = supabase
    .from('patients')
    .select('*, rendez_vous(id, date_rdv, statut)')
    .order('created_at', { ascending: false })
  if (cliniqueId) patQuery = patQuery.eq('clinique_id', cliniqueId)
  const { data: patients } = await patQuery

  const totalPatients  = patients?.length ?? 0
  const nouveaux = patients?.filter(p =>
    new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length ?? 0
  const today = new Date().toISOString().split('T')[0]
  const avecRdvAujHui = patients?.filter(p =>
    (p.rendez_vous as { date_rdv: string }[])?.some(r => r.date_rdv === today)
  ).length ?? 0

  const kpis = [
    { label: 'Total patients',     value: totalPatients, Icon: Users },
    { label: 'Nouveaux ce mois',   value: nouveaux,      Icon: UserPlus },
    { label: "RDV aujourd'hui",    value: avecRdvAujHui, Icon: Phone },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar
        email={user.email!}
        role={role}
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Patients</h1>
            <p className="text-sm text-slate-400 mt-0.5">{totalPatients} patients enregistrés</p>
          </div>
          <Link
            href="/dashboard/rdv/nouveau"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau patient
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {kpis.map((k) => (
            <div key={k.label}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{k.label}</span>
                <k.Icon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Patient table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-8">—</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Patient</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-16 text-right">RDV</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-24 text-right">Action</span>
          </div>

          <div className="divide-y divide-slate-100">
            {patients && patients.length > 0 ? (
              patients.map((patient) => {
                const rdvs = patient.rendez_vous as { id: string; date_rdv: string; statut: string }[]
                const totalRdv = rdvs?.length ?? 0
                const initials = `${patient.prenom?.[0] ?? ''}${patient.nom?.[0] ?? ''}`.toUpperCase() || '?'
                return (
                  <div key={patient.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/patients/${patient.id}`} className="text-sm font-medium text-slate-900 hover:text-teal-600 truncate block transition-colors">
                        {patient.prenom} {patient.nom}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{patient.telephone}</span>
                        {patient.date_naissance && (
                          <span className="text-slate-300">·</span>
                        )}
                        {patient.date_naissance && (
                          <span>{new Date(patient.date_naissance).toLocaleDateString('fr-FR')}</span>
                        )}
                      </p>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-mono font-medium text-slate-900 tabular-nums">{totalRdv}</span>
                      <p className="text-[10px] text-slate-400">RDV</p>
                    </div>
                    <div className="w-24 flex justify-end">
                      <Link
                        href={`/dashboard/rdv/nouveau?telephone=${patient.telephone}&nom=${patient.nom}&prenom=${patient.prenom}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors duration-150"
                      >
                        + RDV
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-16 text-center">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Aucun patient enregistré</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
