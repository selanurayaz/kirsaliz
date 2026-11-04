import { useRef, useState, type FormEvent } from 'react'
import { FormField } from '@/components/FormField'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { toUserMessage, UserFacingError } from '@/lib/errors'
import { MIN_PASSWORD_LENGTH, changeMyPassword, validatePasswordForm } from '@/lib/user-profile'

type PasswordErrors = { currentPassword?: string; newPassword?: string; confirmPassword?: string }

/** Mevcut şifre doğrulanarak şifre değiştirme formu. Şifreler hiçbir yerde saklanmaz veya günlüğe yazılmaz. */
export function PasswordChangeForm({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({})
  const [status, setStatus] = useState<StatusState>(null)
  const [saving, setSaving] = useState(false)
  const submitLock = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current) return
    setStatus(null)

    const errors = validatePasswordForm({ currentPassword, newPassword, confirmPassword })
    setFieldErrors(errors ?? {})
    if (errors) {
      setStatus({ type: 'error', message: Object.values(errors)[0] ?? 'Lütfen alanları kontrol edin.' })
      return
    }

    submitLock.current = true
    setSaving(true)
    try {
      await changeMyPassword(email, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus({ type: 'success', message: 'Şifreniz başarıyla değiştirildi.' })
    } catch (err) {
      const message =
        err instanceof UserFacingError ? err.message : toUserMessage(err, 'Şifre değiştirilemedi. Lütfen tekrar deneyin.')
      setStatus({ type: 'error', message })
    } finally {
      submitLock.current = false
      setSaving(false)
    }
  }

  const invalid = (key: keyof PasswordErrors) => (fieldErrors[key] ? true : undefined)

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={saving}
      aria-labelledby="sifre-baslik"
      className="card space-y-4 p-5 sm:p-6"
    >
      <div>
        <h2 id="sifre-baslik" className="text-lg font-bold text-navy-800">
          Şifre Değiştir
        </h2>
        <p className="mt-1 text-xs text-muted">Güvenliğiniz için önce mevcut şifrenizi doğrulamanız gerekir.</p>
      </div>

      <FormField
        id="currentPassword"
        label="Mevcut Şifre *"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        disabled={saving}
        aria-invalid={invalid('currentPassword')}
      />
      <FormField
        id="newPassword"
        label="Yeni Şifre *"
        type="password"
        autoComplete="new-password"
        placeholder={`En az ${MIN_PASSWORD_LENGTH} karakter`}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        disabled={saving}
        aria-invalid={invalid('newPassword')}
      />
      <FormField
        id="confirmPassword"
        label="Yeni Şifre (Tekrar) *"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={saving}
        aria-invalid={invalid('confirmPassword')}
      />

      <StatusMessage status={status} />

      <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
        {saving ? 'Şifre değiştiriliyor…' : 'Şifreyi Değiştir'}
      </button>
    </form>
  )
}
