import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function PatientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patients } = await supabase
    .from('patients')
    .select('*, rendez_vous(id, date_rdv, statut)')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      <Navbar email={user.email!} role="secretaire" />

      <div className="p-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#0C1E35]">Patients</h2>
            <p className="text-sm text-[#64748B] mt-1">{patients?.length ?? 0} patients enregistrés</p>
          </div>
          <Link href="/dashboard/rdv/nouveau"
            className="bg-[#0BA896] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#097A6E] transition-colors">
            + Nouveau patient
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total patients', val: patients?.length ?? 0, icon: '👥' },
            { label: 'Nouveaux ce mois', val: patients?.filter(p => new Date(p.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length ?? 0, icon: '🆕' },
            { label: "Avec RDV aujourd'hui", val: patients?.filter(p => (p.rendez_vous as {date_rdv: string}[])?.some(r => r.date_rdv === new Date().toISOString().split('T')[0])).length ?? 0, icon: '📅' },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-[#E2EAF4] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{k.label}</span>
                <span className="text-2xl">{k.icon}</span>
              </div>
              <div className="text-4xl font-black text-[#0C1E35]">{k.val}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E2EAF4] rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-[#E2EAF4]">
            {patients && patients.length > 0 ? (
              patients.map((patient) => {
                const rdvs = patient.rendez_vous as { id: string; date_rdv: string; statut: string }[]
                const totalRdv = rdvs?.length ?? 0
                return (
                  <div key={patient.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8FAFB] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#0BA896] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {patient.nom?.[0] ?? '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#0C1E35]">{patient.prenom} {patient.nom}</div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        📞 {patient.telephone}
                        {patient.date_naissance && ` · 🎂 ${new Date(patient.date_naissance).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#0C1E35]">{totalRdv} RDV</div>
                      <div className="text-xs text-[#64748B]">Inscrit le {new Date(patient.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <Link href={`/dashboard/rdv/nouveau?telephone=${patient.telephone}&nom=${patient.nom}&prenom=${patient.prenom}`}
                      className="bg-[#E6F7F5] text-[#0BA896] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#0BA896] hover:text-white transition-colors">
                      + RDV
                    </Link>
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-12 text-center text-[#64748B]">Aucun patient enregistré</div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}