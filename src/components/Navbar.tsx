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
    `rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
      active ? 'bg-primary-soft text-primary' : 'text-navy hover:bg-primary-soft hover:text-primary'
    }`

  return (
    <header className="sticky top-0 z-40 border-t-4 border-b border-t-primary border-b-line bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Masaüstü menü (misafirler için genel bağlantılar) */}
        {!user && (
          <div className="hidden items-center gap-8 md:flex">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-1 py-1 text-sm font-medium text-navy transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-2 md:flex">
          {loading || (user && profileLoading) ? (
            // Düzen kaymasını önlemek için menü alanı yer tutucuyla ayrılır.
            <span aria-hidden="true" className="block h-9 w-56 rounded-md bg-page" />
          ) : user ? (
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
                className="btn btn-neutral btn-sm min-w-28"
              >
                {signingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.login} className={linkClass(location.pathname === ROUTES.login)}>
                Giriş Yap
              </Link>
              <Link
                to={ROUTES.register}
                className="btn btn-primary btn-sm"
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-navy hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none md:hidden"
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
        <div id="mobil-menu" className="border-t border-line bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {(user ? authNav : MAIN_NAV).map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                aria-current={user && isActive(item) ? 'page' : undefined}
                className={`${linkClass(user ? isActive(item) : false)} min-h-11 content-center`}
              >
                {item.label}
              </Link>
            ))}
            {!loading && (
              <div className={`mt-2 border-t border-line pt-3 ${user ? '' : 'grid grid-cols-2 gap-2'}`}>
                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="btn btn-neutral w-full"
                  >
                    {signingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
                  </button>
                ) : (
                  <>
                    <Link
                      to={ROUTES.login}
                      className="btn btn-neutral"
                    >
                      Giriş Yap
                    </Link>
                    <Link
                      to={ROUTES.register}
                      className="btn btn-primary"
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
