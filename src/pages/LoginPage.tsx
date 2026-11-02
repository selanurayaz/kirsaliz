import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { FormField } from '@/components/FormField'
import { ROUTES } from '@/lib/constants'

export function LoginPage() {
  const [submitted, setSubmitted] = useState(false)

  // Kimlik doğrulama (Supabase Auth) sonraki aşamada bağlanacak.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="email" label="E-posta" type="email" autoComplete="email" placeholder="ornek@eposta.com" required />
        <FormField
          id="password"
          label="Şifre"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />

        {submitted && (
          <p role="status" className="rounded-md bg-navy-50 px-3 py-2 text-sm text-navy-700">
            Giriş özelliği henüz aktif değil. Yakında kullanıma sunulacak.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-700"
        >
          Giriş Yap
        </button>
      </form>
    </AuthLayout>
  )
}
