'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus, Check, Loader2 } from 'lucide-react'

const HEURES = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00',
]

interface Props {
  cliniqueId: string
  medecins: { id: string; nom: string | null; prenom: string | null }[]
  defaultNom?: string
  defaultPrenom?: string
  defaultTelephone?: string
}

export default function NouveauRdvForm({ cliniqueId, medecins, defaultNom, defaultPrenom, defaultTelephone }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const defaultMedecin = medecins[0]
    ? `Dr. ${medecins[0].prenom ?? ''} ${medecins[0].nom ?? ''}`.trim()
    : ''

  const [form, setForm] = useState({
    nom:      defaultNom       ?? '',
    prenom:   defaultPrenom    ?? '',
    telephone: defaultTelephone ?? '',
    date_rdv:  new Date().toISOString().split('T')[0],
    heure_rdv: '08:00',
    motif:    '',
    medecin:  defaultMedecin,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let patient_id: string
      const { data: existing } = await supabase
        .from('patients')
        .select('id')
        .eq('telephone', form.telephone)
        .eq('clinique_id', cliniqueId)
        .limit(1)

      if (existing && existing.length > 0) {
        patient_id = existing[0].id
      } else {
        const newId = crypto.randomUUID()
        const { error: patientError } = await supabase
          .from('patients')
          .insert({ id: newId, clinique_id: cliniqueId, nom: form.nom, prenom: form.prenom, telephone: form.telephone })
        if (patientError) throw patientError
        patient_id = newId
      }

      const { error: rdvError } = await supabase
        .from('rendez_vous')
        .insert({
          clinique_id: cliniqueId,
          patient_id,
          date_rdv:  form.date_rdv,
          heure_rdv: form.heure_rdv,
          motif:     form.motif || null,
          medecin:   form.medecin || null,
          statut:    'confirme',
        })
      if (rdvError) throw rdvError

      router.push('/dashboard/rdv')
    } catch (err) {
      setError('Erreur lors de la création du RDV')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-400"

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
            <CalendarPlus className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Nouveau rendez-vous</span>
        </div>
        <Link
          href="/dashboard/rdv"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Patient */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
              Informations patient
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom *</label>
                  <input name="nom" value={form.nom} onChange={handleChange} required placeholder="Nkomo" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Prénom *</label>
                  <input name="prenom" value={form.prenom} onChange={handleChange} required placeholder="Jean-Baptiste" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone *</label>
                <input name="telephone" value={form.telephone} onChange={handleChange} required placeholder="677 123 456" className={inputClass} />
              </div>
            </div>
          </div>

          {/* RDV */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
              Détails du rendez-vous
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Date *</label>
                  <input name="date_rdv" type="date" value={form.date_rdv} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Heure *</label>
                  <select name="heure_rdv" value={form.heure_rdv} onChange={handleChange} className={inputClass}>
                    {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Médecin *</label>
                {medecins.length > 0 ? (
                  <select name="medecin" value={form.medecin} onChange={handleChange} className={inputClass}>
                    {medecins.map(m => {
                      const label = `Dr. ${m.prenom ?? ''} ${m.nom ?? ''}`.trim()
                      return <option key={m.id} value={label}>{label}</option>
                    })}
                  </select>
                ) : (
                  <input name="medecin" value={form.medecin} onChange={handleChange} placeholder="Nom du médecin" className={inputClass} />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Motif de consultation</label>
                <textarea
                  name="motif" value={form.motif} onChange={handleChange}
                  placeholder="Bilan, suivi, consultation..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : <><Check className="w-4 h-4" />Créer le rendez-vous</>}
          </button>
        </form>
      </div>
    </main>
  )
}
