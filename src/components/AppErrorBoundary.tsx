import { Component, type ErrorInfo, type ReactNode } from 'react'
import { APP_NAME } from '@/lib/constants'
import { logError } from '@/lib/errors'

/** Beklenmeyen hatalarda gösterilen güvenli ekran. Teknik ayrıntı içermez. */
export function ErrorFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-16">
      <div role="alert" className="card w-full max-w-md border-t-4 border-t-primary p-6 text-center sm:p-8">
        <p className="text-sm font-semibold text-primary">{APP_NAME}</p>
        <h1 className="mt-2 text-xl font-bold text-navy">Beklenmeyen bir sorun oluştu</h1>
        <p className="mt-2 text-sm text-navy-muted">
          Sayfa görüntülenirken bir hata oluştu. Sayfayı yenileyebilir veya ana sayfaya dönebilirsiniz.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
            Sayfayı Yenile
          </button>
          <a href="/" className="btn btn-neutral">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </main>
  )
}

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

/** Render sırasında oluşan beklenmeyen hataları yakalar (asenkron hata yönetiminin yerine geçmez). */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('Beklenmeyen arayüz hatası', { error, componentStack: info.componentStack })
  }

  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children
  }
}
