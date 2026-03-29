import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060D1A] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-black text-[#00E5A0] mb-4">404</h1>
        <h2 className="text-3xl font-black text-white mb-3">
          Page introuvable
        </h2>
        <p className="text-white/60 mb-8">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#060D1A] px-6 py-3 rounded-xl font-bold hover:bg-[#00c98c] transition-colors"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Link>
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
          >
            <Search className="w-4 h-4" />
            Recherche
          </Link>
        </div>
      </div>
    </div>
  )
}
