import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthTestProvider, makeAuth, makeProfile } from '@/test/auth'
import type { ProfileDetails } from '@/lib/user-profile'
import type { UserRole } from '@/types/database'

const fetchMyProfileDetails = vi.fn()
const updateMyProfile = vi.fn()
const changeMyPassword = vi.fn()
const fetchActiveDistricts = vi.fn()
const fetchVillagesByDistrict = vi.fn()

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/reference-data', () => ({ fetchActiveDistricts, fetchVillagesByDistrict }))
vi.mock('@/lib/user-profile', async () => {
  const actual = await vi.importActual<typeof import('@/lib/user-profile')>('@/lib/user-profile')
  return { ...actual, fetchMyProfileDetails, updateMyProfile, changeMyPassword }
})

const { ProfilePage } = await import('@/pages/ProfilePage')

const districts = [
  { id: 'd1', name: 'Merkez', code: null, is_active: true, created_at: '', updated_at: '' },
  { id: 'd2', name: 'Palu', code: null, is_active: true, created_at: '', updated_at: '' },
]
const village = (id: string, name: string, district_id: string) => ({
  id,
  name,
  district_id,
  population: null,
  latitude: null,
  longitude: null,
  is_demo: false,
  is_active: true,
  created_at: '',
  updated_at: '',
})

function details(role: UserRole, overrides: Partial<ProfileDetails> = {}): ProfileDetails {
  return {
    profile: makeProfile(role, { full_name: 'Ayşe Yılmaz', phone: '05551112233' }),
    villageName: null,
    districtId: null,
    districtName: null,
    departmentName: null,
    ...overrides,
  }
}

function renderPage(role: UserRole, refreshProfile = vi.fn(async () => {})) {
  render(
    <AuthTestProvider value={makeAuth(role, { refreshProfile })}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </AuthTestProvider>,
  )
  return { refreshProfile }
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchActiveDistricts.mockResolvedValue(districts)
  fetchVillagesByDistrict.mockImplementation(async (id: string) =>
    id === 'd1' ? [village('v1', 'Akçakiraz', 'd1')] : [village('v2', 'Yenice', 'd2')],
  )
})

