import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RequestCard } from '@/components/RequestCard'
import type { ServiceRequestWithRelations } from '@/types/database'

const request: ServiceRequestWithRelations = {
  id: 'req-1',
  tracking_code: 'KZ-2025-000001',
  citizen_id: 'u1',
  village_id: 'v1',
  category_id: 'c1',
  department_id: 'd1',
  assigned_to: null,
  title: 'Köy yolunda çukur var',
  description: 'Açıklama',
  address: null,
  latitude: null,
  longitude: null,
  urgency: 'high',
  status: 'under_review',
  resolved_at: null,
  created_at: '2025-03-15T12:00:00Z',
  updated_at: '2025-03-15T12:00:00Z',
  category: { id: 'c1', name: 'Yol', slug: 'yol', icon: null, color: null },
  department: { id: 'd1', name: 'Fen İşleri' },
  village: { id: 'v1', name: 'Çamlık', district: { id: 'di1', name: 'Merkez' } },
}

describe('RequestCard', () => {
  it('talep bilgilerini ve rozetleri gösterir', () => {
    render(
      <MemoryRouter>
        <RequestCard request={request} />
      </MemoryRouter>,
    )
    expect(screen.getByText('KZ-2025-000001')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Köy yolunda çukur var' })).toBeInTheDocument()
    expect(screen.getByText('İnceleniyor')).toBeInTheDocument()
    expect(screen.getByText('Aciliyet: Yüksek')).toBeInTheDocument()
    expect(screen.getByText('Çamlık, Merkez')).toBeInTheDocument()
    expect(screen.getByText('Yol')).toBeInTheDocument()
  })

  it('detay bağlantısı erişilebilir ada ve doğru adrese sahiptir', () => {
    render(
      <MemoryRouter>
        <RequestCard request={request} />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Köy yolunda çukur var talebinin detaylarını gör' })
    expect(link).toHaveAttribute('href', '/taleplerim/req-1')
  })

  it('eksik ilişkili veride çökmez', () => {
    render(
      <MemoryRouter>
        <RequestCard request={{ ...request, category: null, village: null }} />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
