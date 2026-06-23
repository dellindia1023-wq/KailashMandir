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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          module_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          module_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          module_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      darshan_schedule: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          label: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          label?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          label?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          status: string
          tier: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          tier?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          tier?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_notification_prefs: {
        Row: {
          booking_enabled: boolean
          created_at: string
          id: string
          payment_enabled: boolean
          reminder_enabled: boolean
          system_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_enabled?: boolean
          created_at?: string
          id?: string
          payment_enabled?: boolean
          reminder_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_enabled?: boolean
          created_at?: string
          id?: string
          payment_enabled?: boolean
          reminder_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_name: string
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorite_pujas: {
        Row: {
          created_at: string
          id: string
          puja_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          puja_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          puja_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_pujas_puja_id_fkey"
            columns: ["puja_id"]
            isOneToOne: false
            referencedRelation: "pujas"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      live_stream_settings: {
        Row: {
          description: string | null
          id: string
          is_live: boolean
          stream_type: string
          stream_url: string
          title: string
          updated_at: string
          updated_by: string | null
          viewer_count: number
        }
        Insert: {
          description?: string | null
          id?: string
          is_live?: boolean
          stream_type?: string
          stream_url?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          viewer_count?: number
        }
        Update: {
          description?: string | null
          id?: string
          is_live?: boolean
          stream_type?: string
          stream_url?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          viewer_count?: number
        }
        Relationships: []
      }
      notices: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          expiry_date: string | null
          id: string
          is_active: boolean
          priority: Database["public"]["Enums"]["notice_priority"]
          publish_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          priority?: Database["public"]["Enums"]["notice_priority"]
          publish_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          priority?: Database["public"]["Enums"]["notice_priority"]
          publish_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          role: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          role?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          role?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pooja_samagri: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          item_name: string
          last_restocked_at: string | null
          min_stock_level: number
          price_per_unit: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          last_restocked_at?: string | null
          min_stock_level?: number
          price_per_unit?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          last_restocked_at?: string | null
          min_stock_level?: number
          price_per_unit?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      puja_bookings: {
        Row: {
          amount: number
          assigned_priest_id: string | null
          booking_date: string
          booking_status: string | null
          booking_time: string
          created_at: string
          devotee_gotra: string | null
          devotee_name: string
          id: string
          payment_id: string | null
          payment_status: string
          puja_id: string
          razorpay_order_id: string | null
          razorpay_signature: string | null
          special_instructions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          assigned_priest_id?: string | null
          booking_date: string
          booking_status?: string | null
          booking_time: string
          created_at?: string
          devotee_gotra?: string | null
          devotee_name: string
          id?: string
          payment_id?: string | null
          payment_status?: string
          puja_id: string
          razorpay_order_id?: string | null
          razorpay_signature?: string | null
          special_instructions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          assigned_priest_id?: string | null
          booking_date?: string
          booking_status?: string | null
          booking_time?: string
          created_at?: string
          devotee_gotra?: string | null
          devotee_name?: string
          id?: string
          payment_id?: string | null
          payment_status?: string
          puja_id?: string
          razorpay_order_id?: string | null
          razorpay_signature?: string | null
          special_instructions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puja_bookings_puja_id_fkey"
            columns: ["puja_id"]
            isOneToOne: false
            referencedRelation: "pujas"
            referencedColumns: ["id"]
          },
        ]
      }
      pujas: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      push_notification_prefs: {
        Row: {
          booking_enabled: boolean
          created_at: string
          id: string
          payment_enabled: boolean
          reminder_enabled: boolean
          system_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_enabled?: boolean
          created_at?: string
          id?: string
          payment_enabled?: boolean
          reminder_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_enabled?: boolean
          created_at?: string
          id?: string
          payment_enabled?: boolean
          reminder_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_change_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          reason: string | null
          requested_by: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          status: string
          target_user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_by: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          status?: string
          target_user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_by?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          status?: string
          target_user_id?: string
        }
        Relationships: []
      }
      saved_kundlis: {
        Row: {
          birth_date: string
          birth_name: string | null
          birth_place: string
          birth_time: string
          created_at: string
          id: string
          kundli_data: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date: string
          birth_name?: string | null
          birth_place: string
          birth_time: string
          created_at?: string
          id?: string
          kundli_data: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          birth_name?: string | null
          birth_place?: string
          birth_time?: string
          created_at?: string
          id?: string
          kundli_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _details?: Json
          _module_name: string
          _user_id?: string
        }
        Returns: undefined
      }
      reassign_super_admin: {
        Args: { new_super_admin_id: string; old_super_admin_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "priest" | "super_admin"
      notice_priority: "normal" | "important" | "urgent"
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
    Enums: {
      app_role: ["admin", "moderator", "user", "priest", "super_admin"],
      notice_priority: ["normal", "important", "urgent"],
    },
  },
} as const
