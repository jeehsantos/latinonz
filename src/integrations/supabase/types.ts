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
      app_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      business_branches: {
        Row: {
          address_street: string | null
          address_suburb: string | null
          business_id: string
          created_at: string
          id: string
          location: string
          phone: string | null
          position: number
          updated_at: string
        }
        Insert: {
          address_street?: string | null
          address_suburb?: string | null
          business_id: string
          created_at?: string
          id?: string
          location: string
          phone?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          address_street?: string | null
          address_suburb?: string | null
          business_id?: string
          created_at?: string
          id?: string
          location?: string
          phone?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
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
          address_street: string | null
          address_suburb: string | null
          category_group: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook_url: string | null
          fast_responder: boolean
          google_place_id: string | null
          id: string
          instagram_url: string | null
          is_active: boolean
          is_verified: boolean
          keywords: string[] | null
          language_preference: string
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
          updated_at: string
          view_count: number
          website: string | null
        }
        Insert: {
          address_street?: string | null
          address_suburb?: string | null
          category_group?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          fast_responder?: boolean
          google_place_id?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          is_verified?: boolean
          keywords?: string[] | null
          language_preference?: string
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
          updated_at?: string
          view_count?: number
          website?: string | null
        }
        Update: {
          address_street?: string | null
          address_suburb?: string | null
          category_group?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          fast_responder?: boolean
          google_place_id?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          is_verified?: boolean
          keywords?: string[] | null
          language_preference?: string
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
          updated_at?: string
          view_count?: number
          website?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          business_id: string
          code: string
          created_at: string
          description: string | null
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          promo_image_path: string | null
          promo_image_url: string | null
          title: string
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          promo_image_path?: string | null
          promo_image_url?: string | null
          title: string
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          promo_image_path?: string | null
          promo_image_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      profile_view_dedupe: {
        Row: {
          business_id: string
          day: string
          viewer_ip_hash: string
        }
        Insert: {
          business_id: string
          day: string
          viewer_ip_hash: string
        }
        Update: {
          business_id?: string
          day?: string
          viewer_ip_hash?: string
        }
        Relationships: []
      }
      profile_views_daily: {
        Row: {
          business_id: string
          day: string
          unique_viewers: number
          updated_at: string
          views: number
        }
        Insert: {
          business_id: string
          day: string
          unique_viewers?: number
          updated_at?: string
          views?: number
        }
        Update: {
          business_id?: string
          day?: string
          unique_viewers?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_daily_business_id_fkey"
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
      search_queries_daily: {
        Row: {
          category: string
          city: string
          day: string
          hits: number
          query: string
          updated_at: string
        }
        Insert: {
          category?: string
          city?: string
          day: string
          hits?: number
          query?: string
          updated_at?: string
        }
        Update: {
          category?: string
          city?: string
          day?: string
          hits?: number
          query?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_option_items: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          icon_key: string
          id: string
          position: number
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          icon_key?: string
          id?: string
          position?: number
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          icon_key?: string
          id?: string
          position?: number
          title?: string
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
      admin_set_business_plan: {
        Args: { _business_id: string; _plan: string }
        Returns: {
          owner_id: string
          plan_tier: string
        }[]
      }
      get_owner_plan_tier: { Args: { p_owner: string }; Returns: string }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      list_admin_managers: {
        Args: never
        Returns: {
          created_at: string
          id: string
          role: string
        }[]
      }
      record_profile_view: {
        Args: { _business_id: string; _viewer_ip_hash: string }
        Returns: undefined
      }
      record_search_query: {
        Args: { _category: string; _city: string; _query: string }
        Returns: undefined
      }
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
