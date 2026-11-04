import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useScrollProgress } from '@/hooks/useScrollProgress'

/**
 * Kıvrım noktaları: [eksenden yatay sapma (px), bölüm sırası, bölüm içindeki oran].
 * Her nokta dikey teğetli bir ekstremumdur; ardışık noktalar yumuşak S eğrisiyle bağlanır.
 * Sapmalar içerik yerleşimine göre seçildi:
 *  - Değer bölümü ve bölüm girişleri: sütunlar arası boşluk (merkez ±56 px) içinde geniş kıvrım.
 *  - Durak/rol bölümleri: düğümler (r=24 / r=8) merkezde durduğu için sapma düğümün altında kalır.
 */
type Anchor = readonly [dx: number, section: number, fraction: number]

const DESKTOP: readonly Anchor[] = [
  [44, 0, 0.5],
  [-38, 1, 0.07],
  [18, 1, 0.42],
  [-18, 1, 0.8],
  [30, 2, 0.1],
  [-11, 2, 0.45],
  [11, 2, 0.8],
]
const MOBILE: readonly Anchor[] = [
  [9, 0, 0.5],
  [-6, 1, 0.3],
  [6, 1, 0.75],
  [-5, 2, 0.4],
  [4, 2, 0.8],
]

const DESKTOP_WIDTH = 240 // md+ : sayfa ortasına oturur
const MOBILE_WIDTH = 72 // < md : sol kenar boyunca, eksen x=36
const BREAKPOINT = 768

/** Üst ve alt uçlar dikey teğetli sabit eksende; aradaki geçişler kübik bezier S eğrileridir. */
function buildPath(width: number, height: number, anchors: readonly Anchor[], sections: { top: number; height: number }[]) {
  const cx = width / 2
  const points: [number, number][] = [[cx, 0]]
  anchors.forEach(([dx, index, fraction], i) => {
    const section = sections[index]
    const y = section ? section.top + section.height * fraction : (height * (i + 1)) / (anchors.length + 1)
    points.push([cx + dx, Math.min(height, Math.max(0, y))])
  })
  points.push([cx, height])

  let d = `M${points[0][0].toFixed(1)} 0`
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const k = (y1 - y0) * 0.5
    d += ` C${x0.toFixed(1)} ${(y0 + k).toFixed(1)} ${x1.toFixed(1)} ${(y1 - k).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  return d
}

/**
 * Sayfa boyunca süren Fırat: çocuk bölümlerin arkasında, tek bir SVG olarak çizilir.
 * Path, gerçek piksel ölçüsünde (esnetme yok) ve bölüm sınırlarına göre üretilir; böylece
 * kıvrımlar içeriğin boşluklarından geçer. İlerleme scroll ile CSS özel özelliğine
 * (--river-progress) yazılır; scroll sırasında React durumu değişmez.
 * Katmanlar: nehir yatağı, ana akış, ince su yansıması ve yalnızca açılmış bölümde akan ışık izi.
 * Dekoratiftir; tüm bilgi sıradan metin olarak sayfada bulunur.
 */
export function RiverScrollStory({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const maskId = useId()
  const [layout, setLayout] = useState({ desktop: true, height: 1800, d: '' })
  useScrollProgress(ref)

  const measure = useCallback(() => {
    const element = ref.current
    if (!element) return
    const desktop = element.clientWidth >= BREAKPOINT
    const height = Math.max(element.offsetHeight, 1)
    const sections = Array.from(element.children)
      .filter((child) => child.tagName === 'SECTION')
      .map((child) => ({ top: (child as HTMLElement).offsetTop, height: (child as HTMLElement).offsetHeight }))
    const d = buildPath(desktop ? DESKTOP_WIDTH : MOBILE_WIDTH, height, desktop ? DESKTOP : MOBILE, sections)
    setLayout((prev) => (prev.d === d && prev.height === height && prev.desktop === desktop ? prev : { desktop, height, d }))
  }, [])

  useLayoutEffect(() => {
    measure()
    const element = ref.current
    if (!element) return
    window.addEventListener('resize', measure)
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(element)
      Array.from(element.children).forEach((child) => observer?.observe(child))
    }
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [measure])

  const { desktop, height, d } = layout
  const width = desktop ? DESKTOP_WIDTH : MOBILE_WIDTH
  // Ölçüm gelmeden önce (test/ilk boyama) düz eksen çizgisi kullanılır.
  const path = d || `M${width / 2} 0 V${height}`

  return (
    <div ref={ref} className="river-story relative">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="pointer-events-none absolute top-0 left-0 max-w-none md:left-1/2 md:-translate-x-1/2"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            <path d={path} pathLength={1} fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" className="river-progress-path" />
          </mask>
        </defs>
        {/* ince iz: henüz açılmamış bölüm */}
        <path d={path} fill="none" stroke="var(--color-water-soft)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={path} pathLength={1} stroke="var(--color-water)" strokeOpacity="0.2" strokeWidth="10" className="river-progress-path" />
          <path d={path} pathLength={1} stroke="var(--color-water)" strokeWidth="5" className="river-progress-path" />
          <path d={path} pathLength={1} stroke="var(--color-water-light)" strokeWidth="1.5" className="river-progress-path" />
        </g>
        <g mask={`url(#${maskId})`}>
          <path
            d={path}
            pathLength={1}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.7"
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
