import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ROUTES } from '@/lib/constants'

/** Yalnızca oturum açmış kullanıcıların erişebileceği rotalar. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner label="Oturum kontrol ediliyor…" />
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Oturum açmış kullanıcıları giriş/kayıt sayfalarından panele yönlendirir. */
export function GuestOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageSpinner label="Oturum kontrol ediliyor…" />
  if (user) return <Navigate to={ROUTES.panel} replace />
  return <Outlet />
}
