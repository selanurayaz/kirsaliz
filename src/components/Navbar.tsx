import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/hooks/useAuth'
import { MAIN_NAV, NAV_BY_ROLE, ROUTES } from '@/lib/constants'
import type { NavItem } from '@/types/navigation'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, profileLoading, role, signOut } = useAuth()

  // Rol yüklenene kadar rol bağlantıları gösterilmez (yanlış menü görünmesin).
  // Profil okunamazsa en düşük yetki olan vatandaş menüsü kullanılır.
  const authNav: NavItem[] = user && !profileLoading ? NAV_BY_ROLE[role ?? 'citizen'] : []

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      setOpen(false)
      navigate(ROUTES.home)
    } catch {
      // Çıkış başarısız olursa kullanıcı oturumda kalır; tekrar denenebilir.
    } finally {
      setSigningOut(false)
    }
  }

  // Sayfa veya bölüm değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  function isActive(item: NavItem): boolean {
    const [path, hash = ''] = item.to.split('#')
    return location.pathname === path && (location.hash.replace('#', '') === hash)
  }

  const linkClass = (active: boolean) =>
    `rounded-md px-3 py-2 text-sm font-semibold text-navy-800 transition-colors ${
      active ? 'bg-navy-50' : 'hover:bg-slate-100'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Masaüstü menü (misafirler için genel bağlantılar) */}
        {!user && (
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
        )}

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              {authNav.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={linkClass(isActive(item))}
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.login} className={linkClass(location.pathname === ROUTES.login)}>
                Giriş Yap
              </Link>
              <Link
                to={ROUTES.register}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Kayıt Ol
              </Link>
            </>
          )}
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
            {(user ? authNav : MAIN_NAV).map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                aria-current={user && isActive(item) ? 'page' : undefined}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
            {!loading && (
              <div className={`mt-2 border-t border-slate-100 pt-3 ${user ? '' : 'grid grid-cols-2 gap-2'}`}>
                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Çıkış Yap
                  </button>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
