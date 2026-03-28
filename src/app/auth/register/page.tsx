'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const VILLES = [
  'Yaoundé','Douala','Garoua','Bamenda','Bafoussam','Maroua','Ngaoundéré',
  'Bertoua','Ebolowa','Kribi','Limbé','Buéa','Dschang','Kumba',
]

const TYPES = [
  'Hôpital général','Clinique privée','Centre de santé','Pharmacie',
  'Laboratoire d\'analyses','Cabinet médical','Maternité','Centre de dialyse',
  'Centre d\'imagerie','Autres',
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    // Compte
    email: '', password: '', confirm: '',
    // Établissement
    nomClinique: '', type: '', adresse: '', ville: '', telephone: '',
    // Responsable
    nom: '', prenom: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (form.password.length < 8) { setError('Mot de passe minimum 8 caractères'); return }

    setLoading(true)
    setError('')

    try {
      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authErr) throw authErr
      const userId = authData.user?.id
      if (!userId) throw new Error('Erreur lors de la création du compte')

      // 2. Créer la clinique
      const { data: cliniqueData, error: cliniqueErr } = await supabase
        .from('cliniques')
        .insert({
          nom:      form.nomClinique,
          adresse:  form.adresse,
          ville:    form.ville,
          telephone: form.telephone,
          actif:    true,
          specialites: [form.type].filter(Boolean),
        })
        .select('id')
        .single()
      if (cliniqueErr) throw cliniqueErr

      // 3. Créer le profil directeur
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({
          id:          userId,
          clinique_id: cliniqueData.id,
          role:        'directeur',
          nom:         form.nom,
          prenom:      form.prenom,
          telephone:   form.telephone,
        })
      if (profileErr) throw profileErr

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-[#0C1E35]">
            Medi<span className="text-[#0BA896]">Flow</span>
          </Link>
          <p className="text-sm text-[#64748B] mt-2">Inscription établissement de santé</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {['Votre établissement', 'Votre compte'].map((label, i) => {
            const s = i + 1
            return (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step >= s ? 'bg-[#0BA896] text-white' : 'bg-[#E2EAF4] text-[#64748B]'}`}>
                  {s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-[#0C1E35]' : 'text-[#64748B]'}`}>{label}</span>
                {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#0BA896]' : 'bg-[#E2EAF4]'}`} />}
              </div>
            )
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-[#E2EAF4] rounded-2xl p-8 shadow-sm">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* ── STEP 1 : Établissement ── */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-[#0C1E35] mb-1">Votre établissement</h2>
                  <p className="text-sm text-[#64748B]">Informations de votre clinique / hôpital</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Nom de l'établissement *</label>
                  <input name="nomClinique" value={form.nomClinique} onChange={handleChange} required
                    placeholder="Ex : Clinique du Lac, Hôpital Central…"
                    className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Type *</label>
                    <select name="type" value={form.type} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors bg-white">
                      <option value="">Choisir…</option>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Ville *</label>
                    <select name="ville" value={form.ville} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors bg-white">
                      <option value="">Choisir…</option>
                      {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Adresse</label>
                  <input name="adresse" value={form.adresse} onChange={handleChange}
                    placeholder="Rue, quartier…"
                    className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Téléphone *</label>
                  <div className="flex gap-3">
                    <div className="bg-[#F4F7FB] border border-[#E2EAF4] rounded-xl px-4 py-3 text-sm text-[#64748B] flex-shrink-0">+237</div>
                    <input name="telephone" value={form.telephone} onChange={handleChange} required
                      placeholder="677 123 456"
                      className="flex-1 px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                  </div>
                </div>

                <button type="button"
                  onClick={() => {
                    if (!form.nomClinique || !form.type || !form.ville || !form.telephone) { setError('Veuillez remplir tous les champs obligatoires'); return }
                    setError('')
                    setStep(2)
                  }}
                  className="w-full bg-[#0BA896] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#097A6E] transition-colors mt-2">
                  Continuer →
                </button>
              </div>
            )}

            {/* ── STEP 2 : Compte ── */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-[#0C1E35] mb-1">Votre compte</h2>
                  <p className="text-sm text-[#64748B]">Identifiants de connexion du directeur</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Nom *</label>
                    <input name="nom" value={form.nom} onChange={handleChange} required
                      placeholder="Nkomo"
                      className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Prénom *</label>
                    <input name="prenom" value={form.prenom} onChange={handleChange} required
                      placeholder="Jean"
                      className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Email professionnel *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required
                    placeholder="directeur@ma-clinique.cm"
                    className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Mot de passe *</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required
                    placeholder="Minimum 8 caractères"
                    className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0C1E35] mb-1.5 uppercase tracking-wide">Confirmer le mot de passe *</label>
                  <input name="confirm" type="password" value={form.confirm} onChange={handleChange} required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setError(''); setStep(1) }}
                    className="flex-1 bg-[#F4F7FB] border border-[#E2EAF4] text-[#0C1E35] py-3.5 rounded-xl font-bold text-sm hover:bg-[#E2EAF4] transition-colors">
                    ← Retour
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#0BA896] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#097A6E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : 'Créer mon compte'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-[#0BA896] font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
