import { Link } from 'react-router'
import { LogoMark } from '@/components/LogoMark'
import { APP_NAME, ROUTES } from '@/lib/constants'

interface LogoProps {
  variant?: 'dark' | 'light'
}

/** Marka bağlantısı: işaret + "KırsalİZ" yazısı. Koyu zeminde ('light') yazı beyazdır. */
export function Logo({ variant = 'dark' }: LogoProps) {
  const light = variant === 'light'
  return (
    <Link
      to={ROUTES.home}
      className="group inline-flex items-center gap-2 rounded-md focus-visible:outline-2"
      aria-label={`${APP_NAME} ana sayfa`}
    >
      <LogoMark tone={light ? 'light' : 'default'} className="h-10 w-[42px] shrink-0" />
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
        Kırsal<span className={light ? 'text-primary-border' : 'text-primary'}>İZ</span>
      </span>
    </Link>
  )
}
