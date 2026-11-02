import { Logo } from '@/components/Logo'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo variant="light" />
          <p className="text-sm text-navy-200">{APP_TAGLINE}</p>
        </div>
        <p className="text-sm text-navy-300">
          © {new Date().getFullYear()} {APP_NAME}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
