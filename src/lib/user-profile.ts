import { supabase } from '@/lib/supabase'
import { toWorkflowError, toUserMessage, UserFacingError, logError } from '@/lib/errors'
import { translateAuthError } from '@/lib/auth-errors'
import type { Profile } from '@/types/database'

/**
 * Kullanıcının kendi profili: okuma, güvenli güncelleme ve şifre değiştirme.
 * Güncelleme yalnızca update_my_profile RPC'si ile yapılır; kullanıcı kimliği,
 * rol, hesap durumu ve birim istemciden ASLA gönderilmez (kimlik sunucuda auth.uid()'dir).
 */

export const FULL_NAME_MAX_LENGTH = 200
export const PHONE_MAX_LENGTH = 32
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 72

const PHONE_PATTERN = /^[+\d\s()-]+$/

export interface ProfileDetails {
  profile: Profile
  villageName: string | null
  districtId: string | null
  districtName: string | null
  departmentName: string | null
}

/** Oturumdaki kullanıcının tam profili (köy/ilçe/birim adlarıyla). Profil yoksa null. */
export async function fetchMyProfileDetails(userId: string): Promise<ProfileDetails | null> {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw toWorkflowError(error, 'Profil bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.')
  if (!profile) return null

  let villageName: string | null = null
  let districtId: string | null = null
  let districtName: string | null = null
  let departmentName: string | null = null

  // İlişkili kayıtlar RLS nedeniyle (pasif kayıtlar) okunamayabilir; bu bir hata değildir.
  if (profile.village_id) {
    const { data } = await supabase
      .from('villages')
      .select('name, district_id, district:districts(name)')
      .eq('id', profile.village_id)
      .maybeSingle()
    if (data) {
      villageName = data.name
      districtId = data.district_id
      districtName = data.district?.name ?? null
    }
  }
  if (profile.department_id) {
    const { data } = await supabase.from('departments').select('name').eq('id', profile.department_id).maybeSingle()
    departmentName = data?.name ?? null
  }

  return { profile, villageName, districtId, districtName, departmentName }
}

export interface ProfileFormValues {
  fullName: string
  phone: string
}

/** Ad soyad ve telefon doğrulaması; hata yoksa null, varsa alan bazlı Türkçe mesajlar. */
export function validateProfileForm(values: ProfileFormValues): { fullName?: string; phone?: string } | null {
  const errors: { fullName?: string; phone?: string } = {}
  const name = values.fullName.trim()
  const phone = values.phone.trim()

  if (!name) errors.fullName = 'Lütfen adınızı ve soyadınızı girin.'
  else if (name.length > FULL_NAME_MAX_LENGTH) {
    errors.fullName = `Ad soyad en fazla ${FULL_NAME_MAX_LENGTH} karakter olabilir.`
  }

  if (phone) {
    if (phone.length > PHONE_MAX_LENGTH) errors.phone = `Telefon en fazla ${PHONE_MAX_LENGTH} karakter olabilir.`
    else if (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, '').length < 7) {
      errors.phone = 'Geçerli bir telefon numarası girin.'
    }
  }

  return Object.keys(errors).length > 0 ? errors : null
}

export interface ProfileUpdateInput extends ProfileFormValues {
  /** Yalnızca vatandaşlar için verilir; undefined ise köy bilgisine dokunulmaz. */
  villageId?: string | null
}

type UpdateMyProfileArgs = {
  p_full_name: string
  p_phone: string | null
  p_village_id?: string | null
  p_update_village?: boolean
}

/** RPC parametrelerini üretir. Yalnızca izin verilen alanlar bulunur. */
export function buildProfileUpdateArgs(input: ProfileUpdateInput): UpdateMyProfileArgs {
  const args: UpdateMyProfileArgs = {
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim() || null,
  }
  if (input.villageId !== undefined) {
    args.p_village_id = input.villageId
    args.p_update_village = true
  }
  return args
}

export async function updateMyProfile(input: ProfileUpdateInput): Promise<Profile> {
  const { data, error } = await supabase.rpc('update_my_profile', buildProfileUpdateArgs(input))
  if (error) throw toWorkflowError(error, 'Profil güncellenemedi. Lütfen daha sonra tekrar deneyin.')
  return data
}

export interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function validatePasswordForm(values: PasswordFormValues): { [K in keyof PasswordFormValues]?: string } | null {
  const errors: { [K in keyof PasswordFormValues]?: string } = {}
  if (!values.currentPassword) errors.currentPassword = 'Mevcut şifrenizi girin.'
  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`
  } else if (values.newPassword.length > MAX_PASSWORD_LENGTH) {
    errors.newPassword = `Yeni şifre en fazla ${MAX_PASSWORD_LENGTH} karakter olabilir.`
  } else if (values.currentPassword && values.newPassword === values.currentPassword) {
    errors.newPassword = 'Yeni şifre mevcut şifreden farklı olmalıdır.'
  }
  if (!errors.newPassword && values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Şifreler eşleşmiyor. Lütfen iki alana da aynı şifreyi girin.'
  }
  return Object.keys(errors).length > 0 ? errors : null
}

export const WRONG_CURRENT_PASSWORD_MESSAGE = 'Mevcut şifre doğrulanamadı. Lütfen kontrol edip tekrar deneyin.'

/**
 * Şifreyi değiştirir. Önce mevcut şifre Supabase Auth ile doğrulanır
 * (signInWithPassword; aynı kullanıcı için yeni bir oturum üretir, mevcut oturum korunur),
 * ardından auth.updateUser ile yeni şifre ayarlanır. Şifreler günlüğe yazılmaz.
 */
export async function changeMyPassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (reauthError) {
    logError('Şifre yeniden doğrulaması başarısız', reauthError.code ?? reauthError.status)
    const isCredentials = reauthError.code === 'invalid_credentials' || reauthError.status === 400
    throw new UserFacingError(isCredentials ? WRONG_CURRENT_PASSWORD_MESSAGE : toUserMessage(reauthError, translateAuthError(reauthError)))
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    logError('Şifre güncellenemedi', error.code ?? error.status)
    throw new UserFacingError(translateAuthError(error))
  }
}
