import { Logo } from '@/components/Logo'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="border-t-4 border-primary bg-primary-dark text-primary-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo variant="light" />
          <p className="text-sm text-primary-border">{APP_TAGLINE}</p>
        </div>
        <p className="text-sm text-primary-border">
          © {new Date().getFullYear()} {APP_NAME}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
