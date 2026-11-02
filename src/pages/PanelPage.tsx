import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'

/** Geçici panel sayfası — rol bazlı paneller sonraki aşamada eklenecek. */
export function PanelPage() {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [status, setStatus] = useState<StatusState>(null)

  async function handleSignOut() {
    setSigningOut(true)
    setStatus(null)
    try {
      await signOut()
      // Oturum kapandığında ProtectedRoute kullanıcıyı giriş sayfasına yönlendirir.
    } catch {
      setStatus({ type: 'error', message: 'Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.' })
      setSigningOut(false)
    }
  }

  return (
    <section className="bg-slate-100 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-navy-800">Panel</h1>
        <p className="mt-1 text-sm text-slate-500">Hoş geldiniz. Panel özellikleri yakında eklenecek.</p>

        <dl className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Oturum açılan e-posta</dt>
          <dd className="mt-1 text-sm font-semibold break-all text-navy-900">{user?.email}</dd>
        </dl>

        <div className="mt-6 space-y-3">
          <StatusMessage status={status} />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-md bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
          </button>
        </div>
      </div>
    </section>
  )
}
