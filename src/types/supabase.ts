export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          restaurant_name: string
          email: string
          created_at: string
          plan_type: string
          updated_at: string
        }
        Insert: {
          id: string
          restaurant_name: string
          email: string
          created_at?: string
          plan_type?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_name?: string
          email?: string
          created_at?: string
          plan_type?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: string
          is_featured: boolean
          is_available: boolean
          image_url: string | null
          user_id: string
          created_at: string
          updated_at: string
          ingredients?: string[]
          preparation_time?: number
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category: string
          is_featured?: boolean
          is_available?: boolean
          image_url?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          ingredients?: string[]
          preparation_time?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category?: string
          is_featured?: boolean
          is_available?: boolean
          image_url?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          ingredients?: string[]
          preparation_time?: number
        }
      }
      calls: {
        Row: {
          id: string
          table_id: string
          table_number: string
          status: 'pending' | 'attended' | 'cancelled'
          created_at: string
          attended_at: string | null
          user_id: string
          notes?: string
        }
        Insert: {
          id?: string
          table_id: string
          table_number: string
          status?: 'pending' | 'attended' | 'cancelled'
          created_at?: string
          attended_at?: string | null
          user_id: string
          notes?: string
        }
        Update: {
          id?: string
          table_id?: string
          table_number?: string
          status?: 'pending' | 'attended' | 'cancelled'
          created_at?: string
          attended_at?: string | null
          user_id?: string
          notes?: string
        }
      }
      tables: {
        Row: {
          id: string
          table_number: string
          table_name: string
          is_active: boolean
          qr_code_data: string
          user_id: string
          created_at: string
          updated_at: string
          capacity?: number
          location?: string
        }
        Insert: {
          id?: string
          table_number: string
          table_name: string
          is_active?: boolean
          qr_code_data: string
          user_id: string
          created_at?: string
          updated_at?: string
          capacity?: number
          location?: string
        }
        Update: {
          id?: string
          table_number?: string
          table_name?: string
          is_active?: boolean
          qr_code_data?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          capacity?: number
          location?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      call_status: 'pending' | 'attended' | 'cancelled'
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert']
export type Call = Database['public']['Tables']['calls']['Row']
export type CallUpdate = Database['public']['Tables']['calls']['Update']
export type Table = Database['public']['Tables']['tables']['Row']
export type TableInsert = Database['public']['Tables']['tables']['Insert']
