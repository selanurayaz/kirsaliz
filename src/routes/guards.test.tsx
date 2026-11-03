import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { GuestOnlyRoute, ProtectedRoute, RoleRoute } from '@/routes/guards'
import { STAFF_ROLES } from '@/lib/constants'
import { AuthTestProvider, makeAuth, makeProfile } from '@/test/auth'
import type { AuthContextValue } from '@/context/auth-context'
import type { UserRole } from '@/types/database'

/** Gerçek rota yapısının (router.tsx) korumalarını aynı sırayla kurar. */
function renderAt(path: string, auth: AuthContextValue) {
  return render(
    <AuthTestProvider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>Ana sayfa</p>} />
          <Route element={<GuestOnlyRoute />}>
            <Route path="/giris" element={<p>Giriş sayfası</p>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/panel" element={<p>Vatandaş paneli</p>} />
            <Route element={<RoleRoute allowed={STAFF_ROLES} />}>
              <Route path="/kurum" element={<p>Kurum paneli</p>} />
            </Route>
            <Route element={<RoleRoute allowed={['admin']} />}>
              <Route path="/yonetim/kullanicilar" element={<p>Kullanıcı yönetimi</p>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthTestProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('oturumsuz kullanıcıyı /giris sayfasına yönlendirir', () => {
    renderAt('/panel', makeAuth(null))
    expect(screen.getByText('Giriş sayfası')).toBeInTheDocument()
    expect(screen.queryByText('Vatandaş paneli')).not.toBeInTheDocument()
  })

  it('oturum yüklenirken yönlendirme yapmaz, durum bildirir', () => {
    renderAt('/panel', makeAuth(null, { loading: true }))
    expect(screen.getByRole('status')).toHaveTextContent('Oturum kontrol ediliyor')
    expect(screen.queryByText('Giriş sayfası')).not.toBeInTheDocument()
  })

  it('profil yüklenirken içeriği göstermez ve yönlendirmez', () => {
    renderAt('/kurum', makeAuth('admin', { profileLoading: true, profile: null, role: null }))
    expect(screen.getByRole('status')).toHaveTextContent('Hesap bilgileri yükleniyor')
    expect(screen.queryByText('Kurum paneli')).not.toBeInTheDocument()
    expect(screen.queryByText('Bu sayfaya erişim yetkiniz yok')).not.toBeInTheDocument()
  })

  it('pasif hesap için güvenli ekranı gösterir ve içeriği açmaz', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    renderAt(
      '/panel',
      makeAuth('citizen', { profile: makeProfile('citizen', { is_active: false }), signOut }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Hesabınız pasif durumda')
    expect(screen.queryByText('Vatandaş paneli')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Çıkış Yap' }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('aktif vatandaş kendi paneline erişir', () => {
    renderAt('/panel', makeAuth('citizen'))
    expect(screen.getByText('Vatandaş paneli')).toBeInTheDocument()
  })
})

describe('RoleRoute', () => {
  it('vatandaş yönetici rotasına erişemez', () => {
    renderAt('/yonetim/kullanicilar', makeAuth('citizen'))
    expect(screen.getByRole('heading', { name: 'Bu sayfaya erişim yetkiniz yok' })).toBeInTheDocument()
    expect(screen.queryByText('Kullanıcı yönetimi')).not.toBeInTheDocument()
  })

  it('vatandaş kurum rotalarına erişemez', () => {
    renderAt('/kurum', makeAuth('citizen'))
    expect(screen.getByRole('heading', { name: 'Bu sayfaya erişim yetkiniz yok' })).toBeInTheDocument()
    expect(screen.queryByText('Kurum paneli')).not.toBeInTheDocument()
  })

  it('yönetici yönetici rotasına erişir', () => {
    renderAt('/yonetim/kullanicilar', makeAuth('admin'))
    expect(screen.getByText('Kullanıcı yönetimi')).toBeInTheDocument()
  })

  it.each<UserRole>(['department_officer', 'field_personnel'])('%s kurum rotasına erişir', (role) => {
    renderAt('/kurum', makeAuth(role))
    expect(screen.getByText('Kurum paneli')).toBeInTheDocument()
  })

  it.each<UserRole>(['department_officer', 'field_personnel'])('%s kullanıcı yönetimine erişemez', (role) => {
    renderAt('/yonetim/kullanicilar', makeAuth(role))
    expect(screen.getByRole('heading', { name: 'Bu sayfaya erişim yetkiniz yok' })).toBeInTheDocument()
    expect(screen.queryByText('Kullanıcı yönetimi')).not.toBeInTheDocument()
  })

  it('profil okunamadığında (rol yok) yönetici sayfası açılmaz', () => {
    renderAt('/yonetim/kullanicilar', makeAuth('citizen', { profile: null, role: null, profileError: true }))
    expect(screen.queryByText('Kullanıcı yönetimi')).not.toBeInTheDocument()
  })
})

describe('GuestOnlyRoute', () => {
  it('misafire giriş sayfasını gösterir', () => {
    renderAt('/giris', makeAuth(null))
    expect(screen.getByText('Giriş sayfası')).toBeInTheDocument()
  })

  it('oturum yüklenirken giriş sayfasını göstermez', () => {
    renderAt('/giris', makeAuth(null, { loading: true }))
    expect(screen.queryByText('Giriş sayfası')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('oturum açmış vatandaşı panele yönlendirir', () => {
    renderAt('/giris', makeAuth('citizen'))
    expect(screen.getByText('Vatandaş paneli')).toBeInTheDocument()
  })

  it('oturum açmış yöneticiyi kurum paneline yönlendirir', () => {
    renderAt('/giris', makeAuth('admin'))
    expect(screen.getByText('Kurum paneli')).toBeInTheDocument()
  })
})
