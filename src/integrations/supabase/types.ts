export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          code_article: string | null
          created_at: string
          description: string | null
          designation: string
          id: string
          prix: number
          updated_at: string
        }
        Insert: {
          code_article?: string | null
          created_at?: string
          description?: string | null
          designation: string
          id?: string
          prix: number
          updated_at?: string
        }
        Update: {
          code_article?: string | null
          created_at?: string
          description?: string | null
          designation?: string
          id?: string
          prix?: number
          updated_at?: string
        }
        Relationships: []
      }
      bons_entree: {
        Row: {
          created_at: string
          date_bl: string
          fournisseur: string
          id: string
          montant_total: number
          notes: string | null
          numero_bl: string
          qr_code_data: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_bl: string
          fournisseur: string
          id: string
          montant_total?: number
          notes?: string | null
          numero_bl: string
          qr_code_data?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_bl?: string
          fournisseur?: string
          id?: string
          montant_total?: number
          notes?: string | null
          numero_bl?: string
          qr_code_data?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      groupes_bl: {
        Row: {
          created_at: string
          date_creation: string
          id: string
          montant_total: number
          nom: string
          nombre_bl: number
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_creation?: string
          id?: string
          montant_total?: number
          nom: string
          nombre_bl?: number
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_creation?: string
          id?: string
          montant_total?: number
          nom?: string
          nombre_bl?: number
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      liaison_groupe_bl: {
        Row: {
          bon_entree_id: string
          created_at: string
          groupe_id: string
          id: string
        }
        Insert: {
          bon_entree_id: string
          created_at?: string
          groupe_id: string
          id?: string
        }
        Update: {
          bon_entree_id?: string
          created_at?: string
          groupe_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liaison_groupe_bl_bon_entree_id_fkey"
            columns: ["bon_entree_id"]
            isOneToOne: false
            referencedRelation: "bons_entree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liaison_groupe_bl_groupe_id_fkey"
            columns: ["groupe_id"]
            isOneToOne: false
            referencedRelation: "groupes_bl"
            referencedColumns: ["id"]
          },
        ]
      }
      ligne_bon_entree: {
        Row: {
          article_id: string | null
          bon_entree_id: string
          created_at: string
          designation: string
          id: string
          montant_ligne: number
          prix_unitaire: number
          quantite: number
        }
        Insert: {
          article_id?: string | null
          bon_entree_id: string
          created_at?: string
          designation: string
          id?: string
          montant_ligne: number
          prix_unitaire: number
          quantite?: number
        }
        Update: {
          article_id?: string | null
          bon_entree_id?: string
          created_at?: string
          designation?: string
          id?: string
          montant_ligne?: number
          prix_unitaire?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "ligne_bon_entree_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ligne_bon_entree_bon_entree_id_fkey"
            columns: ["bon_entree_id"]
            isOneToOne: false
            referencedRelation: "bons_entree"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search_articles: {
        Args: { search_term: string }
        Returns: {
          id: string
          designation: string
          prix: number
        }[]
      }
      truncate_articles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      uuid_generate_v1: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v1mc: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v3: {
        Args: { namespace: string; name: string }
        Returns: string
      }
      uuid_generate_v4: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v5: {
        Args: { namespace: string; name: string }
        Returns: string
      }
      uuid_nil: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_dns: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_oid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_x500: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      payment_method: "cash" | "card" | "insurance"
      payment_status: "pending" | "paid" | "partial"
      voucher_status: "pending" | "processing" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: ["cash", "card", "insurance"],
      payment_status: ["pending", "paid", "partial"],
      voucher_status: ["pending", "processing", "completed", "cancelled"],
    },
  },
} as const
