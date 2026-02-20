export type Clinique = {
    id: string
    nom: string
    telephone: string | null
    ville: string | null
    whatsapp_number: string | null
    actif: boolean
    created_at: string
  }
  
  export type Patient = {
    id: string
    clinique_id: string
    nom: string
    prenom: string | null
    telephone: string
    date_naissance: string | null
    created_at: string
  }
  
  export type RendezVous = {
    id: string
    clinique_id: string
    patient_id: string
    date_rdv: string
    heure_rdv: string
    motif: string | null
    medecin: string | null
    statut: 'confirme' | 'annule' | 'termine' | 'absent'
    rappel_j3_envoye: boolean
    rappel_j1_envoye: boolean
    rappel_jour_envoye: boolean
    created_at: string
  }
  
  export type MessagesLog = {
    id: string
    clinique_id: string
    patient_id: string | null
    rdv_id: string | null
    type_message: string | null
    telephone_destinataire: string | null
    contenu: string | null
    statut_envoi: string
    envoye_at: string
  }
  
  export type ConversationWhatsapp = {
    id: string
    clinique_id: string
    telephone: string
    etape: string | null
    contexte: Record<string, unknown> | null
    derniere_activite: string
  }