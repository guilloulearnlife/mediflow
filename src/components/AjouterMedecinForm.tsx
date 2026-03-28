'use client'

import { useState, useTransition } from 'react'
import { creerMedecin } from '@/app/actions/medecin'
import { UserPlus, Loader2, X, Check, Eye, EyeOff } from 'lucide-react'

interface Props {
  cliniqueId: string
}

export default function AjouterMedecinForm({ cliniqueId }: Props) {
  const [open, setOpen] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Mot de passe minimum 8 caractères'); return }
    setError('')
    startTransition(async () => {
      try {
        await creerMedecin({ ...form, cliniqueId })
        setSuccess(true)
        setForm({ nom: '', prenom: '', email: '', password: '' })
        setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      }
    })
  }

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-400"

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-200 rounded-lg py-2.5 text-xs font-medium text-slate-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 transition-all duration-150"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Ajouter un médecin
        </button>
      ) : (
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-700">Nouveau médecin</span>
            <button onClick={() => { setOpen(false); setError('') }} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {success ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm py-2">
              <Check className="w-4 h-4" />
              Compte créé avec succès !
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Prénom *</label>
                  <input name="prenom" value={form.prenom} onChange={handleChange} required placeholder="Jean" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Nom *</label>
                  <input name="nom" value={form.nom} onChange={handleChange} required placeholder="Dupont" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="dr.dupont@clinique.cm" className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Mot de passe temporaire *</label>
                <div className="relative">
                  <input
                    name="password" type={showPwd ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} required
                    placeholder="Minimum 8 caractères"
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={pending}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 mt-1"
              >
                {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Création...</> : <><UserPlus className="w-3.5 h-3.5" />Créer le compte</>}
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                Partage les identifiants au médecin via WhatsApp
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
