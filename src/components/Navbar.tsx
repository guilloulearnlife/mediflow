'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Role = 'secretaire' | 'medecin' | 'admin'

interface NavbarProps {
  email: string
  role?: Role
  cliniqueName?: string
}

const navItems = {
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
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/rdv', label: 'Rendez-vous', icon: '📅' },
    { href: '/dashboard/rdv/nouveau', label: 'Nouveau RDV', icon: '➕' },
    { href: '/dashboard/patients', label: 'Patients', icon: '👥' },
    { href: '/dashboard/medecin', label: 'Médecins', icon: '🧑‍⚕️' },
  ],
}

export default function Navbar({ email, role = 'secretaire', cliniqueName }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const items = navItems[role]

  return (
    <div className="bg-[#0C1E35] text-white flex items-center justify-between px-6 py-3 sticky top-0 z-50 shadow-lg">
      
      {/* LOGO + CLINIQUE */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-black">
          Medi<span className="text-[#0BA896]">Flow</span>
        </Link>
        {cliniqueName && (
          <span className="text-white/30 text-sm hidden md:block">· {cliniqueName}</span>
        )}
      </div>

      {/* NAV LINKS */}
      <nav className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-600 transition-all ${
                isActive
                  ? 'bg-[#0BA896] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/8'
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* USER + LOGOUT */}
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-right">
          <div className="text-xs text-white/40">{email}</div>
          <div className="text-xs font-bold text-[#0BA896] capitalize">{role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-white/8 border border-white/10 text-white/60 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          Déconnexion
        </button>
      </div>

    </div>
  )
}