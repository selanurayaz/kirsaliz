import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserAccessEditor } from '@/components/UserAccessEditor'
import type { AdminUserListItem, Department } from '@/types/database'

const departments: Department[] = [
  {
    id: 'dep-1',
    name: 'Fen İşleri',
    description: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

const baseUser: AdminUserListItem = {
  id: 'u-1',
  email: 'kisi@example.test',
  full_name: 'Ayşe Yılmaz',
  phone: null,
  role: 'citizen',
  department_id: null,
  department_name: null,
  village_id: null,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
}

function setup(user: AdminUserListItem = baseUser) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  render(<UserAccessEditor user={user} departments={departments} saving={false} error={null} onSave={onSave} onClose={onClose} />)
  return { onSave, onClose }
}

describe('UserAccessEditor', () => {
  it('kullanıcıyı başlıkta tanıtır ve değişiklik yokken kaydetmeyi engeller', () => {
    setup()
    const dialog = screen.getByRole('dialog', { name: 'Kullanıcı erişimini düzenle' })
    expect(dialog).toHaveAccessibleDescription(/Ayşe Yılmaz · kisi@example.test/)
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled()
  })

  it('birim gerektiren rolde birim seçilmeden kaydetmeyi engeller', async () => {
    setup()
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'field_personnel')
    expect(screen.getByLabelText('Birim *')).toBeRequired()
    expect(screen.getByText('Bu rol için bir birim seçmelisiniz.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled()
  })

  it('rol ve birim seçilince doğru yükle kaydeder', async () => {
    const { onSave } = setup()
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'department_officer')
    await userEvent.selectOptions(screen.getByLabelText('Birim *'), 'dep-1')
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }))
    expect(onSave).toHaveBeenCalledWith({
      userId: 'u-1',
      role: 'department_officer',
      departmentId: 'dep-1',
      isActive: true,
    })
  })

  it('yönetici rolünde birim alanı gösterilmez ve birim null gönderilir', async () => {
    const { onSave } = setup()
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'admin')
    expect(screen.queryByLabelText('Birim *')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }))
    expect(onSave).toHaveBeenCalledWith({ userId: 'u-1', role: 'admin', departmentId: null, isActive: true })
  })

  it('hesabı pasifleştirmek için ayrıca onay ister', async () => {
    const { onSave } = setup()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Hesap aktif' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Hesap pasifleştirilirse')
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Hesabı pasifleştirmeyi onaylıyorum.' }))
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u-1', isActive: false }))
  })

  it('Vazgeç onClose çağırır', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
