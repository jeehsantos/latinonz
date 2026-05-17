export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_hours: {
        Row: {
          business_id: string
          day_key: string
          id: string
          is_closed: boolean
          location: string
          slots: Json
        }
        Insert: {
          business_id: string
          day_key: string
          id?: string
          is_closed?: boolean
          location: string
          slots?: Json
        }
        Update: {
          business_id?: string
          day_key?: string
          id?: string
          is_closed?: boolean
          location?: string
          slots?: Json
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_photos: {
        Row: {
          business_id: string
          created_at: string
          id: string
          position: number
          storage_path: string
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          position?: number
          storage_path: string
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          position?: number
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_photos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          fast_responder: boolean
          google_place_id: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          keywords: string[] | null
          locations: string[] | null
          logo_url: string | null
          macro_category: string
          name: string
          owner_id: string
          phone: string | null
          rating: number
          response_time: string | null
          review_count: number
          slug: string
          subcategory: string | null
          tags: string[] | null
          type: string
          updated_at: string
          view_count: number
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          fast_responder?: boolean
          google_place_id?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          keywords?: string[] | null
          locations?: string[] | null
          logo_url?: string | null
          macro_category: string
          name: string
          owner_id: string
          phone?: string | null
          rating?: number
          response_time?: string | null
          review_count?: number
          slug: string
          subcategory?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          view_count?: number
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          fast_responder?: boolean
          google_place_id?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          keywords?: string[] | null
          locations?: string[] | null
          logo_url?: string | null
          macro_category?: string
          name?: string
          owner_id?: string
          phone?: string | null
          rating?: number
          response_time?: string | null
          review_count?: number
          slug?: string
          subcategory?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          view_count?: number
          website?: string | null
        }
        Relationships: []
      }
      google_reviews: {
        Row: {
          author_name: string
          author_photo_url: string | null
          business_id: string
          google_review_id: string
          id: string
          published_at: string | null
          rating: number
          synced_at: string
          text: string | null
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          business_id: string
          google_review_id: string
          id?: string
          published_at?: string | null
          rating: number
          synced_at?: string
          text?: string | null
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          business_id?: string
          google_review_id?: string
          id?: string
          published_at?: string | null
          rating?: number
          synced_at?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          plan_tier: string
          role: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          plan_tier?: string
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_tier?: string
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_options: {
        Row: {
          booking: boolean
          business_id: string
          delivery: boolean
          dinein: boolean
          other: string | null
          takeaway: boolean
        }
        Insert: {
          booking?: boolean
          business_id: string
          delivery?: boolean
          dinein?: boolean
          other?: string | null
          takeaway?: boolean
        }
        Update: {
          booking?: boolean
          business_id?: string
          delivery?: boolean
          dinein?: boolean
          other?: string | null
          takeaway?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_options_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          business_name: string
          created_at: string
          email: string
          id: string
          owner_name: string
          service_category: string
          whatsapp_number: string
        }
        Insert: {
          business_name: string
          created_at?: string
          email: string
          id?: string
          owner_name: string
          service_category: string
          whatsapp_number: string
        }
        Update: {
          business_name?: string
          created_at?: string
          email?: string
          id?: string
          owner_name?: string
          service_category?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
