import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  Building2, Users, CalendarDays, TrendingUp,
  UserPlus, ArrowRight, MapPin,
  ShieldCheck
} from 'lucide-react'

const roleConfig: Record<string, { label: string; classes: string }> = {
  super_admin: { label: 'Super Admin', classes: 'bg-violet-50 text-violet-700 border border-violet-200' },
  directeur:   { label: 'Directeur',   classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  gerant:      { label: 'Gérant',      classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
  secretaire:  { label: 'Secrétaire',  classes: 'bg-teal-50 text-teal-700 border border-teal-200' },
  medecin:     { label: 'Médecin',     classes: 'bg-sky-50 text-sky-700 border border-sky-200' },
}

const statusBar = [
  { label: 'Confirmés', statut: 'confirme', color: 'bg-blue-500' },
  { label: 'Terminés',  statut: 'termine',  color: 'bg-emerald-500' },
  { label: 'Absents',   statut: 'absent',   color: 'bg-red-400' },
  { label: 'Annulés',   statut: 'annule',   color: 'bg-slate-400' },
]

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: cliniques } = await supabase.from('cliniques').select('*')
  const { data: patients }  = await supabase.from('patients').select('id')
  const { data: rdvs }      = await supabase.from('rendez_vous').select('id, statut, date_rdv')
  const { data: profiles }  = await supabase.from('profiles').select('*, cliniques(nom)')

  const today        = new Date().toISOString().split('T')[0]
  const rdvAujourdhui = rdvs?.filter(r => r.date_rdv === today).length ?? 0
  const rdvTermines   = rdvs?.filter(r => r.statut === 'termine').length ?? 0
  const tauxPresence  = rdvs && rdvs.length > 0 ? Math.round((rdvTermines / rdvs.length) * 100) : 0

  const kpis = [
    { label: 'Cliniques actives', value: cliniques?.length ?? 0, Icon: Building2 },
    { label: 'Patients total',    value: patients?.length ?? 0,  Icon: Users },
    { label: "RDV aujourd'hui",   value: rdvAujourdhui,           Icon: CalendarDays },
    { label: 'Taux de présence',  value: `${tauxPresence}%`,      Icon: TrendingUp },
  ]

  const quickActions = [
    { label: 'Nouvelle clinique',   Icon: Building2,  href: '#',                          variant: 'default' },
    { label: 'Inviter utilisateur', Icon: UserPlus,   href: '/dashboard/admin/nouveau-user', variant: 'default' },
    { label: 'Voir tous les RDV',   Icon: CalendarDays, href: '/dashboard/rdv',            variant: 'default' },
    { label: 'Tous les patients',   Icon: Users,      href: '/dashboard/patients',         variant: 'default' },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar
        email={user.email!}
        role="super_admin"
        nomPrenom={profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : undefined}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Administration</h1>
            <p className="text-sm text-slate-400 mt-0.5">Vue globale MediFlow · {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Cliniques */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Cliniques <span className="text-slate-400 font-normal">({cliniques?.length ?? 0})</span>
              </h3>
              <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-colors duration-150">
                + Ajouter
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {cliniques && cliniques.length > 0 ? (
                cliniques.map((clinique) => (
                  <div key={clinique.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{clinique.nom}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {clinique.ville}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${clinique.actif ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${clinique.actif ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                      {clinique.actif ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Aucune clinique</p>
                </div>
              )}
            </div>
          </div>

          {/* Utilisateurs */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Utilisateurs <span className="text-slate-400 font-normal">({profiles?.length ?? 0})</span>
              </h3>
              <Link
                href="/dashboard/admin/nouveau-user"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-colors duration-150">
                + Inviter
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {profiles && profiles.length > 0 ? (
                profiles.map((p) => {
                  const clinique = p.cliniques as { nom: string } | null
                  const initials = `${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase() || '?'
                  const rc = roleConfig[p.role] ?? { label: p.role, classes: 'bg-slate-50 text-slate-600 border border-slate-200' }
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors duration-150">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {p.prenom} {p.nom}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {clinique?.nom ?? 'Aucune clinique'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0 ${rc.classes}`}>
                        {rc.label}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Aucun utilisateur</p>
                </div>
              )}
            </div>
          </div>

          {/* RDV par statut */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-slate-900 mb-6">
              Répartition des RDV <span className="text-slate-400 font-normal">({rdvs?.length ?? 0} total)</span>
            </h3>
            <div className="flex flex-col gap-4">
              {statusBar.map((s) => {
                const count = rdvs?.filter(r => r.statut === s.statut).length ?? 0
                const pct   = rdvs && rdvs.length > 0 ? Math.round((count / rdvs.length) * 100) : 0
                return (
                  <div key={s.statut}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-slate-500">{s.label}</span>
                      <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">{count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-slate-900 mb-5">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((a) => (
                <Link key={a.label} href={a.href}
                  className="flex items-center justify-between gap-2 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-150 group">
                  <div className="flex items-center gap-2.5">
                    <a.Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span className="text-xs font-medium text-slate-700">{a.label}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