describe('ProfilePage', () => {
  it('hesap özetini salt okunur gösterir (e-posta, rol, durum, birim)', async () => {
    fetchMyProfileDetails.mockResolvedValue(details('department_officer', { departmentName: 'Su ve Kanal Hizmetleri' }))
    renderPage('department_officer')
    expect(await screen.findByRole('heading', { name: 'Profilim', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('test@example.test')).toBeInTheDocument()
    expect(screen.getAllByText('Birim Yetkilisi').length).toBeGreaterThan(0)
    expect(screen.getByText('Aktif')).toBeInTheDocument()
    expect(screen.getByText('Su ve Kanal Hizmetleri')).toBeInTheDocument()
    // Personel için ilçe/köy ve birim düzenleme alanı yoktur.
    expect(screen.queryByLabelText(/İlçe/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Köy/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Birim/)).not.toBeInTheDocument()
  })

  it('personel güncellemesinde köy alanı gönderilmez; rol/durum/birim hiç yoktur', async () => {
    fetchMyProfileDetails.mockResolvedValue(details('admin'))
    updateMyProfile.mockResolvedValue({})
    const { refreshProfile } = renderPage('admin')
    const name = await screen.findByLabelText('Ad Soyad *')
    await userEvent.clear(name)
    await userEvent.type(name, 'Yeni Ad')
    await userEvent.click(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' }))

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1))
    const payload = updateMyProfile.mock.calls[0][0] as Record<string, unknown>
    expect(payload).toEqual({ fullName: 'Yeni Ad', phone: '05551112233' })
    expect(await screen.findByRole('status')).toHaveTextContent('Bilgileriniz güncellendi.')
    expect(refreshProfile).toHaveBeenCalledTimes(1)
  })

  it('ilçe değişince köy seçimi sıfırlanır ve yalnızca ilgili ilçenin köyleri listelenir', async () => {
    fetchMyProfileDetails.mockResolvedValue(
      details('citizen', {
        profile: makeProfile('citizen', { full_name: 'Ayşe', village_id: 'v1' }),
        districtId: 'd1',
        districtName: 'Merkez',
        villageName: 'Akçakiraz',
      }),
    )
    renderPage('citizen')
    const village1 = await screen.findByLabelText(/Köy/)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Akçakiraz' })).toBeInTheDocument())
    expect(village1).toHaveValue('v1')

    await userEvent.selectOptions(screen.getByLabelText(/İlçe/), 'd2')
    expect(screen.getByLabelText(/Köy/)).toHaveValue('')
    await waitFor(() => expect(screen.getByRole('option', { name: 'Yenice' })).toBeInTheDocument())
    expect(screen.queryByRole('option', { name: 'Akçakiraz' })).not.toBeInTheDocument()
    // Demo/pasif köyler referans katmanında süzülür: yalnızca fetchVillagesByDistrict sonucu sunulur.
    expect(fetchVillagesByDistrict).toHaveBeenCalledWith('d2')
  })

  it('vatandaş köy seçimini gönderir', async () => {
    fetchMyProfileDetails.mockResolvedValue(details('citizen'))
    updateMyProfile.mockResolvedValue({})
    renderPage('citizen')
    await screen.findByLabelText('Ad Soyad *')
    await userEvent.selectOptions(await screen.findByLabelText(/İlçe/), 'd1')
    await waitFor(() => expect(screen.getByRole('option', { name: 'Akçakiraz' })).toBeInTheDocument())
    await userEvent.selectOptions(screen.getByLabelText(/Köy/), 'v1')
    await userEvent.click(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' }))
    await waitFor(() => expect(updateMyProfile).toHaveBeenCalled())
    expect(updateMyProfile.mock.calls[0][0]).toEqual({ fullName: 'Ayşe Yılmaz', phone: '05551112233', villageId: 'v1' })
  })

  it('sunucu hatasında güvenli Türkçe hata gösterir ve profili yenilemez', async () => {
    fetchMyProfileDetails.mockResolvedValue(details('citizen'))
    updateMyProfile.mockRejectedValue(new Error('teknik ayrıntı'))
    const { refreshProfile } = renderPage('citizen')
    await userEvent.click(await screen.findByRole('button', { name: 'Değişiklikleri Kaydet' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bilgileriniz güncellenemedi')
    expect(screen.queryByText(/teknik ayrıntı/)).not.toBeInTheDocument()
    expect(refreshProfile).not.toHaveBeenCalled()
  })

  it('boş ad soyad gönderilmez', async () => {
    fetchMyProfileDetails.mockResolvedValue(details('admin'))
    renderPage('admin')
    await userEvent.clear(await screen.findByLabelText('Ad Soyad *'))
    await userEvent.click(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' }))
    expect(await screen.findByText('Lütfen adınızı ve soyadınızı girin.')).toBeInTheDocument()
    expect(updateMyProfile).not.toHaveBeenCalled()
  })

  it('kaydetme sürerken çift gönderimi engeller', async () => {
    fetchMyProfileDetails.mockResolvedValue(details('admin'))
    let resolve: (v: unknown) => void = () => {}
    updateMyProfile.mockReturnValue(new Promise((r) => (resolve = r)))
    renderPage('admin')
    const button = await screen.findByRole('button', { name: 'Değişiklikleri Kaydet' })
    await userEvent.dblClick(button)
    expect(updateMyProfile).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Kaydediliyor…' })).toBeDisabled()
    resolve({})
    await waitFor(() => expect(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' })).toBeEnabled())
  })
})

describe('ProfilePage şifre değiştirme', () => {
  async function fill(current: string, next: string, confirm: string) {
    await userEvent.type(await screen.findByLabelText('Mevcut Şifre *'), current)
    await userEvent.type(screen.getByLabelText('Yeni Şifre *'), next)
    await userEvent.type(screen.getByLabelText('Yeni Şifre (Tekrar) *'), confirm)
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi Değiştir' }))
  }

  beforeEach(() => fetchMyProfileDetails.mockResolvedValue(details('citizen')))

  it('eşleşmeyen onayı reddeder', async () => {
    renderPage('citizen')
    await fill('eski-sifre', 'yeni-sifre-1', 'yeni-sifre-2')
    expect(await screen.findByRole('alert')).toHaveTextContent('Şifreler eşleşmiyor')
    expect(changeMyPassword).not.toHaveBeenCalled()
  })

  it('kısa şifreyi reddeder', async () => {
    renderPage('citizen')
    await fill('eski-sifre', 'kisa', 'kisa')
    expect(await screen.findByRole('alert')).toHaveTextContent('en az 8 karakter')
    expect(changeMyPassword).not.toHaveBeenCalled()
  })

  it('oturumdaki e-posta ile çağırır, başarıda alanları temizler', async () => {
    changeMyPassword.mockResolvedValue(undefined)
    renderPage('citizen')
    await fill('eski-sifre', 'yeni-sifre-1', 'yeni-sifre-1')
    expect(await screen.findByRole('status')).toHaveTextContent('Şifreniz başarıyla değiştirildi.')
    expect(changeMyPassword).toHaveBeenCalledWith('test@example.test', 'eski-sifre', 'yeni-sifre-1')
    expect(screen.getByLabelText('Mevcut Şifre *')).toHaveValue('')
    expect(screen.getByLabelText('Yeni Şifre *')).toHaveValue('')
    expect(screen.getByLabelText('Yeni Şifre (Tekrar) *')).toHaveValue('')
  })

  it('başarısız yeniden doğrulamada genel hata gösterir', async () => {
    const { UserFacingError } = await import('@/lib/errors')
    const { WRONG_CURRENT_PASSWORD_MESSAGE } = await import('@/lib/user-profile')
    changeMyPassword.mockRejectedValue(new UserFacingError(WRONG_CURRENT_PASSWORD_MESSAGE))
    renderPage('citizen')
    await fill('yanlis-sifre', 'yeni-sifre-1', 'yeni-sifre-1')
    expect(await screen.findByRole('alert')).toHaveTextContent(WRONG_CURRENT_PASSWORD_MESSAGE)
  })
})
