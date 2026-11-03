import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { SelectField } from '@/components/SelectField'
import { StatusMessage } from '@/components/StatusMessage'
import { ROLE_LABELS } from '@/lib/constants'
import type { AccessUpdatePayload, AdminUserListItem, Department, UserRole } from '@/types/database'

const ROLES: UserRole[] = ['citizen', 'field_personnel', 'department_officer', 'admin']

function roleNeedsDepartment(role: UserRole): boolean {
  return role === 'department_officer' || role === 'field_personnel'
}

interface UserAccessEditorProps {
  user: AdminUserListItem
  departments: Department[]
  saving: boolean
  error: string | null
  onSave: (payload: AccessUpdatePayload) => void
  onClose: () => void
}

/** Kullanıcının rol, birim ve aktiflik durumunu düzenleyen pencere. */
export function UserAccessEditor({ user, departments, saving, error, onSave, onClose }: UserAccessEditorProps) {
  const [role, setRole] = useState<UserRole>(user.role)
  const [departmentId, setDepartmentId] = useState(user.department_id ?? '')
  const [isActive, setIsActive] = useState(user.is_active)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const needsDepartment = roleNeedsDepartment(role)
  const deactivating = user.is_active && !isActive
  const departmentMissing = needsDepartment && !departmentId
  const unchanged =
    role === user.role && isActive === user.is_active && (needsDepartment ? departmentId : '') === (user.department_id ?? '')
  const leavingFieldRole = user.role === 'field_personnel' && (role !== 'field_personnel' || deactivating)

  function handleRoleChange(next: UserRole) {
    setRole(next)
    if (!roleNeedsDepartment(next)) setDepartmentId('')
  }

  return (
    <ConfirmationDialog
      open
      title="Kullanıcı erişimini düzenle"
      description={`${user.full_name?.trim() || 'Adsız kullanıcı'} · ${user.email}`}
      confirmLabel="Kaydet"
      tone={deactivating ? 'danger' : 'primary'}
      busy={saving}
      confirmDisabled={unchanged || departmentMissing || (deactivating && !confirmDeactivate)}
      onConfirm={() =>
        onSave({
          userId: user.id,
          role,
          departmentId: needsDepartment ? departmentId : null,
          isActive,
        })
      }
      onCancel={onClose}
    >
      <SelectField
        id="kullanici-rol"
        label="Rol"
        value={role}
        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
        disabled={saving}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </SelectField>

      {needsDepartment ? (
        <SelectField
          id="kullanici-birim"
          label="Birim *"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          disabled={saving}
          error={departmentMissing ? 'Bu rol için bir birim seçmelisiniz.' : undefined}
          required
        >
          <option value="">Birim seçin</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="text-xs text-muted">Bu rol için birim tanımlanmaz.</p>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy-800">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => {
              setIsActive(e.target.checked)
              setConfirmDeactivate(false)
            }}
            disabled={saving}
            className="h-4 w-4 rounded border-line-strong accent-primary focus:ring-focus"
          />
          Hesap aktif
        </label>
      </div>

      {deactivating && (
        <div role="alert" className="space-y-2 rounded-md border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-hover">
          <p>
            <strong>Uyarı:</strong> Hesap pasifleştirilirse kullanıcı sisteme erişemez ve işlem yapamaz.
          </p>
          <label className="flex items-start gap-2 font-medium">
            <input
              type="checkbox"
              checked={confirmDeactivate}
              onChange={(e) => setConfirmDeactivate(e.target.checked)}
              disabled={saving}
              className="mt-0.5 h-4 w-4 rounded border-destructive-border accent-destructive focus:ring-destructive"
            />
            Hesabı pasifleştirmeyi onaylıyorum.
          </label>
        </div>
      )}

      {leavingFieldRole && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
          Bu kişiye atanmış açık talepler varsa, erişimi kapandığı için birim yetkilisinin bunları yeniden ataması gerekir.
        </p>
      )}

      <StatusMessage status={error ? { type: 'error', message: error } : null} />
    </ConfirmationDialog>
  )
}
