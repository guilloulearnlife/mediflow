'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export type Role = 'super_admin' | 'directeur' | 'gerant' | 'secretaire' | 'medecin'

interface NavbarProps {
  email: string
  role: Role
  cliniqueName?: string
  nomPrenom?: string
}

const navItems: Record<Role, { href: string; label: string; icon: string }[]> = {
  super_admin: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/rdv', label: 'Rendez-vous', icon: '📅' },
    { href: '/dashboard/rdv/nouveau', label: 'Nouveau RDV', icon: '➕' },
    { href: '/dashboard/patients', label: 'Patients', icon: '👥' },
    { href: '/dashboard/medecin', label: 'Médecins', icon: '🧑‍⚕️' },
    { href: '/dashboard/admin', label: 'Admin', icon: '⚙️' },
  ],
  directeur: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/rdv', label: 'Rendez-vous', icon: '📅' },
    { href: '/dashboard/patients', label: 'Patients', icon: '👥' },
    { href: '/dashboard/medecin', label: 'Médecins', icon: '🧑‍⚕️' },
  ],
  gerant: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/rdv', label: 'Rendez-vous', icon: '📅' },
    { href: '/dashboard/rdv/nouveau', label: 'Nouveau RDV', icon: '➕' },
    { href: '/dashboard/patients', label: 'Patients', icon: '👥' },
  ],
  secretaire: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/rdv', label: 'Rendez-vous', icon: '📅' },
    { href: '/dashboard/rdv/nouveau', label: 'Nouveau RDV', icon: '➕' },
    { href: '/dashboard/patients', label: 'Patients', icon: '👥' },
  ],
  medecin: [
    { href: '/dashboard/medecin', label: 'Mon espace', icon: '🩺' },
    { href: '/dashboard/rdv', label: 'Rendez-vous', icon: '📅' },
    { href: '/dashboard/patients', label: 'Patients', icon: '👥' },
  ],
}

const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  directeur: 'Directeur',
  gerant: 'Gérant',
  secretaire: 'Secrétaire',
  medecin: 'Médecin',
}

const roleColors: Record<Role, string> = {
  super_admin: 'text-purple-400',
  directeur: 'text-blue-400',
  gerant: 'text-yellow-400',
  secretaire: 'text-[#0BA896]',
  medecin: 'text-[#C8773A]',
}

export default function Navbar({ email, role, cliniqueName, nomPrenom }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const items = navItems[role] ?? navItems.secretaire

  return (
    <div className="bg-[#0C1E35] text-white flex items-center justify-between px-6 py-3 sticky top-0 z-50 shadow-lg">

      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-black">
          Medi<span className="text-[#0BA896]">Flow</span>
        </Link>
        {cliniqueName && (
          <span className="text-white/30 text-sm hidden md:block">· {cliniqueName}</span>
        )}
      </div>

      <nav className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                isActive ? 'bg-[#0BA896] text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}>
              <span>{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden md:block text-right">
          <div className="text-xs text-white/40">{nomPrenom ?? email}</div>
          <div className={`text-xs font-bold ${roleColors[role]}`}>{roleLabels[role]}</div>
        </div>
        <button onClick={handleLogout}
          className="bg-white/5 border border-white/10 text-white/60 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all">
          Déconnexion
        </button>
      </div>
    </div>
  )
}