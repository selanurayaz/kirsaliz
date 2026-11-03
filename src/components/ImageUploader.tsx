import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { IMAGE_LIMITS } from '@/lib/service-request-config'
import { formatFileSize, validateImageFiles } from '@/lib/service-requests'

interface ImageUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

interface Preview {
  file: File
  url: string
}

export function ImageUploader({ files, onChange, disabled = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [previews, setPreviews] = useState<Preview[]>([])

  // Önizleme adreslerini üret ve bileşen güncellenince/kapanınca serbest bırak.
  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı kaynağı (nesne adresi) ile senkronizasyon
    setPreviews(next)
    return () => next.forEach((p) => URL.revokeObjectURL(p.url))
  }, [files])

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = '' // aynı dosya tekrar seçilebilsin
    if (selected.length === 0) return

    const { accepted, errors: validationErrors } = validateImageFiles(files, selected)
    setErrors(validationErrors)
    if (accepted.length > 0) onChange([...files, ...accepted])
  }

  function handleRemove(index: number) {
    setErrors([])
    onChange(files.filter((_, i) => i !== index))
  }

  const full = files.length >= IMAGE_LIMITS.maxCount

  return (
    <div className="space-y-3">
      <div>
        <span className="field-label">Fotoğraflar (isteğe bağlı)</span>
        <p id="gorsel-ipucu" className="mt-0.5 text-xs text-muted">
          En fazla {IMAGE_LIMITS.maxCount} fotoğraf; JPEG, PNG veya WebP; her biri en fazla 5 MB.
        </p>
      </div>

      <input
        ref={inputRef}
        id="gorseller"
        type="file"
        accept={IMAGE_LIMITS.mimeTypes.join(',')}
        multiple
        className="sr-only"
        onChange={handleSelect}
        disabled={disabled || full}
        aria-label="Fotoğraf dosyaları"
        aria-describedby="gorsel-ipucu"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || full}
        className="btn btn-neutral"
      >
        {full ? 'Fotoğraf sınırına ulaşıldı' : 'Fotoğraf Seç'}
      </button>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-md border border-destructive-border bg-destructive-soft px-3 py-2 text-sm text-destructive-hover">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {previews.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {previews.map((preview, index) => (
            <li key={preview.url} className="overflow-hidden rounded-lg border border-line bg-white">
              <img src={preview.url} alt={`Seçilen fotoğraf: ${preview.file.name}`} className="h-32 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="min-w-0 text-xs text-slate-600">
                  <span className="block truncate">{preview.file.name}</span>
                  <span className="text-muted">{formatFileSize(preview.file.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  aria-label={`${preview.file.name} fotoğrafını kaldır`}
                  className="btn btn-danger-outline btn-sm shrink-0 text-xs"
                >
                  Kaldır
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
