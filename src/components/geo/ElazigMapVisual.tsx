import {
  ELAZIG_OUTLINE_PATH,
  ELAZIG_VIEWBOX,
  FIRAT_EXIT_POINT,
  FIRAT_ROUTE_PATH,
  KEBAN_POINT,
} from '@/components/geo/elazig-geo'

interface ElazigMapVisualProps {
  /** hero: tam kompozisyon + sayfaya akan kol · faint: giriş/kayıt gibi sayfalarda sönük, statik parça */
  variant?: 'hero' | 'faint'
  className?: string
}

// Harita dışına taşan "çıkış kolu": sayfa boyunca süren nehrin üst ucuyla (HomeRiver) aynı eksende biter.
// Değerler haritanın sol kenarına göre viewBox birimindedir; küçük ekranda nehir sola (mobil), geniş ekranda
// sayfa ortasına (md+) oturur.
const LEG_END_X = { mobile: 22, desktop: -4 } as const
const LEG_END_Y = 900

function legPath(endX: number) {
  const { x, y } = FIRAT_EXIT_POINT
  return `M${x} ${y} C${x - 14} ${y + 34} ${endX + 26} ${y + 50} ${endX + 6} ${y + 110} S${endX - 8} ${y + 180} ${endX} ${y + 240} V${LEG_END_Y}`
}

/**
 * Elazığ il sınırı (OpenStreetMap, ODbL) ve stilize Fırat–Keban güzergâhı.
 * Tamamen dekoratiftir (aria-hidden); bilgi çevresindeki metinde de bulunur.
 */
export function ElazigMapVisual({ variant = 'hero', className = '' }: ElazigMapVisualProps) {
  const { width, height } = ELAZIG_VIEWBOX
  const hero = variant === 'hero'
  const cx = width / 2
  const cy = height / 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-auto w-full ${className}`}
      style={hero ? { overflow: 'visible' } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {/* Seyrek kontur çizgileri */}
      {hero &&
        [0.84, 0.68].map((s) => (
          <path
            key={s}
            d={ELAZIG_OUTLINE_PATH}
            transform={`translate(${cx * (1 - s)} ${cy * (1 - s)}) scale(${s})`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
        ))}
      <path
        d={ELAZIG_OUTLINE_PATH}
        fill="#ffffff"
        fillOpacity={hero ? 0.07 : 0.04}
        stroke="#ffffff"
        strokeOpacity={hero ? 0.55 : 0.22}
        strokeWidth={hero ? 1.5 : 1.2}
        strokeLinejoin="round"
      />

      {/* Katmanlı su: geniş/saydam gövde, ana akış, ince parlak çizgi */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" className={hero ? 'river-draw' : undefined}>
        {hero && (
          <path d={FIRAT_ROUTE_PATH} pathLength={1} stroke="var(--color-water-light)" strokeOpacity="0.22" strokeWidth="10" style={{ strokeDasharray: 1 }} />
        )}
        <path
          d={FIRAT_ROUTE_PATH}
          pathLength={1}
          stroke="var(--color-water-light)"
          strokeOpacity={hero ? 0.95 : 0.45}
          strokeWidth={hero ? 4 : 2.5}
          style={{ strokeDasharray: 1 }}
        />
        {hero && (
          <path d={FIRAT_ROUTE_PATH} pathLength={1} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.2" style={{ strokeDasharray: 1 }} />
        )}
      </g>

      {hero && (
        <>
          {/* Haritadan sayfaya akan kol: ekran pikseli cinsinden sabit kalınlık */}
          {(['mobile', 'desktop'] as const).map((key) => (
            <g
              key={key}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={key === 'mobile' ? 'md:hidden' : 'hidden md:block'}
            >
              <path d={legPath(LEG_END_X[key])} stroke="var(--color-water-light)" strokeOpacity="0.22" strokeWidth="11" vectorEffect="non-scaling-stroke" />
              <path d={legPath(LEG_END_X[key])} stroke="var(--color-water-light)" strokeOpacity="0.95" strokeWidth="5" vectorEffect="non-scaling-stroke" />
              <path d={legPath(LEG_END_X[key])} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
          <circle cx={KEBAN_POINT.x} cy={KEBAN_POINT.y} r="9" fill="var(--color-water-light)" fillOpacity="0.25" />
          <circle cx={KEBAN_POINT.x} cy={KEBAN_POINT.y} r="4" fill="#ffffff" />
        </>
      )}
    </svg>
  )
}
