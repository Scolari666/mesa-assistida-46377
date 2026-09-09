export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      addons: {
        Row: {
          id: string
          name: string
          price: number
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      product_addons: {
        Row: {
          product_id: string
          addon_id: string
          max_quantity: number
          sort_order: number
        }
        Insert: {
          product_id: string
          addon_id: string
          max_quantity?: number
          sort_order?: number
        }
        Update: {
          product_id?: string
          addon_id?: string
          max_quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          promo_price: number | null
          image_url: string | null
          is_combo: boolean
          active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          promo_price?: number | null
          image_url?: string | null
          is_combo?: boolean
          active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          promo_price?: number | null
          image_url?: string | null
          is_combo?: boolean
          active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          id: string
          product_id: string
          name: string
          price: number
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          price: number
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          price?: number
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_suggestions: {
        Row: {
          product_id: string
          suggested_product_id: string
          sort_order: number
        }
        Insert: {
          product_id: string
          suggested_product_id: string
          sort_order?: number
        }
        Update: {
          product_id?: string
          suggested_product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suggestions_suggested_product_id_fkey"
            columns: ["suggested_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_items: {
        Row: {
          combo_id: string
          item_product_id: string
          quantity: number
        }
        Insert: {
          combo_id: string
          item_product_id: string
          quantity?: number
        }
        Update: {
          combo_id?: string
          item_product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_items_item_product_id_fkey"
            columns: ["item_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          id: number
          store_name: string
          address_street: string
          address_number: string
          address_neighborhood: string | null
          address_city: string
          address_state: string
          address_zip: string
          store_lat: number
          store_lng: number
          delivery_fee_per_km: number
          max_delivery_radius_km: number
          online_discount_percent: number
          online_discount_min_order: number
          min_delivery_minutes: number
          max_delivery_minutes: number
          whatsapp_phone: string | null
          instagram_url: string | null
          facebook_url: string | null
          business_hours: Json
          updated_at: string
        }
        Insert: {
          id?: number
          store_name?: string
          address_street?: string
          address_number?: string
          address_neighborhood?: string | null
          address_city?: string
          address_state?: string
          address_zip?: string
          store_lat?: number
          store_lng?: number
          delivery_fee_per_km?: number
          max_delivery_radius_km?: number
          online_discount_percent?: number
          online_discount_min_order?: number
          min_delivery_minutes?: number
          max_delivery_minutes?: number
          whatsapp_phone?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          business_hours?: Json
          updated_at?: string
        }
        Update: {
          id?: number
          store_name?: string
          address_street?: string
          address_number?: string
          address_neighborhood?: string | null
          address_city?: string
          address_state?: string
          address_zip?: string
          store_lat?: number
          store_lng?: number
          delivery_fee_per_km?: number
          max_delivery_radius_km?: number
          online_discount_percent?: number
          online_discount_min_order?: number
          min_delivery_minutes?: number
          max_delivery_minutes?: number
          whatsapp_phone?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          business_hours?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          phone: string
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          label: string | null
          street: string
          number: string
          complement: string | null
          neighborhood: string | null
          city: string
          state: string
          zip: string | null
          reference: string | null
          lat: number
          lng: number
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          label?: string | null
          street: string
          number: string
          complement?: string | null
          neighborhood?: string | null
          city: string
          state: string
          zip?: string | null
          reference?: string | null
          lat: number
          lng: number
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          label?: string | null
          street?: string
          number?: string
          complement?: string | null
          neighborhood?: string | null
          city?: string
          state?: string
          zip?: string | null
          reference?: string | null
          lat?: number
          lng?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          customer_name: string
          customer_phone: string
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          address_id: string | null
          address_snapshot: Json | null
          distance_km: number | null
          delivery_fee: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          card_brand: string | null
          pay_online: boolean
          subtotal: number
          discount_amount: number
          total: number
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          customer_name: string
          customer_phone: string
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          address_id?: string | null
          address_snapshot?: Json | null
          distance_km?: number | null
          delivery_fee?: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          card_brand?: string | null
          pay_online?: boolean
          subtotal: number
          discount_amount?: number
          total: number
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          address_id?: string | null
          address_snapshot?: Json | null
          distance_km?: number | null
          delivery_fee?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          card_brand?: string | null
          pay_online?: boolean
          subtotal?: number
          discount_amount?: number
          total?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          variation_id: string | null
          variation_name: string | null
          unit_price: number
          quantity: number
          line_total: number
          notes: string | null
          addons: Json | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          variation_id?: string | null
          variation_name?: string | null
          unit_price: number
          quantity: number
          line_total: number
          notes?: string | null
          addons?: Json | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          variation_id?: string | null
          variation_name?: string | null
          unit_price?: number
          quantity?: number
          line_total?: number
          notes?: string | null
          addons?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_checkout_intents: {
        Row: {
          id: string
          checkout_session_id: string
          payload: Json
          order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          checkout_session_id: string
          payload: Json
          order_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          checkout_session_id?: string
          payload?: Json
          order_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_checkout_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_users_is_empty: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      compute_order_pricing: {
        Args: { payload: Json }
        Returns: Json
      }
      quote_order: {
        Args: { payload: Json }
        Returns: Json
      }
      get_order_by_stripe_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_store_open_at: {
        Args: { p_at: string }
        Returns: boolean
      }
      find_customer_by_phone: {
        Args: { p_phone: string }
        Returns: Json
      }
      create_order: {
        Args: { payload: Json }
        Returns: Json
      }
    }
    Enums: {
      order_status:
        | "received"
        | "preparing"
        | "out_for_delivery"
        | "ready_for_pickup"
        | "delivered"
        | "picked_up"
        | "cancelled"
      fulfillment_type: "delivery" | "pickup"
      payment_method: "pix" | "credit_card" | "cash"
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
      order_status: [
        "received",
        "preparing",
        "out_for_delivery",
        "ready_for_pickup",
        "delivered",
        "picked_up",
        "cancelled",
      ],
      fulfillment_type: ["delivery", "pickup"],
      payment_method: ["pix", "credit_card", "cash"],
    },
  },
} as const
