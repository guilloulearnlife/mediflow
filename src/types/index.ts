export type { Clinique, Patient, RendezVous, MessagesLog, ConversationWhatsapp } from './database'

export type Role = 'super_admin' | 'directeur' | 'gerant' | 'secretaire' | 'medecin'

export type UserProfile = {
  id: string
  email: string
  role: Role
  clinique_id: string | null
  nom: string
  prenom: string | null
  specialite: string | null
}