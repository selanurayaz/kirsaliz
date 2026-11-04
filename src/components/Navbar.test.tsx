import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Navbar } from '@/components/Navbar'
import { AuthTestProvider, makeAuth } from '@/test/auth'
import { ROUTES } from '@/lib/constants'
import type { AuthContextValue } from '@/context/auth-context'
import type { UserRole } from '@/types/database'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

function renderNavbar(auth: AuthContextValue, path = '/') {
  return render(
    <AuthTestProvider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Navbar />
      </MemoryRouter>
    </AuthTestProvider>,
  )
}

describe('Navbar — Profilim bağlantısı', () => {
  it.each<UserRole>(['citizen', 'department_officer', 'field_personnel', 'admin'])(
    '%s rolü için masaüstü ve mobil menüde gösterilir',
    async (role) => {
      renderNavbar(makeAuth(role))
      const desktop = screen.getByRole('link', { name: 'Profilim' })
      expect(desktop).toHaveAttribute('href', ROUTES.profile)

      await userEvent.click(screen.getByRole('button', { name: 'Menüyü aç' }))
      expect(screen.getAllByRole('link', { name: 'Profilim' })).toHaveLength(2)
    },
  )

  it('oturumsuz ziyaretçiye gösterilmez', async () => {
    renderNavbar(makeAuth(null))
    expect(screen.queryByRole('link', { name: 'Profilim' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Menüyü aç' }))
    expect(screen.queryByRole('link', { name: 'Profilim' })).not.toBeInTheDocument()
  })

  it('profil rotasında etkin bağlantı olarak işaretlenir', () => {
    renderNavbar(makeAuth('citizen'), ROUTES.profile)
    expect(screen.getByRole('link', { name: 'Profilim' })).toHaveAttribute('aria-current', 'page')
  })

  it('mevcut rol bağlantılarını korur ve çıkış butonu durur', () => {
    renderNavbar(makeAuth('admin'))
    expect(screen.getByRole('link', { name: 'Kullanıcı Yönetimi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Çıkış Yap' })).toBeInTheDocument()
  })
})
