import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { ErrorFallback } from '@/components/AppErrorBoundary'
import { logError } from '@/lib/errors'

/** React Router'ın yakaladığı hatalar (ör. yüklenemeyen sayfa parçası) için güvenli ekran. */
export function RouteErrorFallback() {
  const error = useRouteError()
  useEffect(() => {
    logError('Rota hatası', error)
  }, [error])
  return <ErrorFallback />
}
