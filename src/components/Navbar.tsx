'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  Users,
  Stethoscope,
  Settings,
  Building2,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

export type Role = 'super_admin' | 'directeur' | 'gerant' | 'secretaire' | 'medecin'

interface NavbarProps {
  email: string
  role: Role
  cliniqueName?: string
  nomPrenom?: string
}

interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
}

const navItems: Record<Role, NavItem[]> = {
  super_admin: [
    { href: '/dashboard',               label: 'Dashboard',      Icon: LayoutDashboard },
    { href: '/dashboard/rdv',           label: 'Rendez-vous',    Icon: Calendar },
    { href: '/dashboard/rdv/nouveau',   label: 'Nouveau RDV',    Icon: CalendarPlus },
    { href: '/dashboard/patients',      label: 'Patients',       Icon: Users },
    { href: '/dashboard/medecin',       label: 'Médecins',       Icon: Stethoscope },
    { href: '/dashboard/admin',         label: 'Admin',          Icon: Settings },
  ],
  directeur: [
    { href: '/dashboard',             label: 'Dashboard',    Icon: LayoutDashboard },
    { href: '/dashboard/rdv',         label: 'Rendez-vous',  Icon: Calendar },
    { href: '/dashboard/rdv/nouveau', label: 'Nouveau RDV',  Icon: CalendarPlus },
    { href: '/dashboard/patients',    label: 'Patients',     Icon: Users },
    { href: '/dashboard/clinique',    label: 'Ma clinique',  Icon: Building2 },
  ],
  gerant: [
    { href: '/dashboard',             label: 'Dashboard',    Icon: LayoutDashboard },
    { href: '/dashboard/rdv',         label: 'Rendez-vous',  Icon: Calendar },
    { href: '/dashboard/rdv/nouveau', label: 'Nouveau RDV',  Icon: CalendarPlus },
    { href: '/dashboard/patients',    label: 'Patients',     Icon: Users },
  ],
  secretaire: [
    { href: '/dashboard',             label: 'Dashboard',    Icon: LayoutDashboard },
    { href: '/dashboard/rdv',         label: 'Rendez-vous',  Icon: Calendar },
    { href: '/dashboard/rdv/nouveau', label: 'Nouveau RDV',  Icon: CalendarPlus },
    { href: '/dashboard/patients',    label: 'Patients',     Icon: Users },
  ],
  medecin: [
    { href: '/dashboard/medecin',  label: 'Mon espace',  Icon: Stethoscope },
    { href: '/dashboard/patients', label: 'Patients',    Icon: Users },
  ],
}

const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  directeur:   'Directeur',
  gerant:      'Gérant',
  secretaire:  'Secrétaire',
  medecin:     'Médecin',
}

const roleBadgeStyles: Record<Role, string> = {
  super_admin: 'bg-violet-500/15 text-violet-300',
  directeur:   'bg-blue-500/15 text-blue-300',
  gerant:      'bg-amber-500/15 text-amber-300',
  secretaire:  'bg-teal-500/15 text-teal-300',
  medecin:     'bg-sky-500/15 text-sky-300',
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
  const displayName = nomPrenom || email.split('@')[0]
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="bg-slate-950 border-b border-white/[0.06] sticky top-0 z-50">
      <div className="flex items-center justify-between h-14 px-6">

        {/* Left: Logo + clinic */}
        <div className="flex items-center gap-3 min-w-[160px]">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-white">
            Medi<span className="text-teal-400">Flow</span>
          </Link>
          {cliniqueName && (
            <>
              <span className="text-white/20 text-sm">/</span>
              <span className="text-white/40 text-xs truncate max-w-[120px]">{cliniqueName}</span>
            </>
          )}
        </div>

        {/* Center: Nav items */}
        <nav className="flex items-center gap-0.5">
          {items.map(({ href, label, Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden md:block">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right: User info + logout */}
        <div className="flex items-center gap-3 min-w-[160px] justify-end">
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 leading-tight truncate max-w-[100px]">{displayName}</div>
              <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${roleBadgeStyles[role]}`}>
                {roleLabels[role]}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/30 hover:text-red-400 transition-colors duration-150 p-2 rounded-lg hover:bg-red-500/10"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
