import type { NavItem } from '@/types/navigation'

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

/** Oturum açmış kullanıcının gezinme bağlantıları. */
export const AUTH_NAV: NavItem[] = [
  { label: 'Panel', to: ROUTES.panel },
  { label: 'Yeni Talep', to: ROUTES.newRequest },
  { label: 'Taleplerim', to: ROUTES.myRequests },
]
