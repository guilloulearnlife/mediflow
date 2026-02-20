'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-[#0C1E35]">
            Medi<span className="text-[#0BA896]">Flow</span>
          </Link>
          <p className="text-sm text-[#64748B] mt-2">Espace professionnel</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E2EAF4] rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0C1E35] mb-1">Connexion</h2>
          <p className="text-sm text-[#64748B] mb-6">Accédez à votre tableau de bord</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-600 text-[#0C1E35] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@clinique.cm"
                required
                className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-600 text-[#0C1E35] mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors"
                />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0BA896] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#097A6E] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-6">
            Pas encore de compte ?{' '}
            <a href="mailto:contact@mediflow.cm" className="text-[#0BA896] font-600">
              Contactez-nous
            </a>
          </p>
        </div>

      </div>
    </main>
  )
}