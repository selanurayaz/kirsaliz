import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Logo } from '@/components/Logo'
import { MAIN_NAV, ROUTES } from '@/lib/constants'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Sayfa veya bölüm değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Masaüstü menü */}
        <div className="hidden items-center gap-8 md:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-navy-800"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <NavLink
            to={ROUTES.login}
            className={({ isActive }) =>
              `rounded-md px-4 py-2 text-sm font-semibold text-navy-800 transition-colors ${
                isActive ? 'bg-navy-50' : 'hover:bg-slate-100'
              }`
            }
          >
            Giriş Yap
          </NavLink>
          <Link
            to={ROUTES.register}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Kayıt Ol
          </Link>
        </div>

        {/* Mobil menü butonu */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-navy-800 hover:bg-slate-100 md:hidden"
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={open}
          aria-controls="mobil-menu"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobil menü */}
      {open && (
        <div id="mobil-menu" className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link
                to={ROUTES.login}
                className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-navy-800 hover:bg-slate-50"
              >
                Giriş Yap
              </Link>
              <Link
                to={ROUTES.register}
                className="rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                Kayıt Ol
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
