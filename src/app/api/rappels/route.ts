/**
 * POST /api/rappels
 * Déclenché par n8n Schedule (quotidien, ex: 08h00)
 * Trouve les RDV nécessitant un rappel WhatsApp et les envoie.
 *
 * Rappels gérés :
 *  - J-3 : 3 jours avant le RDV
 *  - J-1 : la veille
 *  - Jour J : le jour même (matin)
 *
 * Variables d'environnement requises :
 *  RAPPELS_SECRET_KEY       — clé de sécurité pour autoriser l'appel
 *  WHATSAPP_WEBHOOK_URL     — URL du webhook n8n / Evolution API qui envoie le message
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDateFR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function buildMessage(type: 'j3' | 'j1' | 'jour', rdv: {
  date_rdv: string; heure_rdv: string; medecin?: string | null;
  patients: { nom: string; prenom: string | null } | null;
  cliniques: { nom: string; telephone?: string | null } | null;
}): string {
  const patient  = rdv.patients
  const clinique = rdv.cliniques
  const prenom   = patient?.prenom ?? ''
  const nom      = patient?.nom ?? ''
  const date     = formatDateFR(rdv.date_rdv)
  const heure    = rdv.heure_rdv.slice(0, 5)
  const lieu     = clinique?.nom ?? 'la clinique'
  const medecin  = rdv.medecin ? `\nMédecin : ${rdv.medecin}` : ''

  const intro = {
    j3:   `Bonjour ${prenom} ${nom} 👋\n\nRappel : vous avez un rendez-vous dans *3 jours*`,
    j1:   `Bonjour ${prenom} ${nom} 👋\n\nRappel : votre rendez-vous est *demain*`,
    jour: `Bonjour ${prenom} ${nom} 👋\n\n⏰ Rappel : votre rendez-vous est *aujourd'hui*`,
  }[type]

  return `${intro}\n📅 ${date} à ${heure}\n🏥 ${lieu}${medecin}\n\nEn cas d'empêchement, contactez la clinique au ${clinique?.telephone ?? '—'}.\n\n_MediFlow_`
}

export async function POST(req: NextRequest) {
  // Vérification de la clé secrète
  const secret = req.headers.get('x-rappels-key') ?? ''
  if (secret !== process.env.RAPPELS_SECRET_KEY) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const j1    = addDays(today, 1)
  const j3    = addDays(today, 3)

  // Charger les RDV à rappeler
  const { data: rdvs, error } = await supabaseAdmin
    .from('rendez_vous')
    .select(`
      id, date_rdv, heure_rdv, statut, medecin,
      rappel_j3_envoye, rappel_j1_envoye, rappel_jour_envoye,
      patients ( nom, prenom, telephone ),
      cliniques ( nom, telephone )
    `)
    .eq('statut', 'confirme')
    .in('date_rdv', [today, j1, j3])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL
  const results: { rdvId: string; type: string; telephone: string; sent: boolean }[] = []

  for (const rdv of rdvs ?? []) {
    const patient = (Array.isArray(rdv.patients) ? rdv.patients[0] : rdv.patients) as { nom: string; prenom: string | null; telephone: string } | null
    if (!patient?.telephone) continue

    const tasks: { type: 'j3' | 'j1' | 'jour'; flag: string; shouldSend: boolean }[] = [
      { type: 'j3',   flag: 'rappel_j3_envoye',   shouldSend: rdv.date_rdv === j3   && !rdv.rappel_j3_envoye },
      { type: 'j1',   flag: 'rappel_j1_envoye',   shouldSend: rdv.date_rdv === j1   && !rdv.rappel_j1_envoye },
      { type: 'jour', flag: 'rappel_jour_envoye',  shouldSend: rdv.date_rdv === today && !rdv.rappel_jour_envoye },
    ]

    for (const task of tasks) {
      if (!task.shouldSend) continue

      const clinique = (Array.isArray(rdv.cliniques) ? rdv.cliniques[0] : rdv.cliniques) as { nom: string; telephone?: string | null } | null
      const message = buildMessage(task.type, {
        date_rdv:  rdv.date_rdv,
        heure_rdv: rdv.heure_rdv,
        medecin:   rdv.medecin,
        patients:  patient,
        cliniques: clinique,
      })
      const telephone = patient.telephone.replace(/\D/g, '')
      const fullPhone = telephone.startsWith('237') ? telephone : `237${telephone}`
      let sent = false

      // Envoyer via webhook (n8n ou Evolution API)
      if (webhookUrl) {
        try {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telephone: fullPhone, message, rdv_id: rdv.id, type: task.type }),
          })
          sent = res.ok
        } catch {
          sent = false
        }
      }

      // Marquer le rappel comme envoyé (même si webhook absent, pour éviter les doublons)
      await supabaseAdmin.from('rendez_vous').update({ [task.flag]: true }).eq('id', rdv.id)

      // Logger dans messages_log
      await supabaseAdmin.from('messages_log').insert({
        clinique_id:           rdv.cliniques ? (rdv as { clinique_id?: string }).clinique_id : null,
        rdv_id:                rdv.id,
        type_message:          `rappel_${task.type}`,
        telephone_destinataire: fullPhone,
        contenu:               message,
        statut_envoi:          sent ? 'envoye' : (webhookUrl ? 'echec' : 'simule'),
      })

      results.push({ rdvId: rdv.id, type: task.type, telephone: fullPhone, sent })
    }
  }

  return NextResponse.json({
    success: true,
    traites: results.length,
    rappels: results,
  })
}

// GET : sanity check pour vérifier que l'endpoint est actif
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/rappels', methode: 'POST' })
}
