import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  ArrowLeft, CalendarPlus, Phone, Calendar,
  FileText, CheckCircle2, Clock, UserX, Ban,
} from 'lucide-react'

const statusConfig = {
  confirme: { label: 'Confirmé',  Icon: Clock,        classes: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500' },
  termine:  { label: 'Terminé',   Icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  annule:   { label: 'Annulé',    Icon: Ban,          classes: 'bg-slate-50 text-slate-500 border-slate-200',    dot: 'bg-slate-400' },
  absent:   { label: 'Absent',    Icon: UserX,        classes: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-500' },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  const role = profile?.role ?? 'secretaire'
  const cliniqueId = profile?.clinique_id

  // Charger le patient (doit appartenir à la même clinique)
  const patientQuery = supabase
    .from('patients')
    .select('*')
    .eq('id', id)
  if (cliniqueId) patientQuery.eq('clinique_id', cliniqueId)
  const { data: patient } = await patientQuery.single()

  if (!patient) redirect('/dashboard/patients')

  // Charger tous les RDV avec notes, ordre chronologique inverse
  const { data: rdvs } = await supabase
    .from('rendez_vous')
    .select('id, date_rdv, heure_rdv, statut, motif, medecin, notes, specialite')
    .eq('patient_id', id)
    .order('date_rdv', { ascending: false })
    .order('heure_rdv', { ascending: false })

  const { data: clinique } = cliniqueId
    ? await supabase.from('cliniques').select('nom').eq('id', cliniqueId).single()
    : { data: null }

  const totalRdv    = rdvs?.length ?? 0
  const termines    = rdvs?.filter(r => r.statut === 'termine').length ?? 0
  const avecNotes   = rdvs?.filter(r => r.notes && r.notes.trim() !== '').length ?? 0
  const initials    = `${patient.prenom?.[0] ?? ''}${patient.nom?.[0] ?? ''}`.toUpperCase() || '?'
  const age = patient.date_naissance
    ? Math.floor((Date.now() - new Date(patient.date_naissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar
        email={user.email!}
        role={role}
        cliniqueName={clinique?.nom}
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />

      <div className="max-w-4xl mx-auto px-8 py-8">

        {/* Back */}
        <Link href="/dashboard/patients"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Patients
        </Link>

        {/* Header patient */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] mb-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                {patient.prenom} {patient.nom}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                  {patient.telephone}
                </span>
                {patient.date_naissance && (
                  <span className="text-sm text-slate-500">
                    Né(e) le {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                    {age !== null && ` · ${age} ans`}
                  </span>
                )}
              </div>
            </div>
            {role !== 'medecin' && (
              <Link
                href={`/dashboard/rdv/nouveau?telephone=${patient.telephone}&nom=${patient.nom}&prenom=${encodeURIComponent(patient.prenom ?? '')}`}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                <CalendarPlus className="w-4 h-4" />
                Nouveau RDV
              </Link>
            )}
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
            {[
              { label: 'Consultations',   value: totalRdv },
              { label: 'Terminées',       value: termines },
              { label: 'Avec notes',      value: avecNotes },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historique des consultations + notes */}
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Historique des consultations
        </h2>

        {rdvs && rdvs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {rdvs.map((rdv) => {
              const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme
              const hasNotes = rdv.notes && rdv.notes.trim() !== ''
              const isToday  = rdv.date_rdv === new Date().toISOString().split('T')[0]
              return (
                <div key={rdv.id}
                  className={`bg-white border rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden ${
                    isToday ? 'border-teal-200 ring-1 ring-teal-200' : 'border-slate-200'
                  }`}>
                  {/* En-tête RDV */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-shrink-0 text-center w-14">
                      <p className="text-xs font-semibold text-slate-900">
                        {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {new Date(rdv.date_rdv).getFullYear()}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-medium text-slate-900 tabular-nums">
                          {rdv.heure_rdv.slice(0, 5)}
                        </span>
                        {rdv.medecin && (
                          <span className="text-sm text-slate-500">{rdv.medecin}</span>
                        )}
                        {rdv.specialite && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {rdv.specialite}
                          </span>
                        )}
                        {isToday && (
                          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                            Aujourd&apos;hui
                          </span>
                        )}
                      </div>
                      {rdv.motif && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{rdv.motif}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border flex-shrink-0 ${s.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>

                  {/* Notes de consultation */}
                  {hasNotes && (
                    <div className="px-5 py-4 bg-amber-50/60 border-t border-amber-100">
                      <div className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-1">
                            Notes du médecin
                          </p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {rdv.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pas de notes */}
                  {!hasNotes && rdv.statut === 'termine' && (
                    <div className="px-5 py-3 border-t border-slate-100">
                      <p className="text-xs text-slate-300 italic flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        Aucune note pour cette consultation
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl px-6 py-16 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aucune consultation enregistrée</p>
          </div>
        )}
      </div>
    </main>
  )
}
