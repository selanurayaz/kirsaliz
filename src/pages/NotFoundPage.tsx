import { Link } from 'react-router'
import { ROUTES } from '@/lib/constants'

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-navy-800">Sayfa bulunamadı</h1>
      <p className="mt-2 text-slate-600">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link
        to={ROUTES.home}
        className="btn btn-primary mt-6"
      >
        Ana sayfaya dön
      </Link>
    </section>
  )
}
