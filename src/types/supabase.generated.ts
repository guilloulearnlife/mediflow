export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cliniques: {
        Row: {
          actif: boolean | null
          adresse: string | null
          created_at: string | null
          email: string | null
          horaires: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          nom: string
          specialites: string[] | null
          telephone: string | null
          updated_at: string | null
          ville: string | null
          whatsapp_number: string | null
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          created_at?: string | null
          email?: string | null
          horaires?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom: string
          specialites?: string[] | null
          telephone?: string | null
          updated_at?: string | null
          ville?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          created_at?: string | null
          email?: string | null
          horaires?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom?: string
          specialites?: string[] | null
          telephone?: string | null
          updated_at?: string | null
          ville?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      cliniques_horaires: {
        Row: {
          actif: boolean | null
          clinique_id: string
          created_at: string | null
          heure_fermeture: string
          heure_ouverture: string
          id: string
          jour_semaine: number
        }
        Insert: {
          actif?: boolean | null
          clinique_id: string
          created_at?: string | null
          heure_fermeture: string
          heure_ouverture: string
          id?: string
          jour_semaine: number
        }
        Update: {
          actif?: boolean | null
          clinique_id?: string
          created_at?: string | null
          heure_fermeture?: string
          heure_ouverture?: string
          id?: string
          jour_semaine?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliniques_horaires_clinique_id_fkey"
            columns: ["clinique_id"]
            isOneToOne: false
            referencedRelation: "cliniques"
            referencedColumns: ["id"]
          },
        ]
      }
      cliniques_osm_cache: {
        Row: {
          adresse: string | null
          cache_key: string
          id: string
          last_updated: string | null
          latitude: number | null
          longitude: number | null
          nom: string
          raw_tags: Json | null
          specialites: string[] | null
          telephone: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          cache_key: string
          id: string
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          nom: string
          raw_tags?: Json | null
          specialites?: string[] | null
          telephone?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          cache_key?: string
          id?: string
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          nom?: string
          raw_tags?: Json | null
          specialites?: string[] | null
          telephone?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      conversations_whatsapp: {
        Row: {
          clinique_id: string
          contexte: Json | null
          created_at: string | null
          derniere_activite: string | null
          etape: string | null
          id: string
          telephone: string
        }
        Insert: {
          clinique_id: string
          contexte?: Json | null
          created_at?: string | null
          derniere_activite?: string | null
          etape?: string | null
          id?: string
          telephone: string
        }
        Update: {
          clinique_id?: string
          contexte?: Json | null
          created_at?: string | null
          derniere_activite?: string | null
          etape?: string | null
          id?: string
          telephone?: string
        }
        Relationships: []
      }
      medecins_disponibilites: {
        Row: {
          created_at: string | null
          duree_consultation_minutes: number | null
          heure_debut: string
          heure_fin: string
          id: string
          jour_semaine: number
          medecin_id: string
        }
        Insert: {
          created_at?: string | null
          duree_consultation_minutes?: number | null
          heure_debut: string
          heure_fin: string
          id?: string
          jour_semaine: number
          medecin_id: string
        }
        Update: {
          created_at?: string | null
          duree_consultation_minutes?: number | null
          heure_debut?: string
          heure_fin?: string
          id?: string
          jour_semaine?: number
          medecin_id?: string
        }
        Relationships: []
      }
      messages_log: {
        Row: {
          clinique_id: string
          contenu: string | null
          email_destinataire: string | null
          envoye_at: string | null
          erreur_details: string | null
          evolution_api_id: string | null
          id: string
          lu_at: string | null
          patient_id: string | null
          rdv_id: string | null
          statut_envoi: string | null
          telephone_destinataire: string | null
          type_message: string | null
        }
        Insert: {
          clinique_id: string
          contenu?: string | null
          email_destinataire?: string | null
          envoye_at?: string | null
          erreur_details?: string | null
          evolution_api_id?: string | null
          id?: string
          lu_at?: string | null
          patient_id?: string | null
          rdv_id?: string | null
          statut_envoi?: string | null
          telephone_destinataire?: string | null
          type_message?: string | null
        }
        Update: {
          clinique_id?: string
          contenu?: string | null
          email_destinataire?: string | null
          envoye_at?: string | null
          erreur_details?: string | null
          evolution_api_id?: string | null
          id?: string
          lu_at?: string | null
          patient_id?: string | null
          rdv_id?: string | null
          statut_envoi?: string | null
          telephone_destinataire?: string | null
          type_message?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          adresse: string | null
          allergies: string | null
          antecedents_medicaux: string | null
          clinique_id: string
          created_at: string | null
          date_naissance: string | null
          email: string | null
          id: string
          nom: string
          prenom: string | null
          sexe: string | null
          telephone: string
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          allergies?: string | null
          antecedents_medicaux?: string | null
          clinique_id: string
          created_at?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          nom: string
          prenom?: string | null
          sexe?: string | null
          telephone: string
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          allergies?: string | null
          antecedents_medicaux?: string | null
          clinique_id?: string
          created_at?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          nom?: string
          prenom?: string | null
          sexe?: string | null
          telephone?: string
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          actif: boolean | null
          clinique_id: string | null
          created_at: string | null
          id: string
          nom: string | null
          prenom: string | null
          role: string
          specialite: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          clinique_id?: string | null
          created_at?: string | null
          id: string
          nom?: string | null
          prenom?: string | null
          role: string
          specialite?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          clinique_id?: string | null
          created_at?: string | null
          id?: string
          nom?: string | null
          prenom?: string | null
          role?: string
          specialite?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rendez_vous: {
        Row: {
          annule_at: string | null
          clinique_id: string
          created_at: string | null
          date_rdv: string
          heure_rdv: string
          id: string
          medecin: string | null
          medecin_id: string | null
          motif: string | null
          notes: string | null
          patient_id: string
          rappel_j1_at: string | null
          rappel_j1_envoye: boolean | null
          rappel_j3_at: string | null
          rappel_j3_envoye: boolean | null
          rappel_jour_at: string | null
          rappel_jour_envoye: boolean | null
          specialite: string | null
          statut: string | null
          termine_at: string | null
          updated_at: string | null
        }
        Insert: {
          annule_at?: string | null
          clinique_id: string
          created_at?: string | null
          date_rdv: string
          heure_rdv: string
          id?: string
          medecin?: string | null
          medecin_id?: string | null
          motif?: string | null
          notes?: string | null
          patient_id: string
          rappel_j1_at?: string | null
          rappel_j1_envoye?: boolean | null
          rappel_j3_at?: string | null
          rappel_j3_envoye?: boolean | null
          rappel_jour_at?: string | null
          rappel_jour_envoye?: boolean | null
          specialite?: string | null
          statut?: string | null
          termine_at?: string | null
          updated_at?: string | null
        }
        Update: {
          annule_at?: string | null
          clinique_id?: string
          created_at?: string | null
          date_rdv?: string
          heure_rdv?: string
          id?: string
          medecin?: string | null
          medecin_id?: string | null
          motif?: string | null
          notes?: string | null
          patient_id?: string
          rappel_j1_at?: string | null
          rappel_j1_envoye?: boolean | null
          rappel_j3_at?: string | null
          rappel_j3_envoye?: boolean | null
          rappel_jour_at?: string | null
          rappel_jour_envoye?: boolean | null
          specialite?: string | null
          statut?: string | null
          termine_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      rdv_du_jour: {
        Row: {
          clinique_nom: string | null
          date_rdv: string | null
          heure_rdv: string | null
          id: string | null
          medecin_nom: string | null
          motif: string | null
          patient_nom: string | null
          patient_telephone: string | null
          statut: string | null
        }
        Relationships: []
      }
      stats_cliniques: {
        Row: {
          id: string | null
          nom: string | null
          rdv_a_venir: number | null
          rdv_annules: number | null
          rdv_termines: number | null
          total_patients: number | null
          total_rdv: number | null
          ville: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_creneau_disponible: {
        Args: { p_clinique_id: string; p_date: string; p_heure: string; p_rdv_id?: string }
        Returns: boolean
      }
      cleanup_old_conversations: { Args: never; Returns: undefined }
      get_my_clinique_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_rdv_pour_rappels: {
        Args: { rappel_type: string }
        Returns: {
          clinique_nom: string
          date_rdv: string
          heure_rdv: string
          patient_nom: string
          patient_telephone: string
          rdv_id: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  N extends T extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[T["schema"]]["Tables"] & DatabaseWithoutInternals[T["schema"]]["Views"])
    : never = never,
> = T extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[T["schema"]]["Tables"] & DatabaseWithoutInternals[T["schema"]]["Views"])[N] extends { Row: infer R } ? R : never
  : T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never
  : never

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  N extends T extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[T["schema"]]["Tables"] : never = never,
> = T extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[T["schema"]]["Tables"][N] extends { Insert: infer I } ? I : never
  : T extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never
  : never

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  N extends T extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[T["schema"]]["Tables"] : never = never,
> = T extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[T["schema"]]["Tables"][N] extends { Update: infer U } ? U : never
  : T extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
  : never

export type Enums<
  T extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  N extends T extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[T["schema"]]["Enums"] : never = never,
> = T extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[T["schema"]]["Enums"][N]
  : T extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][T]
  : never

export const Constants = {
  public: { Enums: {} },
} as const
