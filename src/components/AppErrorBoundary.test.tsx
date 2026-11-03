import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

function Bomb(): never {
  throw new Error('gizli teknik ayrıntı: token=abc123')
}

beforeEach(() => {
  // React ve boundary beklenen hatayı konsola yazar; test çıktısını kirletmesin.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AppErrorBoundary', () => {
  it('hata yoksa çocukları çizer', () => {
    render(
      <AppErrorBoundary>
        <p>İçerik</p>
      </AppErrorBoundary>,
    )
    expect(screen.getByText('İçerik')).toBeInTheDocument()
  })

  it('render hatasında güvenli Türkçe ekran gösterir ve teknik ayrıntıyı sızdırmaz', () => {
    const { container } = render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Beklenmeyen bir sorun oluştu' })).toBeInTheDocument()
    expect(container).not.toHaveTextContent('token=abc123')
    expect(container).not.toHaveTextContent('gizli')
  })

  it('ana sayfaya dönüş bağlantısı ve yenileme düğmesi sunar', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    )
    expect(screen.getByRole('link', { name: 'Ana Sayfaya Dön' })).toHaveAttribute('href', '/')
    await userEvent.click(screen.getByRole('button', { name: 'Sayfayı Yenile' }))
    expect(reload).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
