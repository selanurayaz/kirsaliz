import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Giriş ve kayıt sayfaları için ortak kart düzeni. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <section className="flex items-center justify-center bg-primary-soft/60 px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <div className="mb-6 space-y-1 text-center">
            <h1 className="text-2xl font-bold text-navy">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </section>
  )
}
