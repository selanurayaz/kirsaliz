import { Link } from 'react-router'
import { ROUTES } from '@/lib/constants'

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-navy-800">Sayfa bulunamadı</h1>
      <p className="mt-2 text-slate-600">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link
        to={ROUTES.home}
        className="mt-6 rounded-md bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"
      >
        Ana sayfaya dön
      </Link>
    </section>
  )
}
