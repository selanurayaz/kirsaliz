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
        <span className="block text-sm font-medium text-navy-800">Fotoğraflar (isteğe bağlı)</span>
        <p id="gorsel-ipucu" className="mt-0.5 text-xs text-slate-500">
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
        aria-describedby="gorsel-ipucu"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || full}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {full ? 'Fotoğraf sınırına ulaşıldı' : 'Fotoğraf Seç'}
      </button>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {previews.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {previews.map((preview, index) => (
            <li key={preview.url} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={preview.url} alt={`Seçilen fotoğraf: ${preview.file.name}`} className="h-32 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="min-w-0 text-xs text-slate-600">
                  <span className="block truncate">{preview.file.name}</span>
                  <span className="text-slate-400">{formatFileSize(preview.file.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  aria-label={`${preview.file.name} fotoğrafını kaldır`}
                  className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:opacity-60"
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
