import { useEffect, useRef, useState } from 'react'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { SelectField } from '@/components/SelectField'
import { StatusMessage } from '@/components/StatusMessage'
import { TextAreaField } from '@/components/TextAreaField'
import { logError, toUserMessage } from '@/lib/errors'
import {
  assignRequest,
  getAvailableFieldPersonnel,
  rejectRequest,
  resolveRequest,
  reviewRequest,
  startRequest,
} from '@/lib/staff-requests'
import type { FieldPersonnelOption, StaffRequestDetail, UserRole } from '@/types/database'

type ActionKind = 'review' | 'assign' | 'reject' | 'start' | 'resolve'

interface ActionConfig {
  title: string
  description: string
  confirmLabel: string
  tone: 'primary' | 'danger'
  noteLabel: string
  noteRequired: boolean
  success: string
}

const MIN_NOTE = 10

const ACTIONS: Record<ActionKind, ActionConfig> = {
  review: {
    title: 'Talebi incelemeye al',
    description: 'Talep "İnceleniyor" durumuna geçecek ve vatandaş durumu görebilecek.',
    confirmLabel: 'İncelemeye Al',
    tone: 'primary',
    noteLabel: 'Not (isteğe bağlı)',
    noteRequired: false,
    success: 'Talep incelemeye alındı.',
  },
  assign: {
    title: 'Saha personeline ata',
    description: 'Seçtiğiniz personel talebi kendi görev listesinde görecek.',
    confirmLabel: 'Ata',
    tone: 'primary',
    noteLabel: 'Not (isteğe bağlı)',
    noteRequired: false,
    success: 'Talep personele atandı.',
  },
  reject: {
    title: 'Talebi reddet',
    description: 'Bu işlem geri alınamaz. Reddetme gerekçesi vatandaşın göreceği durum geçmişine eklenir.',
    confirmLabel: 'Talebi Reddet',
    tone: 'danger',
    noteLabel: 'Reddetme gerekçesi (zorunlu)',
    noteRequired: true,
    success: 'Talep reddedildi.',
  },
  start: {
    title: 'Çalışmaya başla',
    description: 'Talep "İşlemde" durumuna geçecek.',
    confirmLabel: 'Çalışmaya Başla',
    tone: 'primary',
    noteLabel: 'Not (isteğe bağlı)',
    noteRequired: false,
    success: 'Çalışma başlatıldı.',
  },
  resolve: {
    title: 'Talebi çözüldü olarak işaretle',
    description: 'Bu işlem geri alınamaz. Yapılan işlemi açıklayın; açıklama durum geçmişine eklenir.',
    confirmLabel: 'Çözüldü Olarak İşaretle',
    tone: 'primary',
    noteLabel: 'Yapılan işlemin açıklaması (zorunlu)',
    noteRequired: true,
    success: 'Talep çözüldü olarak işaretlendi.',
  },
}

interface RequestActionPanelProps {
  request: StaffRequestDetail
  role: UserRole
  userId: string
  /** Başarılı işlemden sonra çağrılır; üst bileşen talebi ve geçmişi yeniler. */
  onDone: (message: string) => void
}

