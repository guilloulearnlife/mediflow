'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      // 1. Récupérer la clinique
      const { data: cliniques } = await supabase.from('cliniques').select('id').limit(1)
      const clinique_id = cliniques?.[0]?.id
      if (!clinique_id) throw new Error('Aucune clinique trouvée')

      // 2. Créer ou trouver le patient
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

      // 3. Créer le RDV
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

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#0C1E35]">
            Medi<span className="text-[#0BA896]">Flow</span>
            <span className="text-[#64748B] font-normal text-base ml-3">· Nouveau RDV</span>
          </h1>
        </div>
        <Link href="/dashboard/rdv" className="text-sm text-[#64748B] hover:text-[#0BA896]">
          ← Retour
        </Link>
      </div>

      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-[#E2EAF4] rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-black text-[#0C1E35] mb-6">Créer un rendez-vous</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#0C1E35] mb-2">Nom *</label>
                <input name="nom" value={form.nom} onChange={handleChange} required
                  placeholder="Nkomo"
                  className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0C1E35] mb-2">Prénom *</label>
                <input name="prenom" value={form.prenom} onChange={handleChange} required
                  placeholder="Jean-Baptiste"
                  className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0C1E35] mb-2">Téléphone *</label>
              <input name="telephone" value={form.telephone} onChange={handleChange} required
                placeholder="677123456"
                className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#0C1E35] mb-2">Date *</label>
                <input name="date_rdv" type="date" value={form.date_rdv} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0C1E35] mb-2">Heure *</label>
                <select name="heure_rdv" value={form.heure_rdv} onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors">
                  {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                    '14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0C1E35] mb-2">Médecin *</label>
              <select name="medecin" value={form.medecin} onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors">
                <option>Dr. Kamga</option>
                <option>Dr. Tchinda</option>
                <option>Dr. Mbarga</option>
                <option>Dr. Nguema</option>
                <option>Dr. Fomba</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0C1E35] mb-2">Motif de consultation</label>
              <textarea name="motif" value={form.motif} onChange={handleChange}
                placeholder="Bilan cardiaque, suivi hypertension..."
                rows={3}
                className="w-full px-4 py-3 border border-[#E2EAF4] rounded-xl text-sm text-[#0C1E35] outline-none focus:border-[#0BA896] transition-colors resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#0BA896] text-white py-4 rounded-xl font-black text-base hover:bg-[#097A6E] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Création en cours...' : '✓ Créer le rendez-vous'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}