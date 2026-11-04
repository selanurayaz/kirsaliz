import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { FormField } from '@/components/FormField'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { supabase } from '@/lib/supabase'
import { translateAuthError } from '@/lib/auth-errors'
import { ROUTES } from '@/lib/constants'

const MIN_PASSWORD_LENGTH = 8

export function RegisterPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<StatusState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const fullName = String(data.get('fullName') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const passwordConfirm = String(data.get('passwordConfirm') ?? '')

    if (!fullName) {
      setStatus({ type: 'error', message: 'Lütfen adınızı ve soyadınızı girin.' })
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus({ type: 'error', message: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` })
      return
    }
    if (password !== passwordConfirm) {
      setStatus({ type: 'error', message: 'Şifreler eşleşmiyor. Lütfen iki alana da aynı şifreyi girin.' })
      return
    }

    setSubmitting(true)
    setStatus(null)

    try {
      const { data: result, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...(phone ? { phone } : {}),
          },
          emailRedirectTo: `${window.location.origin}${ROUTES.login}`,
        },
      })

      if (error) {
        setStatus({ type: 'error', message: translateAuthError(error) })
        return
      }

      if (!result.session) {
        // E-posta zaten kayıtlıysa Supabase, hesabın varlığını gizlemek için boş "identities" döndürür.
        if (result.user && result.user.identities?.length === 0) {
          setStatus({ type: 'error', message: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var.' })
          return
        }

        // E-posta doğrulaması açık: oturum yok, kullanıcı gelen kutusunu kontrol etmeli.
        form.reset()
        setCompleted(true)
        setStatus({
          type: 'success',
          message: `Kayıt başarılı! ${email} adresine bir doğrulama bağlantısı gönderdik. Hesabınızı etkinleştirmek için e-postanızı kontrol edin, ardından giriş yapın.`,
        })
        return
      }

      setStatus({ type: 'success', message: 'Kayıt başarılı. Panele yönlendiriliyorsunuz…' })
      navigate(ROUTES.panel, { replace: true })
    } catch (err) {
      setStatus({ type: 'error', message: translateAuthError(err as Error) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Kayıt Ol"
      subtitle="Bildirim oluşturmak ve süreci takip etmek için hesap oluşturun."
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to={ROUTES.login} className="link underline">
            Giriş yapın
          </Link>
        </>
      }
    >
      {completed ? (
        <div className="space-y-4">
          <StatusMessage status={status} />
          <Link
            to={ROUTES.login}
            className="btn btn-primary w-full"
          >
            Giriş sayfasına git
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting}>
          <FormField
            id="fullName"
            label="Ad Soyad"
            type="text"
            autoComplete="name"
            placeholder="Adınız Soyadınız"
            required
            disabled={submitting}
          />
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
            id="phone"
            label="Telefon (isteğe bağlı)"
            type="tel"
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            disabled={submitting}
          />
          <FormField
            id="password"
            label="Şifre"
            type="password"
            autoComplete="new-password"
            placeholder="En az 8 karakter"
            minLength={MIN_PASSWORD_LENGTH}
            required
            disabled={submitting}
          />
          <FormField
            id="passwordConfirm"
            label="Şifre (Tekrar)"
            type="password"
            autoComplete="new-password"
            placeholder="Şifrenizi tekrar girin"
            minLength={MIN_PASSWORD_LENGTH}
            required
            disabled={submitting}
          />

          <StatusMessage status={status} />

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? 'Kayıt oluşturuluyor…' : 'Kayıt Ol'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
