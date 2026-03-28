'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { CheckCircle, MapPin, Phone, ArrowLeft, Loader2, Stethoscope } from 'lucide-react'

type Step = 1 | 2 | 3

interface CliniqueInfo {
  id: string
  nom: string
  adresse?: string
  ville?: string
  telephone?: string
  specialites?: string[]
}

interface Medecin {
  id: string
  nom: string | null
  prenom: string | null
}

function BookingContent() {
  const searchParams  = useSearchParams()
  const cliniqueId    = searchParams.get('clinique_id') || ''
  const cliniqueNom   = searchParams.get('clinique_nom') || ''
  const specialitePre = searchParams.get('specialite') || ''

  const supabase = createClient()

  const [step, setStep]       = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [clinique, setClinique] = useState<CliniqueInfo | null>(
    cliniqueNom ? { id: cliniqueId, nom: cliniqueNom } : null
  )
  const [medecins, setMedecins]                   = useState<Medecin[]>([])
  const [slotsDisponibles, setSlotsDisponibles]   = useState<string[]>([])
  const [tousCrenaux]                             = useState<string[]>([
    '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
    '14:00','14:30','15:00','15:30','16:00','16:30','17:00',
  ])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '',
    specialite: specialitePre,
    date_rdv: '', heure_rdv: '', motif: '',
    medecin: '',
  })

  // Charger clinique + médecins au montage
  useEffect(() => {
    if (!cliniqueId) return
    fetch(`/api/disponibilites?clinique_id=${cliniqueId}`)
      .then(r => r.json())
      .then(data => {
        setMedecins(data.medecins ?? [])
        if (data.medecins?.length > 0) {
          const m = data.medecins[0]
          setForm(f => ({ ...f, medecin: `Dr. ${m.prenom ?? ''} ${m.nom ?? ''}`.trim() }))
        }
        setSlotsDisponibles(data.tous_les_creneaux ?? [])
      })
    supabase
      .from('cliniques')
      .select('id, nom, adresse, ville, telephone, specialites')
      .eq('id', cliniqueId)
      .single()
      .then(({ data }) => { if (data) setClinique(data) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliniqueId])

  // Recharger les créneaux disponibles quand médecin ou date change
  useEffect(() => {
    if (!cliniqueId || !form.date_rdv || !form.medecin) return
    setLoadingSlots(true)
    setForm(f => ({ ...f, heure_rdv: '' }))
    fetch(`/api/disponibilites?clinique_id=${cliniqueId}&medecin=${encodeURIComponent(form.medecin)}&date=${form.date_rdv}`)
      .then(r => r.json())
      .then(data => {
        setSlotsDisponibles(data.slots_disponibles ?? data.tous_les_creneaux ?? [])
      })
      .finally(() => setLoadingSlots(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date_rdv, form.medecin])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      let resolvedCliniqueId = cliniqueId
      if (!resolvedCliniqueId) {
        const { data } = await supabase.from('cliniques').select('id').eq('actif', true).limit(1)
        resolvedCliniqueId = data?.[0]?.id
        if (!resolvedCliniqueId) throw new Error('Aucune clinique disponible')
      }

      const patient_id = crypto.randomUUID()
      const { error: pErr } = await supabase
        .from('patients')
        .insert({ id: patient_id, clinique_id: resolvedCliniqueId, nom: form.nom, prenom: form.prenom, telephone: form.telephone })
      if (pErr) throw pErr

      const { error: rdvErr } = await supabase
        .from('rendez_vous')
        .insert({
          clinique_id: resolvedCliniqueId,
          patient_id,
          date_rdv:   form.date_rdv,
          heure_rdv:  form.heure_rdv,
          specialite: form.specialite,
          motif:      form.motif || null,
          medecin:    form.medecin || null,
          statut:     'confirme',
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

  function resetForm() {
    setSuccess(false)
    setStep(1)
    setForm({ nom:'', prenom:'', telephone:'', specialite: specialitePre, date_rdv:'', heure_rdv:'', motif:'', medecin: medecins[0] ? `Dr. ${medecins[0].prenom ?? ''} ${medecins[0].nom ?? ''}`.trim() : '' })
  }

  // ── Succès ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen bg-[#060D1A] flex items-center justify-center p-8">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#00E5A0]/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#00E5A0]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">RDV confirmé !</h2>
          {clinique && <p className="text-[#00E5A0] font-bold mb-1">{clinique.nom}</p>}
          {form.medecin && <p className="text-white/60 text-sm mb-1">{form.medecin}</p>}
          <p className="text-white/50 text-sm mb-1">{form.prenom} {form.nom}</p>
          <p className="text-white font-bold mb-1">
            {new Date(form.date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {form.heure_rdv}
          </p>
          {form.specialite && <p className="text-white/40 text-sm mb-6">{form.specialite}</p>}
          <p className="text-white/30 text-xs mb-8">
            Un rappel WhatsApp sera envoyé 24h avant votre rendez-vous au +237 {form.telephone}
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={resetForm}
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

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors placeholder:text-white/20"

  return (
    <main className="min-h-screen bg-[#060D1A]">
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 bg-[#060D1A]/90 backdrop-blur z-40">
        <Link href="/" className="text-xl font-black text-white">Medi<span className="text-[#00E5A0]">Flow</span></Link>
        <Link href="/recherche" className="flex items-center gap-1 text-white/40 text-sm hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la recherche
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* Récap clinique */}
        {clinique && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#00E5A0]/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-[#00E5A0]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{clinique.nom}</p>
              {(clinique.adresse || clinique.ville) && (
                <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{[clinique.adresse, clinique.ville].filter(Boolean).join(', ')}</span>
                </p>
              )}
              {clinique.specialites && clinique.specialites.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {clinique.specialites.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] bg-[#00E5A0]/10 text-[#00E5A0] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
            </div>
            {clinique.telephone && (
              <a href={`tel:${clinique.telephone}`}
                className="flex-shrink-0 flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors">
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {(['Vos infos', 'Créneau', 'Confirmer'] as const).map((label, i) => {
            const s = i + 1
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step > s ? 'bg-[#00E5A0] text-[#060D1A]' : step === s ? 'bg-[#00E5A0] text-[#060D1A]' : 'bg-white/10 text-white/40'
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-bold hidden md:block ${step >= s ? 'text-white' : 'text-white/30'}`}>{label}</span>
                {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-[#00E5A0]' : 'bg-white/10'}`} />}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {/* STEP 1 : Infos patient */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-1">Vos informations</h2>
            <p className="text-white/40 text-sm mb-8">Pour créer ou retrouver votre dossier patient</p>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Nom *</label>
                  <input name="nom" value={form.nom} onChange={handleChange} placeholder="Nkomo" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Prénom *</label>
                  <input name="prenom" value={form.prenom} onChange={handleChange} placeholder="Jean" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Téléphone WhatsApp *</label>
                <div className="flex gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm flex-shrink-0">+237</div>
                  <input name="telephone" value={form.telephone} onChange={handleChange}
                    placeholder="677 123 456"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors placeholder:text-white/20" />
                </div>
                <p className="text-white/30 text-xs mt-2">Confirmation et rappel envoyés sur ce numéro</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Spécialité *</label>
                <input name="specialite" value={form.specialite} onChange={handleChange}
                  placeholder="Ex : Cardiologie, Dialyse, ORL…"
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Motif (optionnel)</label>
                <textarea name="motif" value={form.motif} onChange={handleChange}
                  placeholder="Décrivez brièvement votre motif de consultation…"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#00E5A0] transition-colors resize-none placeholder:text-white/20" />
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

        {/* STEP 2 : Médecin + créneau */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-1">Choisir un médecin et un créneau</h2>
            <p className="text-white/40 text-sm mb-8">
              Spécialité : <span className="text-[#00E5A0] font-bold">{form.specialite}</span>
            </p>
            <div className="flex flex-col gap-6">

              {/* Sélection médecin */}
              {medecins.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                    <Stethoscope className="inline w-3.5 h-3.5 mr-1.5" />
                    Médecin *
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {medecins.map(m => {
                      const label = `Dr. ${m.prenom ?? ''} ${m.nom ?? ''}`.trim()
                      const ini = `${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}`.toUpperCase()
                      const selected = form.medecin === label
                      return (
                        <button key={m.id} type="button"
                          onClick={() => setForm(f => ({ ...f, medecin: label, heure_rdv: '' }))}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                            selected
                              ? 'bg-[#00E5A0]/20 border border-[#00E5A0]/60 text-white'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/30'
                          }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            selected ? 'bg-[#00E5A0] text-[#060D1A]' : 'bg-white/10 text-white/60'
                          }`}>
                            {ini}
                          </div>
                          <span className="text-sm font-bold">{label}</span>
                          {selected && <CheckCircle className="w-4 h-4 text-[#00E5A0] ml-auto" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Date *</label>
                <input name="date_rdv" type="date" value={form.date_rdv} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputClass} />
              </div>

              {/* Créneaux disponibles */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                  Heure *
                  {loadingSlots && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
                  {!loadingSlots && form.date_rdv && (
                    <span className="ml-2 text-[#00E5A0] normal-case font-normal tracking-normal">
                      {slotsDisponibles.length} créneaux disponibles
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {tousCrenaux.map(h => {
                    const dispo = slotsDisponibles.includes(h)
                    const selected = form.heure_rdv === h
                    return (
                      <button key={h} type="button"
                        disabled={!dispo || !form.date_rdv}
                        onClick={() => dispo && setForm(f => ({ ...f, heure_rdv: h }))}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                          !form.date_rdv
                            ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                            : selected
                            ? 'bg-[#00E5A0] text-[#060D1A]'
                            : dispo
                            ? 'bg-white/5 border border-white/10 text-white/60 hover:border-[#00E5A0]/40'
                            : 'bg-white/3 border border-white/5 text-white/15 line-through cursor-not-allowed'
                        }`}>
                        {h}
                        {!dispo && form.date_rdv && (
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/20 leading-none">
                            Pris
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {!form.date_rdv && (
                  <p className="text-white/30 text-xs mt-2">Sélectionnez d&apos;abord une date pour voir les créneaux</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
                  ← Retour
                </button>
                <button
                  onClick={() => {
                    if (!form.date_rdv || !form.heure_rdv) {
                      setError('Veuillez choisir une date et un créneau disponible')
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

        {/* STEP 3 : Confirmation */}
        {step === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-1">Confirmer le RDV</h2>
            <p className="text-white/40 text-sm mb-8">Vérifiez les informations avant de confirmer</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 flex flex-col gap-3">
              {[
                { label: 'Clinique',    val: clinique?.nom || '—' },
                ...(form.medecin ? [{ label: 'Médecin', val: form.medecin }] : []),
                { label: 'Patient',    val: `${form.prenom} ${form.nom}` },
                { label: 'Téléphone', val: `+237 ${form.telephone}` },
                { label: 'Spécialité', val: form.specialite },
                { label: 'Date',      val: new Date(form.date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Heure',     val: form.heure_rdv },
                ...(form.motif ? [{ label: 'Motif', val: form.motif }] : []),
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-white/40 text-sm flex-shrink-0">{item.label}</span>
                  <span className="text-white font-bold text-sm text-right">{item.val}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#00E5A0]/10 border border-[#00E5A0]/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-[#00E5A0] text-xs">
                Un rappel WhatsApp sera envoyé 24h avant votre rendez-vous au +237 {form.telephone}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
                ← Modifier
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-[#00E5A0] text-[#060D1A] py-4 rounded-xl font-black hover:bg-[#00B87D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmation...</> : 'Confirmer le RDV'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060D1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00E5A0] animate-spin" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
