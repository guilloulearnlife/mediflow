'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus, Check } from 'lucide-react'

const HEURES = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00',
]

const MEDECINS = [
  'Dr. Kamga', 'Dr. Tchinda', 'Dr. Mbarga', 'Dr. Nguema', 'Dr. Fomba',
]

export default function NouveauRdvPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '',
    date_rdv: new Date().toISOString().split('T')[0],
    heure_rdv: '08:00',
    motif: '', medecin: 'Dr. Kamga',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: cliniques } = await supabase.from('cliniques').select('id').limit(1)
      const clinique_id = cliniques?.[0]?.id
      if (!clinique_id) throw new Error('Aucune clinique trouvée')

      let patient_id: string
      const { data: existingPatients } = await supabase
        .from('patients')
        .select('id')
        .eq('telephone', form.telephone)
        .limit(1)

      if (existingPatients && existingPatients.length > 0) {
        patient_id = existingPatients[0].id
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({ clinique_id, nom: form.nom, prenom: form.prenom, telephone: form.telephone })
          .select('id')
          .single()
        if (patientError) throw patientError
        patient_id = newPatient.id
      }

      const { error: rdvError } = await supabase
        .from('rendez_vous')
        .insert({
          clinique_id,
          patient_id,
          date_rdv: form.date_rdv,
          heure_rdv: form.heure_rdv,
          motif: form.motif,
          medecin: form.medecin,
          statut: 'confirme',
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

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
            <CalendarPlus className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900">Nouveau rendez-vous</span>
          </div>
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
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom <span className="text-slate-400">*</span></label>
                  <input
                    name="nom" value={form.nom} onChange={handleChange} required
                    placeholder="Nkomo"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Prénom <span className="text-slate-400">*</span></label>
                  <input
                    name="prenom" value={form.prenom} onChange={handleChange} required
                    placeholder="Jean-Baptiste"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone <span className="text-slate-400">*</span></label>
                <input
                  name="telephone" value={form.telephone} onChange={handleChange} required
                  placeholder="677 123 456"
                  className={inputClass}
                />
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
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Date <span className="text-slate-400">*</span></label>
                  <input
                    name="date_rdv" type="date" value={form.date_rdv} onChange={handleChange} required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Heure <span className="text-slate-400">*</span></label>
                  <select name="heure_rdv" value={form.heure_rdv} onChange={handleChange} className={inputClass}>
                    {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Médecin <span className="text-slate-400">*</span></label>
                <select name="medecin" value={form.medecin} onChange={handleChange} className={inputClass}>
                  {MEDECINS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Motif de consultation</label>
                <textarea
                  name="motif" value={form.motif} onChange={handleChange}
                  placeholder="Bilan cardiaque, suivi hypertension..."
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
            <Check className="w-4 h-4" />
            {loading ? 'Création en cours...' : 'Créer le rendez-vous'}
          </button>

        </form>
      </div>
    </main>
  )
}
