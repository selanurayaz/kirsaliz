import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RoleBadge } from '@/components/RoleBadge'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { ROLE_LABELS } from '@/lib/constants'
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/service-request-config'
import type { UserRole } from '@/types/database'

describe('StatusBadge', () => {
  it.each(STATUS_ORDER)('%s durumunu Türkçe metinle gösterir', (status) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument()
  })

  it('durumlar yalnızca renkle değil metinle ayırt edilir', () => {
    const { container } = render(
      <>
        <StatusBadge status="rejected" />
        <StatusBadge status="resolved" />
      </>,
    )
    const [rejected, resolved] = Array.from(container.querySelectorAll('span'))
    expect(rejected).toHaveTextContent('Reddedildi')
    expect(resolved).toHaveTextContent('Çözüldü')
    expect(rejected.className).not.toBe(resolved.className)
  })
})

describe('UrgencyBadge', () => {
  it('aciliyeti Türkçe gösterir', () => {
    render(<UrgencyBadge urgency="high" />)
    expect(screen.getByText('Aciliyet: Yüksek')).toBeInTheDocument()
  })
})

describe('RoleBadge', () => {
  it.each(Object.keys(ROLE_LABELS) as UserRole[])('%s rolünü Türkçe gösterir', (role) => {
    render(<RoleBadge role={role} />)
    expect(screen.getByText(ROLE_LABELS[role])).toBeInTheDocument()
  })
})
