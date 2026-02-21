'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const heures = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00'
]

const specialites = [
  'Médecine générale', 'Cardiologie', 'Gynécologie', 'Pédiatrie',
  'Ophtalmologie', 'Dermatologie', 'Dentiste', 'Orthopédie'
]

type Step = 1 | 2 | 3 | 4

export default function BookingPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    // Patient
    nom: '', prenom: '', telephone: '', 
    // RDV
    specialite: '', medecin: 'Dr. Kamga',
    date_rdv: '', heure_rdv: '',
    motif: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const { data: cliniques } = await supabase.from('cliniques').select('id').limit(1)
      const clinique_id = cliniques?.[0]?.id
      if (!clinique_id) throw new Error('Aucune clinique disponible')

      // Créer ou trouver patient
      let patient_id: string
      const { data: existing } = await supabase
        .from('patients')
        .select('id')
        .eq('telephone', form.telephone)
        .limit(1)

      if (existing && existing.length > 0) {
        patient_id = existing[0].id
      } else {
        const { data: newPatient, error: pErr } = await supabase
          .from('patients')
          .insert({ clinique_id, nom: form.nom, prenom: form.prenom, telephone: form.telephone })
          .select('id')
          .single()
        if (pErr) throw pErr
        patient_id = newPatient.id
      }

      // Créer RDV
      const { error: rdvErr } = await supabase
        .from('rendez_vous')
        .insert({
          clinique_id, patient_id,
          date_rdv: form.date_rdv,
          heure_rdv: form.heure_rdv,
          motif: form.motif || form.specialite,
          medecin: form.medecin,
          statut: 'confirme',
        })

      if (rdvErr) throw rdvErr
      setSuccess(true)
    } catch (err) {
      setError('Erreur lors de la création du RDV. Réessayez.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // SUCCÈS
  if (success) {
    return (
      <main className="min-h-screen bg-[#060D1A] flex items-center justify-center p-8">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#00E5A0]/20 flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
          <h2 className="text-2xl font-black text-white mb-3">RDV confirmé !</h2>
          <p className="text-white/50 mb-2">
            {form.prenom} {form.nom} · {form.medecin}
          </p>
          <p className="text-[#00E5A0] font-bold mb-2">
            {new Date(form.date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {form.heure_rdv}
          </p>
          <p className="text-white/40 text-sm mb-8">
            Vous recevrez un rappel WhatsApp 24h avant votre rendez-vous.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setSuccess(false); setStep(1); setForm({ nom: '', prenom: '', telephone: '', specialite: '', medecin: 'Dr. Kamga', date_rdv: '', heure_rdv: '', motif: '' }) }}
              className="w-full bg-[#00E5A0] text-[#060D1A] py-3 rounded-xl font-black hover:bg-[#00B87D] transition-colors">
              Prendre un autre RDV
            </button>
            <Link href="/recherche"
              className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold text-center hover:bg-white/10 transition-colors">
              Retour à la recherche
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#060D1A]">

      {/* NAV */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-white">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </Link>
        <Link href="/recherche" className="text-white/40 text-sm hover:text-white transition-colors">
          ← Retour
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* PROGRESS */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s ? 'bg-[#00E5A0] text-[#060D1A]' : 'bg-white/10 text-white/40'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-bold hidden md:block ${step >= s ? 'text-white' : 'text-white/30'}`}>
                {s === 1 ? 'Vos infos' : s === 2 ? 'Choisir un créneau' : 'Confirmer'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#00E5A0]' : 'bg-white/10'}`}></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* STEP 1 - INFOS PATIENT */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-2">Vos informations</h2>
            <p className="text-white/40 text-sm mb-8">Pour créer ou retrouver votre dossier patient</p>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">Nom *</label>
                  <input name="nom" value={form.nom} onChange={handleChange}
                    placeholder="Nkomo"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors placeholder:text-white/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">Prénom *</label>
                  <input name="prenom" value={form.prenom} onChange={handleChange}
                    placeholder="Jean-Baptiste"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors placeholder:text-white/20" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">Téléphone WhatsApp *</label>
                <div className="flex gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm flex-shrink-0">
                    🇨🇲 +237
                  </div>
                  <input name="telephone" value={form.telephone} onChange={handleChange}
                    placeholder="677 123 456"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors placeholder:text-white/20" />
                </div>
                <p className="text-white/30 text-xs mt-2">📱 Vous recevrez votre confirmation et rappel sur ce numéro</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">Spécialité recherchée *</label>
                <select name="specialite" value={form.specialite} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors">
                  <option value="" className="bg-[#060D1A]">Choisir une spécialité</option>
                  {specialites.map(s => (
                    <option key={s} value={s} className="bg-[#060D1A]">{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (!form.nom || !form.prenom || !form.telephone || !form.specialite) {
                    setError('Veuillez remplir tous les champs obligatoires')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
                className="w-full bg-[#00E5A0] text-[#060D1A] py-4 rounded-xl font-black text-base hover:bg-[#00B87D] transition-colors mt-2">
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 - CRÉNEAU */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-2">Choisir un créneau</h2>
            <p className="text-white/40 text-sm mb-8">Spécialité : <span className="text-[#00E5A0] font-bold">{form.specialite}</span></p>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">Médecin</label>
                <select name="medecin" value={form.medecin} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors">
                  {['Dr. Kamga', 'Dr. Tchinda', 'Dr. Mbarga', 'Dr. Nguema', 'Dr. Fomba'].map(m => (
                    <option key={m} value={m} className="bg-[#060D1A]">{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">Date *</label>
                <input name="date_rdv" type="date" value={form.date_rdv} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-3">Heure *</label>
                <div className="grid grid-cols-5 gap-2">
                  {heures.map(h => (
                    <button key={h} type="button"
                      onClick={() => setForm({ ...form, heure_rdv: h })}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        form.heure_rdv === h
                          ? 'bg-[#00E5A0] text-[#060D1A]'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:border-[#00E5A0]/40'
                      }`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">Motif (optionnel)</label>
                <textarea name="motif" value={form.motif} onChange={handleChange}
                  placeholder="Décrivez brièvement votre motif de consultation..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors resize-none placeholder:text-white/20" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
                  ← Retour
                </button>
                <button
                  onClick={() => {
                    if (!form.date_rdv || !form.heure_rdv) {
                      setError('Veuillez choisir une date et une heure')
                      return
                    }
                    setError('')
                    setStep(3)
                  }}
                  className="flex-1 bg-[#00E5A0] text-[#060D1A] py-4 rounded-xl font-black hover:bg-[#00B87D] transition-colors">
                  Continuer →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - CONFIRMATION */}
        {step === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-2">Confirmer le RDV</h2>
            <p className="text-white/40 text-sm mb-8">Vérifiez les informations avant de confirmer</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 flex flex-col gap-4">
              {[
                { label: 'Patient', val: `${form.prenom} ${form.nom}` },
                { label: 'Téléphone', val: `+237 ${form.telephone}` },
                { label: 'Spécialité', val: form.specialite },
                { label: 'Médecin', val: form.medecin },
                { label: 'Date', val: new Date(form.date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Heure', val: form.heure_rdv },
                { label: 'Motif', val: form.motif || form.specialite },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">{item.label}</span>
                  <span className="text-white font-bold text-sm">{item.val}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#00E5A0]/10 border border-[#00E5A0]/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-[#00E5A0] text-xs font-bold">
                📱 Un rappel WhatsApp sera envoyé 24h avant votre rendez-vous au +237 {form.telephone}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
                ← Modifier
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-[#00E5A0] text-[#060D1A] py-4 rounded-xl font-black hover:bg-[#00B87D] transition-colors disabled:opacity-50">
                {loading ? 'Confirmation...' : '✓ Confirmer le RDV'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}