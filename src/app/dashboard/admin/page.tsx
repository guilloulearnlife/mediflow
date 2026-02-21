import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Stats globales
  const { data: cliniques } = await supabase.from('cliniques').select('*')
  const { data: patients } = await supabase.from('patients').select('id')
  const { data: rdvs } = await supabase.from('rendez_vous').select('id, statut, date_rdv')
  const { data: profiles } = await supabase.from('profiles').select('*, cliniques(nom)')

  const today = new Date().toISOString().split('T')[0]
  const rdvAujourdhui = rdvs?.filter(r => r.date_rdv === today).length ?? 0
  const rdvTermines = rdvs?.filter(r => r.statut === 'termine').length ?? 0
  const tauxPresence = rdvs && rdvs.length > 0
    ? Math.round((rdvTermines / rdvs.length) * 100)
    : 0

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    directeur: 'bg-blue-100 text-blue-700',
    gerant: 'bg-yellow-100 text-yellow-700',
    secretaire: 'bg-teal-100 text-teal-700',
    medecin: 'bg-orange-100 text-orange-700',
  }

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    directeur: 'Directeur',
    gerant: 'Gérant',
    secretaire: 'Secrétaire',
    medecin: 'Médecin',
  }

  return (
    <main className="min-h-screen bg-[#0C0F1A]">
      <Navbar
        email={user.email!}
        role="super_admin"
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />

      <div className="p-8">

        {/* HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-xs font-bold mb-4">
            ⚙️ Super Admin · Accès total
          </div>
          <h2 className="text-3xl font-black text-white">Vue globale MediFlow</h2>
          <p className="text-white/40 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* KPI GLOBAUX */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Cliniques actives', val: cliniques?.length ?? 0, icon: '🏥', color: 'border-purple-500' },
            { label: 'Patients total', val: patients?.length ?? 0, icon: '👥', color: 'border-blue-500' },
            { label: 'RDV aujourd\'hui', val: rdvAujourdhui, icon: '📅', color: 'border-teal-500' },
            { label: 'Taux de présence', val: `${tauxPresence}%`, icon: '📊', color: 'border-orange-500' },
          ].map((k) => (
            <div key={k.label} className={`bg-white/5 border border-white/10 border-t-4 ${k.color} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-white/40">{k.label}</span>
                <span className="text-2xl">{k.icon}</span>
              </div>
              <div className="text-4xl font-black text-white">{k.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CLINIQUES */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-black">🏥 Cliniques ({cliniques?.length ?? 0})</h3>
              <button className="bg-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                + Ajouter
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {cliniques && cliniques.length > 0 ? (
                cliniques.map((clinique) => (
                  <div key={clinique.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl flex-shrink-0">
                      🏥
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">{clinique.nom}</div>
                      <div className="text-white/40 text-xs mt-0.5">📍 {clinique.ville}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${clinique.actif ? 'bg-teal-400 animate-pulse' : 'bg-red-400'}`}></div>
                      <span className={`text-xs font-bold ${clinique.actif ? 'text-teal-400' : 'text-red-400'}`}>
                        {clinique.actif ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-white/40">Aucune clinique</div>
              )}
            </div>
          </div>

          {/* UTILISATEURS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-black">👤 Utilisateurs ({profiles?.length ?? 0})</h3>
              <Link
                href="/dashboard/admin/nouveau-user"
                className="bg-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                + Inviter
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {profiles && profiles.length > 0 ? (
                profiles.map((p) => {
                  const clinique = p.cliniques as { nom: string } | null
                  return (
                    <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black flex-shrink-0">
                        {p.prenom?.[0] ?? p.nom?.[0] ?? '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm">
                          {p.prenom} {p.nom}
                        </div>
                        <div className="text-white/40 text-xs mt-0.5">
                          {clinique?.nom ?? 'Aucune clinique'}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleColors[p.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {roleLabels[p.role] ?? p.role}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="px-6 py-8 text-center text-white/40">Aucun utilisateur</div>
              )}
            </div>
          </div>

          {/* STATS RDV PAR STATUT */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-black mb-6">📊 RDV par statut ({rdvs?.length ?? 0} total)</h3>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Confirmés', statut: 'confirme', color: 'bg-blue-500', textColor: 'text-blue-400' },
                { label: 'Terminés', statut: 'termine', color: 'bg-teal-500', textColor: 'text-teal-400' },
                { label: 'Absents', statut: 'absent', color: 'bg-red-500', textColor: 'text-red-400' },
                { label: 'Annulés', statut: 'annule', color: 'bg-gray-500', textColor: 'text-gray-400' },
              ].map((s) => {
                const count = rdvs?.filter(r => r.statut === s.statut).length ?? 0
                const pct = rdvs && rdvs.length > 0 ? Math.round((count / rdvs.length) * 100) : 0
                return (
                  <div key={s.statut}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-white/60 text-sm">{s.label}</span>
                      <span className={`text-sm font-bold ${s.textColor}`}>{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ACTIONS RAPIDES */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-black mb-6">⚡ Actions rapides</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nouvelle clinique', icon: '🏥', href: '#', color: 'bg-purple-500/20 border-purple-500/30 text-purple-400' },
                { label: 'Inviter utilisateur', icon: '👤', href: '/dashboard/admin/nouveau-user', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
                { label: 'Voir tous les RDV', icon: '📅', href: '/dashboard/rdv', color: 'bg-teal-500/20 border-teal-500/30 text-teal-400' },
                { label: 'Tous les patients', icon: '👥', href: '/dashboard/patients', color: 'bg-orange-500/20 border-orange-500/30 text-orange-400' },
                { label: 'Page recherche', icon: '🔍', href: '/recherche', color: 'bg-pink-500/20 border-pink-500/30 text-pink-400' },
                { label: 'Exporter données', icon: '📥', href: '#', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' },
              ].map((a) => (
                <Link key={a.label} href={a.href}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${a.color} hover:opacity-80 transition-opacity`}>
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-xs font-bold">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}