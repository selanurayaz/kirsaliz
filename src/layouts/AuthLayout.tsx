import type { ReactNode } from 'react'
import { MapPinned, Route as RouteIcon, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { ElazigMapVisual } from '@/components/geo/ElazigMapVisual'
import { APP_TAGLINE } from '@/lib/constants'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

const POINTS = [
  { icon: MapPinned, text: 'Sorunu konum bilgisiyle bildirin' },
  { icon: RouteIcon, text: 'Talebinizin hangi aşamada olduğunu izleyin' },
  { icon: ShieldCheck, text: 'Bilgileriniz yalnızca yetkili kişilerce görülür' },
]

/** Giriş ve kayıt sayfaları için ortak düzen: marka paneli + form kartı. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <section className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between gap-10 bg-primary-dark p-10 text-primary-soft lg:flex xl:p-14">
        <Logo variant="light" />
        <div className="space-y-6">
          <h2 className="max-w-md text-3xl leading-tight font-bold !text-white">
            Köyünüzün sesi, doğru birime ulaşsın.
          </h2>
          <ul className="space-y-3">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-primary-border">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <ElazigMapVisual variant="faint" className="max-w-xs" />
          <p className="text-sm text-primary-border">{APP_TAGLINE}</p>
        </div>
      </aside>

      <div className="flex items-start justify-center px-4 py-10 sm:py-14 lg:items-center">
        <div className="w-full max-w-md">
          <div className="card p-6 shadow-md sm:p-8">
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
              <p className="text-sm text-navy-muted">{subtitle}</p>
            </div>
            {children}
          </div>
          {footer && <div className="mt-5 text-center text-sm text-navy-muted">{footer}</div>}
        </div>
      </div>
    </section>
  )
}
