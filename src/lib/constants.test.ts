import { describe, expect, it } from 'vitest'
import {
  NAV_BY_ROLE,
  ROLE_LABELS,
  ROUTES,
  STAFF_ROLES,
  homeRouteForRole,
  requestDetailPath,
  staffRequestDetailPath,
} from '@/lib/constants'
import type { UserRole } from '@/types/database'

const ALL_ROLES: UserRole[] = ['citizen', 'department_officer', 'field_personnel', 'admin']

describe('rota yardımcıları', () => {
  it('vatandaş talep detay adresini üretir', () => {
    expect(requestDetailPath('abc')).toBe('/taleplerim/abc')
  })

  it('kurum talep detay adresini üretir', () => {
    expect(staffRequestDetailPath('abc')).toBe('/kurum/talepler/abc')
  })
})

describe('homeRouteForRole', () => {
  it('vatandaşı ve rolü bilinmeyeni vatandaş paneline yönlendirir', () => {
    expect(homeRouteForRole('citizen')).toBe(ROUTES.panel)
    expect(homeRouteForRole(null)).toBe(ROUTES.panel)
  })

  it.each(STAFF_ROLES)('%s rolünü kurum paneline yönlendirir', (role) => {
    expect(homeRouteForRole(role)).toBe(ROUTES.staffDashboard)
  })
})

describe('rol etiketleri', () => {
  it('her rol için Türkçe etiket tanımlıdır', () => {
    expect(ROLE_LABELS).toEqual({
      citizen: 'Vatandaş',
      department_officer: 'Birim Yetkilisi',
      field_personnel: 'Saha Personeli',
      admin: 'Yönetici',
    })
  })
})

describe('rol bazlı gezinme', () => {
  it('yalnızca yönetici kullanıcı yönetimi bağlantısını görür', () => {
    for (const role of ALL_ROLES) {
      const hasAdminLink = NAV_BY_ROLE[role].some((item) => item.to === ROUTES.adminUsers)
      expect(hasAdminLink).toBe(role === 'admin')
    }
  })

  it('vatandaş kurum paneli bağlantısı görmez', () => {
    expect(NAV_BY_ROLE.citizen.some((item) => item.to.startsWith(ROUTES.staffDashboard))).toBe(false)
  })

  it('STAFF_ROLES vatandaşı içermez', () => {
    expect(STAFF_ROLES).not.toContain('citizen')
  })
})
