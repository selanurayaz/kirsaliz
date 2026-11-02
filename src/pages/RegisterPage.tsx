import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { FormField } from '@/components/FormField'
import { ROUTES } from '@/lib/constants'

type Status = { type: 'error' | 'info'; message: string } | null

export function RegisterPage() {
  const [status, setStatus] = useState<Status>(null)

  // Kayıt işlemi (Supabase Auth) sonraki aşamada bağlanacak.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    if (data.get('password') !== data.get('passwordConfirm')) {
      setStatus({ type: 'error', message: 'Şifreler eşleşmiyor.' })
      return
    }

    setStatus({ type: 'info', message: 'Kayıt özelliği henüz aktif değil. Yakında kullanıma sunulacak.' })
  }

  return (
    <AuthLayout
      title="Kayıt Ol"
      subtitle="Bildirim oluşturmak ve süreci takip etmek için hesap oluşturun."
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to={ROUTES.login} className="font-semibold text-brand-700 hover:text-brand-800">
            Giriş yapın
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="fullName" label="Ad Soyad" type="text" autoComplete="name" placeholder="Adınız Soyadınız" required />
        <FormField id="email" label="E-posta" type="email" autoComplete="email" placeholder="ornek@eposta.com" required />
        <FormField id="phone" label="Telefon (isteğe bağlı)" type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" />
        <FormField
          id="password"
          label="Şifre"
          type="password"
          autoComplete="new-password"
          placeholder="En az 8 karakter"
          minLength={8}
          required
        />
        <FormField
          id="passwordConfirm"
          label="Şifre (Tekrar)"
          type="password"
          autoComplete="new-password"
          placeholder="Şifrenizi tekrar girin"
          minLength={8}
          required
        />

        {status && (
          <p
            role={status.type === 'error' ? 'alert' : 'status'}
            className={`rounded-md px-3 py-2 text-sm ${
              status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-navy-50 text-navy-700'
            }`}
          >
            {status.message}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          Kayıt Ol
        </button>
      </form>
    </AuthLayout>
  )
}
