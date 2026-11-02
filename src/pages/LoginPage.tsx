import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { FormField } from '@/components/FormField'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { supabase } from '@/lib/supabase'
import { translateAuthError } from '@/lib/auth-errors'
import { ROUTES } from '@/lib/constants'

export function LoginPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<StatusState>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    setSubmitting(true)
    setStatus(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setStatus({ type: 'error', message: translateAuthError(error) })
        return
      }
      setStatus({ type: 'success', message: 'Giriş başarılı. Panele yönlendiriliyorsunuz…' })
      navigate(ROUTES.panel, { replace: true })
    } catch (err) {
      setStatus({ type: 'error', message: translateAuthError(err as Error) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Giriş Yap"
      subtitle="KırsalİZ hesabınıza erişmek için bilgilerinizi girin."
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link to={ROUTES.register} className="font-semibold text-brand-700 hover:text-brand-800">
            Kayıt olun
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting}>
        <FormField
          id="email"
          label="E-posta"
          type="email"
          autoComplete="email"
          placeholder="ornek@eposta.com"
          required
          disabled={submitting}
        />
        <FormField
          id="password"
          label="Şifre"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={submitting}
        />

        <StatusMessage status={status} />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
    </AuthLayout>
  )
}
