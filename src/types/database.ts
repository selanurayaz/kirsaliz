/**
 * Supabase veritabanı tipleri.
 * supabase/migrations/001_profiles.sql ve 002_reference_data.sql ile senkron tutulmalıdır.
 * (İleride `supabase gen types typescript` ile otomatik üretilebilir.)
 */

export type UserRole = 'citizen' | 'department_officer' | 'field_personnel' | 'admin'

export type Profile = {
  id: string
  full_name: string | null
  role: UserRole
  phone: string | null
  is_active: boolean
  department_id: string | null
  village_id: string | null
  created_at: string
  updated_at: string
}

export type District = {
  id: string
  name: string
  code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Village = {
  id: string
  district_id: string
  name: string
  population: number | null
  latitude: number | null
  longitude: number | null
  is_demo: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Department = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RequestCategory = {
  id: string
  department_id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      districts: {
        Row: District
        Insert: {
          id?: string
          name: string
          code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<District, 'id' | 'created_at'>>
        Relationships: []
      }
      villages: {
        Row: Village
        Insert: {
          id?: string
          district_id: string
          name: string
          population?: number | null
          latitude?: number | null
          longitude?: number | null
          is_demo?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Village, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'villages_district_id_fkey'
            columns: ['district_id']
            isOneToOne: false
            referencedRelation: 'districts'
            referencedColumns: ['id']
          },
        ]
      }
      departments: {
        Row: Department
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Department, 'id' | 'created_at'>>
        Relationships: []
      }
      request_categories: {
        Row: RequestCategory
        Insert: {
          id?: string
          department_id: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<RequestCategory, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'request_categories_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name?: string | null
          role?: UserRole
          phone?: string | null
          is_active?: boolean
          department_id?: string | null
          village_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_village_id_fkey'
            columns: ['village_id']
            isOneToOne: false
            referencedRelation: 'villages'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      user_role: UserRole
    }
    CompositeTypes: { [_ in never]: never }
  }
}
