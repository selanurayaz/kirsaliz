import { supabase } from '@/lib/supabase'
import type { Department, District, RequestCategory, Village } from '@/types/database'

/**
 * Referans verisi erişim katmanı (yalnızca okuma).
 * Yazma işlemleri RLS ile aktif adminlere ayrılmıştır; yönetim ekranları sonraki aşamadır.
 * Hatalar çağıran tarafa fırlatılır.
 */

export async function fetchActiveDistricts(): Promise<District[]> {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function fetchVillagesByDistrict(districtId: string): Promise<Village[]> {
  const { data, error } = await supabase
    .from('villages')
    .select('*')
    .eq('district_id', districtId)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function fetchActiveDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function fetchActiveRequestCategories(): Promise<RequestCategory[]> {
  const { data, error } = await supabase
    .from('request_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}
