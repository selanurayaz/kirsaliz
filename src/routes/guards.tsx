import { useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ROUTES, homeRouteForRole } from '@/lib/constants'
import type { UserRole } from '@/types/database'

/** Yalnızca oturum açmış ve aktif hesaplı kullanıcıların erişebileceği rotalar. */
export function ProtectedRoute() {
  const { user, loading, profileLoading, profile } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner label="Oturum kontrol ediliyor…" />
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  if (profileLoading) return <FullPageSpinner label="Hesap bilgileri yükleniyor…" />
  if (profile && !profile.is_active) return <InactiveAccount />
  return <Outlet />
}

/** Oturum açmış kullanıcıları giriş/kayıt sayfalarından rolüne uygun ana sayfaya yönlendirir. */
export function GuestOnlyRoute() {
  const { user, loading, profileLoading, role } = useAuth()

  if (loading) return <FullPageSpinner label="Oturum kontrol ediliyor…" />
  if (user && profileLoading) return <FullPageSpinner label="Hesap bilgileri yükleniyor…" />
  if (user) return <Navigate to={homeRouteForRole(role)} replace />
  return <Outlet />
}

/** Yalnızca belirtilen rollerin erişebileceği rotalar (ProtectedRoute içinde kullanılır). */
export function RoleRoute({ allowed }: { allowed: readonly UserRole[] }) {
  const { role } = useAuth()
  if (!role || !allowed.includes(role)) return <UnauthorizedPage />
  return <Outlet />
}

export function UnauthorizedPage() {
  const { role } = useAuth()
  return (
    <section className="bg-slate-100 px-4 py-16">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-navy-800">Bu sayfaya erişim yetkiniz yok</h1>
        <p className="mt-2 text-sm text-slate-600">
          Görüntülemeye çalıştığınız sayfa hesabınızın rolüne açık değil.
        </p>
        <Link
          to={homeRouteForRole(role)}
          className="mt-6 inline-block rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        >
          Ana Sayfama Dön
        </Link>
      </div>
    </section>
  )
}

function InactiveAccount() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOut()
      navigate(ROUTES.home)
    } catch {
      setBusy(false)
    }
  }

  return (
    <section className="bg-slate-100 px-4 py-16">
      <div role="alert" className="mx-auto max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-navy-800">Hesabınız pasif durumda</h1>
        <p className="mt-2 text-sm text-slate-600">
          Hesabınız şu anda kullanıma kapalı. Bir hata olduğunu düşünüyorsanız sistem yöneticisiyle iletişime geçin.
        </p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={busy}
          className="mt-6 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none disabled:opacity-60"
        >
          Çıkış Yap
        </button>
      </div>
    </section>
  )
}
