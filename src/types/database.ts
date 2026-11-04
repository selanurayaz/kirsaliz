/**
 * Supabase veritabanı tipleri.
 * supabase/migrations/001_profiles.sql, 002_reference_data.sql, 003_service_requests.sql ve 004_staff_workflow.sql, 005 ve 006_user_profile.sql ile senkron tutulmalıdır.
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

export type ServiceRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'cancelled'

/** Vatandaşın kendi değerlendirmesi olan aciliyet düzeyi. */
export type RequestUrgency = 'low' | 'normal' | 'high'

export type ServiceRequest = {
  id: string
  tracking_code: string
  citizen_id: string
  village_id: string
  category_id: string
  department_id: string
  assigned_to: string | null
  title: string
  description: string
  address: string | null
  latitude: number | null
  longitude: number | null
  urgency: RequestUrgency
  status: ServiceRequestStatus
  resolved_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Tarayıcıdan gönderilebilen alanlar. citizen_id, department_id, status,
 * assigned_to, resolved_at ve tracking_code veritabanı tarafından belirlenir.
 */
export type ServiceRequestInsert = {
  village_id: string
  category_id: string
  title: string
  description: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  urgency?: RequestUrgency
}

export type ServiceRequestHistory = {
  id: string
  request_id: string
  status: ServiceRequestStatus
  note: string | null
  changed_by: string | null
  created_at: string
}

export type ServiceRequestAttachment = {
  id: string
  request_id: string
  owner_id: string
  storage_path: string
  original_name: string
  mime_type: string
  file_size: number
  created_at: string
}

/** owner_id gönderilmez; veritabanı tetikleyicisi auth.uid() ile doldurur. */
export type ServiceRequestAttachmentInsert = Pick<
  ServiceRequestAttachment,
  'request_id' | 'storage_path' | 'original_name' | 'mime_type' | 'file_size'
>

/** Liste ve detay sayfaları için ilişkili verilerle birleştirilmiş talep. */
export type ServiceRequestWithRelations = ServiceRequest & {
  category: Pick<RequestCategory, 'id' | 'name' | 'slug' | 'icon' | 'color'> | null
  department: Pick<Department, 'id' | 'name'> | null
  village: (Pick<Village, 'id' | 'name'> & { district: Pick<District, 'id' | 'name'> | null }) | null
}

/** Atanabilir saha personeli (get_available_field_personnel). */
export type FieldPersonnelOption = {
  id: string
  full_name: string | null
  department_id: string
  is_active: boolean
}

/** Talebe bağlı kişi adları (get_staff_request_people). */
export type StaffRequestPeople = {
  request_id: string
  citizen_name: string | null
  assigned_name: string | null
}

/** Kurum paneli liste satırı. */
export type StaffRequestListItem = ServiceRequestWithRelations & {
  assigned_name: string | null
  citizen_name: string | null
}

/** Kurum talep detayı. */
export type StaffRequestDetail = StaffRequestListItem

export type StaffRequestSummaryRow = { status: ServiceRequestStatus; total: number }

/** Duruma göre sayılar ve toplam. */
export type StaffRequestSummary = {
  counts: Record<ServiceRequestStatus, number>
  total: number
}

/** admin_list_users sonucu. */
export type AdminUserListItem = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  department_id: string | null
  department_name: string | null
  village_id: string | null
  is_active: boolean
  created_at: string
}

/** admin_update_user_access parametreleri (arayüz tarafı). */
export type AccessUpdatePayload = {
  userId: string
  role: UserRole
  departmentId: string | null
  isActive: boolean
}

export type ProfileAccessHistory = {
  id: string
  target_user_id: string | null
  changed_by: string | null
  old_role: UserRole
  new_role: UserRole
  old_department_id: string | null
  new_department_id: string | null
  old_is_active: boolean
  new_is_active: boolean
  created_at: string
}

type NoteArgs = { p_request_id: string; p_note?: string | null }

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
      service_requests: {
        Row: ServiceRequest
        Insert: ServiceRequestInsert
        Update: Partial<Pick<ServiceRequest, 'status' | 'assigned_to'>>
        Relationships: [
          {
            foreignKeyName: 'service_requests_village_id_fkey'
            columns: ['village_id']
            isOneToOne: false
            referencedRelation: 'villages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'service_requests_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'request_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'service_requests_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
      service_request_history: {
        Row: ServiceRequestHistory
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'service_request_history_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'service_requests'
            referencedColumns: ['id']
          },
        ]
      }
      service_request_attachments: {
        Row: ServiceRequestAttachment
        Insert: ServiceRequestAttachmentInsert
        Update: never
        Relationships: [
          {
            foreignKeyName: 'service_request_attachments_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'service_requests'
            referencedColumns: ['id']
          },
        ]
      }
      profile_access_history: {
        Row: ProfileAccessHistory
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      review_service_request: { Args: NoteArgs; Returns: undefined }
      start_service_request: { Args: NoteArgs; Returns: undefined }
      resolve_service_request: { Args: { p_request_id: string; p_note: string }; Returns: undefined }
      reject_service_request: { Args: { p_request_id: string; p_note: string }; Returns: undefined }
      cancel_my_service_request: { Args: NoteArgs; Returns: undefined }
      assign_service_request: {
        Args: { p_request_id: string; p_field_personnel_id: string; p_note?: string | null }
        Returns: undefined
      }
      get_available_field_personnel: {
        Args: { p_department_id: string }
        Returns: FieldPersonnelOption[]
      }
      get_staff_request_people: { Args: { p_request_ids: string[] }; Returns: StaffRequestPeople[] }
      get_staff_request_summary: {
        Args: { p_department_id?: string | null }
        Returns: StaffRequestSummaryRow[]
      }
      update_my_profile: {
        Args: {
          p_full_name: string
          p_phone: string | null
          p_village_id?: string | null
          p_update_village?: boolean
        }
        Returns: Profile
      }
      admin_list_users: { Args: Record<PropertyKey, never>; Returns: AdminUserListItem[] }
      admin_update_user_access: {
        Args: {
          p_user_id: string
          p_role: UserRole
          p_department_id: string | null
          p_is_active: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: UserRole
      service_request_status: ServiceRequestStatus
      request_urgency: RequestUrgency
    }
    CompositeTypes: { [_ in never]: never }
  }
}
