import { Link } from 'react-router'
import { Logo } from '@/components/Logo'
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="border-t border-primary-hover bg-primary-dark text-primary-soft">
      <div className="page-container flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo variant="light" />
          <p className="max-w-md text-sm text-primary-border">{APP_TAGLINE}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-primary-border md:items-end">
          <nav aria-label="Alt bağlantılar" className="flex gap-4">
            <Link to={ROUTES.home} className="rounded-sm hover:text-white hover:underline focus-visible:outline-white">
              Ana Sayfa
            </Link>
            <Link
              to={`${ROUTES.home}#nasil-calisir`}
              className="rounded-sm hover:text-white hover:underline focus-visible:outline-white"
            >
              Nasıl Çalışır?
            </Link>
          </nav>
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Portfolyo ve pilot çalışma amaçlı bir projedir.
          </p>
        </div>
      </div>
    </footer>
  )
}
