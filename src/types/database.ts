/**
 * Supabase veritabanı tipleri.
 * supabase/migrations/001_profiles.sql ile senkron tutulmalıdır.
 * (İleride `supabase gen types typescript` ile otomatik üretilebilir.)
 */

export type UserRole = 'citizen' | 'department_officer' | 'field_personnel' | 'admin'

export type Profile = {
  id: string
  full_name: string | null
  role: UserRole
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name?: string | null
          role?: UserRole
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      user_role: UserRole
    }
    CompositeTypes: { [_ in never]: never }
  }
}