export function RequestActionPanel({ request, role, userId, onDone }: RequestActionPanelProps) {
  const [active, setActive] = useState<ActionKind | null>(null)
  const [note, setNote] = useState('')
  const [personnelId, setPersonnelId] = useState('')
  const [personnel, setPersonnel] = useState<FieldPersonnelOption[]>([])
  const [personnelError, setPersonnelError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  const isManager = role === 'admin' || role === 'department_officer'
  const isAssignee = role === 'field_personnel' && request.assigned_to === userId
  const { status } = request

  const canReview = isManager && status === 'submitted'
  const canAssign = isManager && ['submitted', 'under_review', 'assigned', 'in_progress'].includes(status)
  const canReject = isManager && ['submitted', 'under_review', 'assigned', 'in_progress'].includes(status)
  const canStart = isAssignee && status === 'assigned'
  const canResolve = isAssignee && status === 'in_progress'
  const anyAction = canReview || canAssign || canReject || canStart || canResolve

  // Atanabilir personel listesi (yalnızca yöneticiler için)
  useEffect(() => {
    if (!canAssign) return
    let alive = true
    getAvailableFieldPersonnel(request.department_id)
      .then((list) => {
        if (alive) setPersonnel(list)
      })
      .catch((err: unknown) => {
        logError('Personel listesi yüklenemedi', err)
        if (alive) setPersonnelError(toUserMessage(err, 'Personel listesi yüklenemedi.'))
      })
    return () => {
      alive = false
    }
  }, [canAssign, request.department_id])

  function open(kind: ActionKind) {
    setActive(kind)
    setNote('')
    setPersonnelId('')
    setError(null)
  }

  const config = active ? ACTIONS[active] : null
  const trimmedNote = note.trim()
  const noteTooShort = Boolean(config?.noteRequired) && trimmedNote.length < MIN_NOTE
  const assignMissing = active === 'assign' && !personnelId
  const reassigning = Boolean(request.assigned_to)

  async function confirm() {
    if (!active || busyRef.current || noteTooShort || assignMissing) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      switch (active) {
        case 'review':
          await reviewRequest(request.id, note)
          break
        case 'assign':
          await assignRequest(request.id, personnelId, note)
          break
        case 'reject':
          await rejectRequest(request.id, note)
          break
        case 'start':
          await startRequest(request.id, note)
          break
        case 'resolve':
          await resolveRequest(request.id, note)
          break
      }
      const message = active === 'assign' && reassigning ? 'Talep yeniden atandı.' : ACTIONS[active].success
      setActive(null)
      onDone(message)
    } catch (err) {
      setError(toUserMessage(err, 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="islemler" className="card p-5 sm:p-8">
      <h2 id="islemler" className="text-lg font-semibold text-navy">
        İşlemler
      </h2>

      {!anyAction ? (
        <p className="mt-3 text-sm text-muted">Bu talep için şu anda yapabileceğiniz bir işlem yok.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {canReview && (
            <button
              type="button"
              onClick={() => open('review')}
              disabled={busy}
              className="btn btn-primary"
            >
              İncelemeye Al
            </button>
          )}
          {canAssign && (
            <button
              type="button"
              onClick={() => open('assign')}
              disabled={busy}
              className="btn btn-primary"
            >
              {reassigning ? 'Yeniden Ata' : 'Personele Ata'}
            </button>
          )}
          {canStart && (
            <button
              type="button"
              onClick={() => open('start')}
              disabled={busy}
              className="btn btn-primary"
            >
              Çalışmaya Başla
            </button>
          )}
          {canResolve && (
            <button
              type="button"
              onClick={() => open('resolve')}
              disabled={busy}
              className="btn btn-primary"
            >
              Çözüldü Olarak İşaretle
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={() => open('reject')}
              disabled={busy}
              className="btn btn-danger-outline"
            >
              Reddet
            </button>
          )}
        </div>
      )}

      {config && (
        <ConfirmationDialog
          open
          title={active === 'assign' && reassigning ? 'Talebi yeniden ata' : config.title}
          description={config.description}
          confirmLabel={active === 'assign' && reassigning ? 'Yeniden Ata' : config.confirmLabel}
          tone={config.tone}
          busy={busy}
          confirmDisabled={noteTooShort || assignMissing}
          onConfirm={() => void confirm()}
          onCancel={() => setActive(null)}
        >
          {active === 'assign' && (
            <>
              <SelectField
                id="personel"
                label="Saha personeli *"
                value={personnelId}
                onChange={(e) => setPersonnelId(e.target.value)}
                disabled={busy}
                hint={
                  personnelError
                    ? undefined
                    : personnel.length === 0
                      ? 'Bu birimde atanabilir aktif saha personeli bulunmuyor.'
                      : undefined
                }
                error={personnelError ?? undefined}
              >
                <option value="">Personel seçin</option>
                {personnel
                  .filter((p) => p.id !== request.assigned_to)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name?.trim() || 'Adsız personel'}
                    </option>
                  ))}
              </SelectField>
            </>
          )}
          <TextAreaField
            id="islem-notu"
            label={config.noteLabel}
            rows={3}
            maxLength={600}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            required={config.noteRequired}
            hint={config.noteRequired ? `En az ${MIN_NOTE} karakter (${trimmedNote.length}/600).` : undefined}
            error={config.noteRequired && note.length > 0 && noteTooShort ? `En az ${MIN_NOTE} karakter yazın.` : undefined}
          />
          <StatusMessage status={error ? { type: 'error', message: error } : null} />
        </ConfirmationDialog>
      )}
    </section>
  )
}
