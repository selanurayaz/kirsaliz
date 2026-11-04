import { beforeEach, describe, expect, it, vi } from 'vitest'
import sql from '../../supabase/migrations/006_user_profile.sql?raw'

const rpc = vi.fn()
const signInWithPassword = vi.fn()
const updateUser = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { rpc, from: vi.fn(), auth: { signInWithPassword, updateUser } },
}))

const {
  buildProfileUpdateArgs,
  changeMyPassword,
  updateMyProfile,
  validatePasswordForm,
  validateProfileForm,
  WRONG_CURRENT_PASSWORD_MESSAGE,
} = await import('@/lib/user-profile')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildProfileUpdateArgs', () => {
  it('yalnızca izin verilen alanları gönderir; kimlik, rol, durum ve birim yoktur', () => {
    const args = buildProfileUpdateArgs({
      fullName: '  Ayşe Yılmaz ',
      phone: ' 0555 111 22 33 ',
      villageId: 'v-1',
      // İstemci kodu yanlışlıkla ek alan geçirse bile çıktıya sızmaz.
      ...({ id: 'other', role: 'admin', is_active: false, department_id: 'd' } as object),
    })
    expect(args).toEqual({
      p_full_name: 'Ayşe Yılmaz',
      p_phone: '0555 111 22 33',
      p_village_id: 'v-1',
      p_update_village: true,
    })
    const keys = Object.keys(args)
    for (const forbidden of ['p_user_id', 'p_id', 'p_role', 'p_is_active', 'p_department_id']) {
      expect(keys).not.toContain(forbidden)
    }
  })

  it('personel için köy alanına dokunmaz, boş telefonu null yapar', () => {
    expect(buildProfileUpdateArgs({ fullName: 'Ali', phone: '  ' })).toEqual({ p_full_name: 'Ali', p_phone: null })
  })

  it('vatandaşın köyünü temizlemesi açıkça null olarak gönderilir', () => {
    expect(buildProfileUpdateArgs({ fullName: 'Ali', phone: '', villageId: null })).toMatchObject({
      p_village_id: null,
      p_update_village: true,
    })
  })
})

describe('updateMyProfile', () => {
  it('update_my_profile RPC çağırır', async () => {
    rpc.mockResolvedValue({ data: { id: 'u' }, error: null })
    await updateMyProfile({ fullName: 'Ali', phone: '' })
    expect(rpc).toHaveBeenCalledWith('update_my_profile', { p_full_name: 'Ali', p_phone: null })
  })

  it('KZ iş kuralı hatasını Türkçe mesajla, diğerlerini genel mesajla fırlatır', async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'KZ001', message: 'Seçilen köy geçerli değil veya seçilemez.' },
    })
    await expect(updateMyProfile({ fullName: 'Ali', phone: '' })).rejects.toThrow('Seçilen köy geçerli değil')
    rpc.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'permission denied for table x' } })
    await expect(updateMyProfile({ fullName: 'Ali', phone: '' })).rejects.toThrow('Profil güncellenemedi')
  })
})

describe('validateProfileForm', () => {
  it('boş ad soyadı reddeder', () => {
    expect(validateProfileForm({ fullName: '   ', phone: '' })?.fullName).toBeDefined()
  })
  it('200 karakter üstü adı ve 32 karakter üstü telefonu reddeder', () => {
    expect(validateProfileForm({ fullName: 'a'.repeat(201), phone: '' })?.fullName).toBeDefined()
    expect(validateProfileForm({ fullName: 'Ali', phone: '1'.repeat(33) })?.phone).toBeDefined()
  })
  it('telefon isteğe bağlıdır ve geçerli biçimleri kabul eder', () => {
    expect(validateProfileForm({ fullName: 'Ali', phone: '' })).toBeNull()
    expect(validateProfileForm({ fullName: 'Ali', phone: '+90 (555) 111-22-33' })).toBeNull()
    expect(validateProfileForm({ fullName: 'Ali', phone: 'abc' })?.phone).toBeDefined()
  })
})

