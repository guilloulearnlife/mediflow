import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function MedecinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  const { data: rdvDuJour } = await supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .eq('date_rdv', today)
    .eq('medecin', 'Dr. Kamga')
    .order('heure_rdv', { ascending: true })

  const total = rdvDuJour?.length ?? 0
  const termines = rdvDuJour?.filter(r => r.statut === 'termine').length ?? 0
  const aVenir = rdvDuJour?.filter(r => r.statut === 'confirme').length ?? 0
  const enCours = rdvDuJour?.find(r => r.statut === 'confirme')

  const statusConfig = {
    confirme: { label: 'Confirmé', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-400' },
    termine: { label: 'Terminé', bg: 'bg-green-50', text: 'text-green-600', border: 'border-l-green-400' },
    annule: { label: 'Annulé', bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-l-gray-300' },
    absent: { label: 'Absent', bg: 'bg-red-50', text: 'text-red-500', border: 'border-l-red-400' },
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0]">

      <Navbar email={user.email!} role="medecin" />

      <div className="p-8">

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#C8773A] flex items-center justify-center text-white font-black text-xl">K</div>
          <div>
            <h2 className="text-2xl font-black text-[#1A1208]">Dr. Kamga Paul</h2>
            <p className="text-sm text-[#7A6A58]">Cardiologue · Clinique de l'Espoir · Yaoundé</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-[#4A7C59]/20 border border-[#4A7C59]/30 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse"></div>
            <span className="text-[#4A7C59] text-xs font-bold">En consultation</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "RDV aujourd'hui", val: total, icon: '📅' },
            { label: 'Terminés', val: termines, icon: '✅' },
            { label: 'À venir', val: aVenir, icon: '⏳' },
            { label: 'Satisfaction', val: '4.9/5', icon: '⭐' },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-[#7A6A58]">{k.label}</span>
                <span className="text-2xl">{k.icon}</span>
              </div>
              <div className="text-4xl font-black text-[#1A1208]">{k.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          <div className="col-span-2 bg-white border border-[#E8DDD0] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8DDD0] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1A1208]">📅 Mon agenda du jour</h2>
                <p className="text-xs text-[#7A6A58] mt-0.5">{total} rendez-vous · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <span className="bg-[#FDF3EA] text-[#C8773A] text-xs font-bold px-3 py-1.5 rounded-full">🟢 Live</span>
            </div>

            <div className="divide-y divide-[#E8DDD0]">
              {rdvDuJour && rdvDuJour.length > 0 ? (
                rdvDuJour.map((rdv) => {
                  const patient = rdv.patients as { nom: string; prenom: string; telephone: string } | null
                  const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme
                  return (
                    <div key={rdv.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-[#FDF3EA] transition-colors border-l-4 ${s.border}`}>
                      <div className="w-14 text-center flex-shrink-0">
                        <div className="text-sm font-bold text-[#1A1208]">{rdv.heure_rdv.slice(0, 5)}</div>
                        <div className="text-xs text-[#7A6A58]">30 min</div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#C8773A] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                        {patient?.nom?.[0] ?? '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#1A1208]">{patient?.prenom} {patient?.nom}</div>
                        <div className="text-xs text-[#7A6A58] mt-0.5">{rdv.motif} · {patient?.telephone}</div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                    </div>
                  )
                })
              ) : (
                <div className="px-6 py-12 text-center text-[#7A6A58]">Aucun rendez-vous aujourd'hui</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {enCours && (
              <div className="bg-[#1A1208] rounded-2xl p-6">
                <div className="text-xs font-bold uppercase tracking-wide text-white/40 mb-4">Patient en cours</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#C8773A] flex items-center justify-center text-white font-black text-xl">
                    {(enCours.patients as { nom: string })?.nom?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="text-white font-black">
                      {(enCours.patients as { prenom: string; nom: string })?.prenom}{' '}
                      {(enCours.patients as { nom: string })?.nom}
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">{enCours.motif}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#C8773A]/20 border border-[#C8773A]/30 px-4 py-2 rounded-full w-fit">
                  <div className="w-2 h-2 rounded-full bg-[#C8773A] animate-pulse"></div>
                  <span className="text-[#C8773A] text-xs font-bold">En cours · {enCours.heure_rdv.slice(0,5)}</span>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-[#1A1208] mb-4">📊 Ce mois</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Patients consultés', val: '247', color: 'bg-[#C8773A]', w: '88%' },
                  { label: 'Taux de présence', val: '94%', color: 'bg-[#4A7C59]', w: '94%' },
                  { label: 'Nouveaux patients', val: '38', color: 'bg-[#2563EB]', w: '45%' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#7A6A58]">{s.label}</span>
                      <span className="text-xs font-bold text-[#1A1208]">{s.val}</span>
                    </div>
                    <div className="h-1.5 bg-[#F8F5F0] rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: s.w }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-[#1A1208] mb-3">📝 Notes rapides</h3>
              <textarea
                className="w-full h-28 bg-[#F8F5F0] border border-[#E8DDD0] rounded-xl p-3 text-sm text-[#1A1208] resize-none outline-none focus:border-[#C8773A] transition-colors"
                placeholder="Notes de consultation..."
              />
              <button className="w-full mt-2 bg-[#C8773A] text-white py-2 rounded-xl text-sm font-bold hover:bg-[#A55E25] transition-colors">
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}