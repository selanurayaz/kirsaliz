import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import elazigSource from '@/components/geo/elazig-geo.ts?raw'
import { HomePage } from '@/pages/HomePage'

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('HomePage', () => {
  it('dört iş akışı durağını normal içerik olarak sunar', () => {
    renderHome()
    const list = screen.getByRole('list', { name: 'Talep akışının dört durağı' })
    expect(list.querySelectorAll(':scope > li')).toHaveLength(4)
    for (const title of ['Sorunu Bildir', 'İlgili Birime Yönlendir', 'Sahada Müdahale Et', 'Çözümü Takip Et']) {
      expect(screen.getByRole('heading', { name: title, level: 3 })).toBeVisible()
    }
  })

  it('tek bir ana başlık ve birincil eylem sunar', () => {
    renderHome()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Talep oluşturmak için kayıt olun/ })).toHaveAttribute('href', '/kayit')
    expect(screen.getByRole('link', { name: 'Hesabım var, giriş yap' })).toHaveAttribute('href', '/giris')
  })

  it('hareket azaltma açıkken nehir tam görünür ve içerik eksiksizdir', () => {
    mockReducedMotion(true)
    const { container } = renderHome()
    expect(container.querySelector<HTMLElement>('.river-story')?.style.getPropertyValue('--river-progress')).toBe('1')
    expect(screen.getByRole('heading', { name: 'Çözümü Takip Et' })).toBeInTheDocument()
  })

  it('dekoratif SVG çizimleri ekran okuyuculardan gizlenir', () => {
    const { container } = renderHome()
    const svgs = container.querySelectorAll('svg:not([aria-hidden="true"])')
    expect(svgs).toHaveLength(0)
  })

  it('harita yerel SVG verisidir; çalışma zamanında harita servisi veya anahtar yoktur', () => {
    expect(elazigSource).not.toMatch(/https?:\/\/(?!www\.openstreetmap\.org\/copyright)/)
    expect(elazigSource).not.toMatch(/fetch\(|XMLHttpRequest|apikey|api_key/i)
    const { container } = renderHome()
    expect(container.querySelector('img, iframe')).toBeNull()
  })
})