describe('validatePasswordForm', () => {
  const ok = { currentPassword: 'eski-sifre', newPassword: 'yeni-sifre-1', confirmPassword: 'yeni-sifre-1' }
  it('geçerli girişi kabul eder', () => expect(validatePasswordForm(ok)).toBeNull())
  it('kısa yeni şifreyi reddeder', () => {
    expect(validatePasswordForm({ ...ok, newPassword: 'kisa', confirmPassword: 'kisa' })?.newPassword).toContain('8')
  })
  it('eşleşmeyen onayı reddeder', () => {
    expect(validatePasswordForm({ ...ok, confirmPassword: 'baska-sifre' })?.confirmPassword).toContain('eşleşmiyor')
  })
  it('mevcut şifre zorunludur ve yeni şifre aynı olamaz', () => {
    expect(validatePasswordForm({ ...ok, currentPassword: '' })?.currentPassword).toBeDefined()
    expect(
      validatePasswordForm({ ...ok, newPassword: 'eski-sifre', confirmPassword: 'eski-sifre' })?.newPassword,
    ).toBeDefined()
  })
})

describe('changeMyPassword', () => {
  it('önce yeniden doğrular, sonra şifreyi günceller', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    updateUser.mockResolvedValue({ error: null })
    await changeMyPassword('a@b.test', 'eski', 'yeni-sifre-1')
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.test', password: 'eski' })
    expect(updateUser).toHaveBeenCalledWith({ password: 'yeni-sifre-1' })
    expect(signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(updateUser.mock.invocationCallOrder[0])
  })

  it('yeniden doğrulama başarısızsa şifreyi değiştirmez ve genel mesaj verir', async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' },
    })
    await expect(changeMyPassword('a@b.test', 'yanlis', 'yeni-sifre-1')).rejects.toThrow(WRONG_CURRENT_PASSWORD_MESSAGE)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('güncelleme hatasını Türkçe çevirir', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    updateUser.mockResolvedValue({ error: { code: 'weak_password', message: 'x' } })
    await expect(changeMyPassword('a@b.test', 'eski', 'yeni-sifre-1')).rejects.toThrow('Şifre yeterince güçlü değil')
  })
})

describe('006_user_profile.sql (sunucu tarafı kurallar)', () => {
  it('kullanıcı kimliğini yalnızca auth.uid() ile alır; kimlik parametresi yoktur', () => {
    expect(sql).toMatch(/v_uid\s+uuid := \(select auth\.uid\(\)\)/)
    expect(sql).not.toMatch(/p_user_id|p_role|p_is_active|p_department_id/)
  })
  it('köyün aktif, demo olmayan ve aktif ilçeye bağlı olmasını zorunlu kılar', () => {
    expect(sql).toMatch(/v\.is_active/)
    expect(sql).toMatch(/not v\.is_demo/)
    expect(sql).toMatch(/d\.is_active/)
    expect(sql).toMatch(/d\.id = v\.district_id/)
  })
  it('personelin köy değiştirmesini engeller ve yalnızca izin verilen sütunları yazar', () => {
    expect(sql).toMatch(/v_old\.role <> 'citizen'/)
    const update = sql.slice(sql.indexOf('update public.profiles p'), sql.indexOf('returning * into v_result'))
    expect(update).toMatch(/set full_name = v_name,\s+phone = v_phone,\s+village_id = v_village/)
    expect(update).not.toMatch(/role|is_active|department_id/)
  })
  it('security definer güvenli search_path kullanır ve anon erişimi kapatır', () => {
    expect(sql).toMatch(/security definer\s+set search_path = ''/)
    expect(sql).toMatch(/revoke all on function public\.update_my_profile\(text, text, uuid, boolean\) from public, anon/)
    expect(sql).toMatch(/begin;[\s\S]*commit;/)
  })
})
