import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from '@/components/EmptyState'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { StatusMessage } from '@/components/StatusMessage'

describe('EmptyState', () => {
  it('başlığı, açıklamayı ve eylemi gösterir', () => {
    render(<EmptyState title="Talep yok" description="Henüz talebiniz yok." action={<button type="button">Yeni Talep</button>} />)
    expect(screen.getByRole('heading', { name: 'Talep yok' })).toBeInTheDocument()
    expect(screen.getByText('Henüz talebiniz yok.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yeni Talep' })).toBeInTheDocument()
  })

  it('isteğe bağlı alanlar olmadan da çizilir', () => {
    render(<EmptyState title="Boş" />)
    expect(screen.getByRole('heading', { name: 'Boş' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('StatusMessage', () => {
  it('durum yoksa hiçbir şey çizmez', () => {
    const { container } = render(<StatusMessage status={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('hatayı yardımcı teknolojilere alert olarak duyurur', () => {
    render(<StatusMessage status={{ type: 'error', message: 'Bir hata oluştu.' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Bir hata oluştu.')
  })

  it.each(['info', 'success'] as const)('%s mesajını status olarak duyurur', (type) => {
    render(<StatusMessage status={{ type, message: 'Bilgi' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Bilgi')
  })
})

describe('FullPageSpinner', () => {
  it('erişilebilir yükleme durumu sunar', () => {
    render(<FullPageSpinner label="Yükleniyor…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Yükleniyor…')
  })
})
