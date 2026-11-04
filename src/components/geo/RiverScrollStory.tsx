import { useId, useRef, type ReactNode } from 'react'
import { useScrollProgress } from '@/hooks/useScrollProgress'

// Sayfa boyunca süzülen hafif menderesli akış (viewBox 80x1000; x=40 ekseni). Dikey olarak esnetilir.
const RIVER =
  'M40 0 C46 90 34 170 40 260 S46 430 40 520 S34 690 40 780 S46 900 40 1000'

/**
 * Sayfa boyunca süren Fırat: çocuk bölümlerin arkasında, tek bir SVG olarak çizilir.
 * İlerleme scroll ile CSS özel özelliğine (--river-progress) yazılır; React durumu değişmez.
 * Katmanlar: saydam gövde, ana akış, ince parlak çizgi ve yalnızca açılmış bölümde akan ışık.
 * Dekoratiftir; tüm bilgi sıradan metin olarak sayfada bulunur.
 */
export function RiverScrollStory({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const maskId = useId()
  useScrollProgress(ref)

  return (
    <div ref={ref} className="river-story relative">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 80 1000"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-0 -left-1 h-full w-20 md:left-1/2 md:-translate-x-1/2"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="1000">
            <path d={RIVER} pathLength={1} fill="none" stroke="#fff" strokeWidth="16" className="river-progress-path" />
          </mask>
        </defs>
        {/* ince iz: henüz açılmamış bölüm */}
        <path d={RIVER} fill="none" stroke="var(--color-water-soft)" strokeWidth="3" strokeLinecap="round" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={RIVER} pathLength={1} stroke="var(--color-water)" strokeOpacity="0.16" strokeWidth="12" className="river-progress-path" />
          <path d={RIVER} pathLength={1} stroke="var(--color-water)" strokeWidth="5" className="river-progress-path" />
          <path d={RIVER} pathLength={1} stroke="var(--color-water-light)" strokeWidth="1.5" className="river-progress-path" />
        </g>
        <g mask={`url(#${maskId})`}>
          <path
            d={RIVER}
            pathLength={1}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.8"
            strokeWidth="2"
            strokeLinecap="round"
            className="river-current"
          />
        </g>
      </svg>
      {children}
    </div>
  )
}
