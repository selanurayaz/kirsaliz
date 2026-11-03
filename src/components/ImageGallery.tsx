import { StatusMessage } from '@/components/StatusMessage'
import type { ServiceRequestAttachment } from '@/types/database'

interface ImageGalleryProps {
  attachments: ServiceRequestAttachment[]
  imageUrls: Map<string, string>
  error: string | null
}

/** Özel bucket'taki fotoğrafları imzalı adreslerle gösterir. */
export function ImageGallery({ attachments, imageUrls, error }: ImageGalleryProps) {
  if (attachments.length === 0) return null

  return (
    <section aria-labelledby="fotograflar" className="card p-5 sm:p-8">
      <h2 id="fotograflar" className="text-lg font-semibold text-navy-800">
        Fotoğraflar
      </h2>
      {error && (
        <div className="mt-3">
          <StatusMessage status={{ type: 'error', message: error }} />
        </div>
      )}
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {attachments.map((attachment) => {
          const url = imageUrls.get(attachment.storage_path)
          return (
            <li key={attachment.id} className="overflow-hidden rounded-lg border border-line bg-page">
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${attachment.original_name} fotoğrafını yeni sekmede aç`}
                >
                  <img src={url} alt={attachment.original_name} loading="lazy" className="h-40 w-full object-cover" />
                </a>
              ) : (
                <div className="flex h-40 items-center justify-center px-3 text-center text-xs text-muted">
                  Fotoğraf görüntülenemiyor
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
