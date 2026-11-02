import type { NavItem } from '@/types/navigation'

export const APP_NAME = 'KırsalİZ'
export const APP_TAGLINE = 'Konum Tabanlı Kırsal Hizmet ve Karar Destek Platformu'

export const ROUTES = {
  home: '/',
  login: '/giris',
  register: '/kayit',
  panel: '/panel',
} as const

export const MAIN_NAV: NavItem[] = [
  { label: 'Ana Sayfa', to: ROUTES.home },
  { label: 'Nasıl Çalışır?', to: `${ROUTES.home}#nasil-calisir` },
  { label: 'Hakkında', to: `${ROUTES.home}#hakkinda` },
]
