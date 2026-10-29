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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      menu_items: {
        Row: {
          allergen_note: string | null
          avg_weight_grams: number | null
          created_at: string
          id: string
          image_path: string | null
          ingredients: string | null
          is_active: boolean
          name: string
          normal_price: number
          photo_url: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allergen_note?: string | null
          avg_weight_grams?: number | null
          created_at?: string
          id?: string
          image_path?: string | null
          ingredients?: string | null
          is_active?: boolean
          name: string
          normal_price: number
          photo_url?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allergen_note?: string | null
          avg_weight_grams?: number | null
          created_at?: string
          id?: string
          image_path?: string | null
          ingredients?: string | null
          is_active?: boolean
          name?: string
          normal_price?: number
          photo_url?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          avg_weight_snapshot: number | null
          created_at: string
          discount_price_snapshot: number
          id: string
          normal_price_snapshot: number
          picked_up_at: string | null
          pickup_token: string
          portion_id: string
          quantity: number
          slot_end: string | null
          slot_start: string | null
          status: Database["public"]["Enums"]["order_status"]
          student_id: string
        }
        Insert: {
          avg_weight_snapshot?: number | null
          created_at?: string
          discount_price_snapshot: number
          id?: string
          normal_price_snapshot: number
          picked_up_at?: string | null
          pickup_token?: string
          portion_id: string
          quantity: number
          slot_end?: string | null
          slot_start?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          student_id: string
        }
        Update: {
          avg_weight_snapshot?: number | null
          created_at?: string
          discount_price_snapshot?: number
          id?: string
          normal_price_snapshot?: number
          picked_up_at?: string | null
          pickup_token?: string
          portion_id?: string
          quantity?: number
          slot_end?: string | null
          slot_start?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_portion_id_fkey"
            columns: ["portion_id"]
            isOneToOne: false
            referencedRelation: "portions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portions: {
        Row: {
          cooked_at: string
          created_at: string
          discount_price: number
          expires_at: string
          id: string
          menu_item_id: string
          quantity_posted: number
          quantity_remaining: number
          release_at: string
          sell_window_minutes: number
          tenant_id: string
        }
        Insert: {
          cooked_at: string
          created_at?: string
          discount_price: number
          expires_at: string
          id?: string
          menu_item_id: string
          quantity_posted: number
          quantity_remaining: number
          release_at: string
          sell_window_minutes?: number
          tenant_id: string
        }
        Update: {
          cooked_at?: string
          created_at?: string
          discount_price?: number
          expires_at?: string
          id?: string
          menu_item_id?: string
          quantity_posted?: number
          quantity_remaining?: number
          release_at?: string
          sell_window_minutes?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portions_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          location_note: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          location_note?: string | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          location_note?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_report: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          money_saved: number
          portions_picked_up: number
          portions_posted: number
          revenue: number
          tenant_name: string
          waste_grams: number
        }[]
      }
      apply_as_tenant: {
        Args: { p_location_note?: string; p_name: string }
        Returns: {
          created_at: string
          id: string
          is_approved: boolean
          location_note: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_tenant: {
        Args: { p_tenant_id: string }
        Returns: {
          created_at: string
          id: string
          is_approved: boolean
          location_note: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_order: {
        Args: { p_order_id: string }
        Returns: {
          avg_weight_snapshot: number | null
          created_at: string
          discount_price_snapshot: number
          id: string
          normal_price_snapshot: number
          picked_up_at: string | null
          pickup_token: string
          portion_id: string
          quantity: number
          slot_end: string | null
          slot_start: string | null
          status: Database["public"]["Enums"]["order_status"]
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_pickup: {
        Args: { p_pickup_token: string }
        Returns: {
          avg_weight_snapshot: number | null
          created_at: string
          discount_price_snapshot: number
          id: string
          normal_price_snapshot: number
          picked_up_at: string | null
          pickup_token: string
          portion_id: string
          quantity: number
          slot_end: string | null
          slot_start: string | null
          status: Database["public"]["Enums"]["order_status"]
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      impact_summary: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          money_saved: number
          portions_saved: number
          posted: number
          revenue: number
          waste_grams: number
        }[]
      }
      my_orders: {
        Args: never
        Returns: {
          avg_weight_snapshot: number
          cooked_at: string
          created_at: string
          discount_price_snapshot: number
          menu_name: string
          normal_price_snapshot: number
          order_id: string
          picked_up_at: string
          pickup_eligible: boolean
          portion_id: string
          quantity: number
          slot_end: string
          slot_start: string
          status: Database["public"]["Enums"]["order_status"]
          tenant_location: string
          tenant_name: string
        }[]
      }
      own_tenant_id: { Args: never; Returns: string }
      place_order: {
        Args: {
          p_portion_id: string
          p_quantity: number
          p_slot_end?: string
          p_slot_start?: string
        }
        Returns: {
          avg_weight_snapshot: number | null
          created_at: string
          discount_price_snapshot: number
          id: string
          normal_price_snapshot: number
          picked_up_at: string | null
          pickup_token: string
          portion_id: string
          quantity: number
          slot_end: string | null
          slot_start: string | null
          status: Database["public"]["Enums"]["order_status"]
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      post_portion: {
        Args: {
          p_cooked_at: string
          p_discount_price: number
          p_menu_item_id: string
          p_quantity: number
          p_release_at?: string
          p_sell_window_minutes?: number
        }
        Returns: {
          cooked_at: string
          created_at: string
          discount_price: number
          expires_at: string
          id: string
          menu_item_id: string
          quantity_posted: number
          quantity_remaining: number
          release_at: string
          sell_window_minutes: number
          tenant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "portions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tenant_cancel_order: {
        Args: { p_order_id: string }
        Returns: {
          avg_weight_snapshot: number | null
          created_at: string
          discount_price_snapshot: number
          id: string
          normal_price_snapshot: number
          picked_up_at: string | null
          pickup_token: string
          portion_id: string
          quantity: number
          slot_end: string | null
          slot_start: string | null
          status: Database["public"]["Enums"]["order_status"]
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tenant_order_detail: {
        Args: { p_order_id: string }
        Returns: {
          buyer_cancelled: number
          buyer_name: string
          buyer_pickups: number
          cooked_at: string
          created_at: string
          discount_price_snapshot: number
          expires_at: string
          menu_name: string
          normal_price_snapshot: number
          order_id: string
          picked_up_at: string
          pickup_token: string
          quantity: number
          slot_end: string
          slot_start: string
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      update_portion: {
        Args: {
          p_cooked_at?: string
          p_discount_price?: number
          p_menu_item_id?: string
          p_portion_id: string
          p_quantity?: number
          p_release_at?: string
          p_sell_window_minutes?: number
        }
        Returns: {
          cooked_at: string
          created_at: string
          discount_price: number
          expires_at: string
          id: string
          menu_item_id: string
          quantity_posted: number
          quantity_remaining: number
          release_at: string
          sell_window_minutes: number
          tenant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "portions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_menu_item: {
        Args: {
          p_allergen_note?: string
          p_avg_weight_grams?: number
          p_id?: string
          p_image_path?: string
          p_ingredients?: string
          p_is_active?: boolean
          p_name: string
          p_normal_price: number
        }
        Returns: {
          allergen_note: string | null
          avg_weight_grams: number | null
          created_at: string
          id: string
          image_path: string | null
          ingredients: string | null
          is_active: boolean
          name: string
          normal_price: number
          photo_url: string | null
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "menu_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      order_status: "reserved" | "picked_up" | "cancelled"
      user_role: "student" | "tenant" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: ["reserved", "picked_up", "cancelled"],
      user_role: ["student", "tenant", "admin"],
    },
  },
} as const
