import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getProfile } from '@/lib/profile'
import { CalendarPlus, Calendar } from 'lucide-react'

const statusConfig = {
  confirme: { label: 'Confirmé', classes: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-500' },
  termine:  { label: 'Terminé',  classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  annule:   { label: 'Annulé',   classes: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-400' },
  absent:   { label: 'Absent',   classes: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-500' },
}

export default async function RdvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'secretaire'

  const { data: rdvs } = await supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .order('date_rdv', { ascending: false })
    .order('heure_rdv', { ascending: true })
    .limit(50)

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
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Rendez-vous</h1>
            <p className="text-sm text-slate-400 mt-0.5">{rdvs?.length ?? 0} rendez-vous au total</p>
          </div>
          <Link
            href="/dashboard/rdv/nouveau"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            <CalendarPlus className="w-4 h-4" />
            Nouveau RDV
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-8">—</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Patient</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-24 text-right">Date</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-12 text-right">Heure</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-24 text-right">Statut</span>
          </div>

          <div className="divide-y divide-slate-100">
            {rdvs && rdvs.length > 0 ? (
              rdvs.map((rdv) => {
                const patient = rdv.patients as { nom: string; prenom: string; telephone: string } | null
                const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme
                const initials = `${patient?.prenom?.[0] ?? ''}${patient?.nom?.[0] ?? ''}`.toUpperCase() || '?'
                return (
                  <div key={rdv.id}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {patient?.prenom} {patient?.nom}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {rdv.motif && `${rdv.motif} · `}{rdv.medecin}{patient?.telephone && ` · ${patient.telephone}`}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-slate-500 w-24 text-right tabular-nums">
                      {new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-sm font-mono font-medium text-slate-900 w-12 text-right tabular-nums">
                      {rdv.heure_rdv.slice(0, 5)}
                    </span>
                    <div className="w-24 flex justify-end">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${s.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-16 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Aucun rendez-vous</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
