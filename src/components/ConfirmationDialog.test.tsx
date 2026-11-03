import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'

function setup(props: Partial<React.ComponentProps<typeof ConfirmationDialog>> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmationDialog
      open
      title="Talebi reddet"
      description="Bu işlem geri alınamaz."
      confirmLabel="Reddet"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmationDialog', () => {
  it('başlık ve açıklamayla dialog olarak çizilir', () => {
    setup()
    const dialog = screen.getByRole('dialog', { name: 'Talebi reddet' })
    expect(dialog).toHaveAccessibleDescription('Bu işlem geri alınamaz.')
  })

  it('kapalıyken içerik çizilmez', () => {
    setup({ open: false })
    expect(screen.queryByRole('button', { name: 'Reddet' })).not.toBeInTheDocument()
  })

  it('onay düğmesi onConfirm çağırır', async () => {
    const { onConfirm, onCancel } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Reddet' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('Vazgeç düğmesi onCancel çağırır', async () => {
    const { onConfirm, onCancel } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('işlem sürerken düğmeler devre dışıdır ve onay tekrarlanmaz', async () => {
    const { onConfirm, onCancel } = setup({ busy: true })
    const confirm = screen.getByRole('button', { name: 'İşleniyor…' })
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Vazgeç' })).toBeDisabled()
    await userEvent.click(confirm)
    await userEvent.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('confirmDisabled iken onaylanamaz', async () => {
    const { onConfirm } = setup({ confirmDisabled: true })
    const confirm = screen.getByRole('button', { name: 'Reddet' })
    expect(confirm).toBeDisabled()
    await userEvent.click(confirm)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('alt öğeleri gösterir', () => {
    setup({ children: <label htmlFor="not">Not</label> })
    expect(screen.getByText('Not')).toBeInTheDocument()
  })
})
