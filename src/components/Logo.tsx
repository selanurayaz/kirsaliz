import { Link } from 'react-router'
import { APP_NAME, ROUTES } from '@/lib/constants'

interface LogoProps {
  variant?: 'dark' | 'light'
}

export function Logo({ variant = 'dark' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-navy-800'

  return (
    <Link to={ROUTES.home} className="flex items-center gap-2" aria-label={`${APP_NAME} ana sayfa`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-brand-500">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2C7.6 2 4 5.5 4 9.9 4 15.8 12 22 12 22s8-6.2 8-12.1C20 5.5 16.4 2 12 2zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
          />
        </svg>
      </span>
      <span className={`text-xl font-bold tracking-tight ${textColor}`}>
        Kırsal<span className="text-brand-500">İZ</span>
      </span>
    </Link>
  )
}
