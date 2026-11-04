import type { NavItem } from '@/types/navigation'
import type { UserRole } from '@/types/database'

export const APP_NAME = 'KırsalİZ'
export const APP_TAGLINE = 'Konum Tabanlı Kırsal Hizmet ve Karar Destek Platformu'

export const ROUTES = {
  home: '/',
  login: '/giris',
  register: '/kayit',
  panel: '/panel',
  newRequest: '/talepler/yeni',
  myRequests: '/taleplerim',
  requestDetail: '/taleplerim/:id',
  staffDashboard: '/kurum',
  staffRequestDetail: '/kurum/talepler/:id',
  adminUsers: '/yonetim/kullanicilar',
  profile: '/profil',
} as const

/** Talep detay sayfasının adresini üretir. */
export function requestDetailPath(id: string): string {
  return `${ROUTES.myRequests}/${id}`
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Ana Sayfa', to: ROUTES.home },
  { label: 'Nasıl Çalışır?', to: `${ROUTES.home}#nasil-calisir` },
  { label: 'Hakkında', to: `${ROUTES.home}#hakkinda` },
]

/** Kurum talep detay sayfasının adresini üretir. */
export function staffRequestDetailPath(id: string): string {
  return `${ROUTES.staffDashboard}/talepler/${id}`
}

/** Role göre gezinme bağlantıları (Çıkış Yap navbar'da ayrıca gösterilir). */
const PROFILE_NAV: NavItem = { label: 'Profilim', to: ROUTES.profile }

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  citizen: [
    { label: 'Panel', to: ROUTES.panel },
    { label: 'Yeni Talep', to: ROUTES.newRequest },
    { label: 'Taleplerim', to: ROUTES.myRequests },
    PROFILE_NAV,
  ],
  department_officer: [
    { label: 'Kurum Paneli', to: ROUTES.staffDashboard },
    { label: 'Birim Talepleri', to: `${ROUTES.staffDashboard}#talepler` },
    PROFILE_NAV,
  ],
  field_personnel: [{ label: 'Görevlerim', to: ROUTES.staffDashboard }, PROFILE_NAV],
  admin: [
    { label: 'Kurum Paneli', to: ROUTES.staffDashboard },
    { label: 'Kullanıcı Yönetimi', to: ROUTES.adminUsers },
    PROFILE_NAV,
  ],
}

export const STAFF_ROLES: readonly UserRole[] = ['admin', 'department_officer', 'field_personnel']

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Vatandaş',
  department_officer: 'Birim Yetkilisi',
  field_personnel: 'Saha Personeli',
  admin: 'Yönetici',
}

/** Rolün giriş sonrası ana sayfası. */
export function homeRouteForRole(role: UserRole | null): string {
  return role && role !== 'citizen' ? ROUTES.staffDashboard : ROUTES.panel
}
