import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RdvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rdvs } = await supabase
    .from('rendez_vous')
    .select('*, patients(nom, prenom, telephone)')
    .order('date_rdv', { ascending: false })
    .order('heure_rdv', { ascending: true })
    .limit(50)

  const statusConfig = {
    confirme: { label: 'Confirmé', bg: 'bg-blue-50', text: 'text-blue-600' },
    termine: { label: 'Terminé', bg: 'bg-green-50', text: 'text-green-600' },
    annule: { label: 'Annulé', bg: 'bg-gray-50', text: 'text-gray-400' },
    absent: { label: 'Absent', bg: 'bg-red-50', text: 'text-red-500' },
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#0C1E35]">
            Medi<span className="text-[#0BA896]">Flow</span>
            <span className="text-[#64748B] font-normal text-base ml-3">· Rendez-vous</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">{rdvs?.length ?? 0} rendez-vous au total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-[#64748B] hover:text-[#0BA896] transition-colors">
            ← Dashboard
          </Link>
          <Link
            href="/dashboard/rdv/nouveau"
            className="bg-[#0BA896] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#097A6E] transition-colors"
          >
            + Nouveau RDV
          </Link>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white border border-[#E2EAF4] rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-[#E2EAF4]">
            {rdvs && rdvs.length > 0 ? (
              rdvs.map((rdv) => {
                const patient = rdv.patients as { nom: string; prenom: string; telephone: string } | null
                const s = statusConfig[rdv.statut as keyof typeof statusConfig] ?? statusConfig.confirme
                return (
                  <div key={rdv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8FAFB] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#0BA896] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {patient?.nom?.[0] ?? '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#0C1E35]">
                        {patient?.prenom} {patient?.nom}
                      </div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        {rdv.motif} · {rdv.medecin} · {patient?.telephone}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#0C1E35]">
                      {new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-sm text-[#64748B]">{rdv.heure_rdv.slice(0, 5)}</div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-12 text-center text-[#64748B]">Aucun rendez-vous</div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}