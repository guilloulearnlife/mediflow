import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Récupérer la clinique
  const { data: cliniques } = await supabase
    .from('cliniques')
    .select('*')
    .limit(1)

  const clinique = cliniques?.[0]

  // RDV du jour
  const today = new Date().toISOString().split('T')[0]
  const { data: rdvDuJour } = await supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .eq('date_rdv', today)
    .order('heure_rdv', { ascending: true })

  const total = rdvDuJour?.length ?? 0
  const termines = rdvDuJour?.filter(r => r.statut === 'termine').length ?? 0
  const confirmes = rdvDuJour?.filter(r => r.statut === 'confirme').length ?? 0
  const absents = rdvDuJour?.filter(r => r.statut === 'absent').length ?? 0

  return (
    <main className="min-h-screen bg-[#F4F7FB]">

      {/* TOPBAR */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#0C1E35]">
            Medi<span className="text-[#0BA896]">Flow</span>
            <span className="text-[#64748B] font-normal text-base ml-3">
              · {clinique?.nom ?? 'Ma Clinique'}
            </span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {clinique?.ville} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#64748B]">{user.email}</span>
          <LogoutButton />
        </div>
      </div>

      <div className="p-8">

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'RDV aujourd\'hui', val: total, icon: '📅', color: 'border-[#0BA896]' },
            { label: 'Terminés', val: termines, icon: '✅', color: 'border-[#10B981]' },
            { label: 'À venir', val: confirmes, icon: '⏳', color: 'border-[#3B82F6]' },
            { label: 'Absents', val: absents, icon: '⚠️', color: 'border-[#EF4444]' },
          ].map((k) => (
            <div key={k.label} className={`bg-white border-t-4 ${k.color} rounded-2xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{k.label}</span>
                <span className="text-2xl">{k.icon}</span>
              </div>
              <div className="text-4xl font-black text-[#0C1E35]">{k.val}</div>
            </div>
          ))}
        </div>

        {/* AGENDA DU JOUR */}
        <div className="bg-white border border-[#E2EAF4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2EAF4] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0C1E35]">📅 Agenda du jour</h2>
              <p className="text-xs text-[#64748B] mt-0.5">{total} rendez-vous · Données en temps réel</p>
            </div>
            <span className="bg-[#E6F7F5] text-[#0BA896] text-xs font-bold px-3 py-1.5 rounded-full">
              🟢 Live Supabase
            </span>
          </div>

          <div className="divide-y divide-[#E2EAF4]">
            {rdvDuJour && rdvDuJour.length > 0 ? (
              rdvDuJour.map((rdv) => {
                const patient = rdv.patients as { nom: string; prenom: string; telephone: string } | null
                const initial = patient?.nom?.[0] ?? '?'

                const statusConfig = {
                  confirme: { label: 'Confirmé', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-400' },
                  termine: { label: 'Terminé', bg: 'bg-green-50', text: 'text-green-600', border: 'border-l-green-400' },
                  annule: { label: 'Annulé', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-l-gray-300' },
                  absent: { label: 'Absent', bg: 'bg-red-50', text: 'text-red-500', border: 'border-l-red-400' },
                }

                const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme

                return (
                  <div key={rdv.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-[#F8FAFB] transition-colors border-l-4 ${s.border}`}>
                    {/* Heure */}
                    <div className="w-14 text-center flex-shrink-0">
                      <div className="text-sm font-bold text-[#0C1E35]">{rdv.heure_rdv.slice(0, 5)}</div>
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-[#0BA896] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {initial}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#0C1E35]">
                        {patient?.prenom} {patient?.nom}
                      </div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        {rdv.motif} · {rdv.medecin} · {patient?.telephone}
                      </div>
                    </div>

                    {/* Statut */}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-12 text-center text-[#64748B]">
                Aucun rendez-vous aujourd'hui
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}