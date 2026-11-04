import { useId } from 'react'

interface LogoMarkProps {
  className?: string
  /** light: koyu (bordo) zeminde kullanım için açık renkli sürüm */
  tone?: 'default' | 'light'
}

/**
 * KırsalİZ amblemi (şeffaf zeminli, özel SVG şekilleri — yazı tipi harfi değildir):
 * solda bordo gövde, sağ altta bordo kol ve aralarından S kıvrımıyla geçen Fırat çizgisi.
 * Çizgi iki rota halkasında (bildirim → çözüm) biter. Gövde ve kol, nehrin çevresinde
 * maske ile oyularak beyaz boşluk bırakır. Dekoratiftir; marka adı bağlantının etiketindedir.
 * Renkler tema değişkenlerinden gelir. public/favicon.svg kare zeminli sadeleştirilmiş sürümdür.
 */
const RIVER = 'M196 380C270 352 372 318 360 262C350 220 262 238 285 195C300 168 380 160 468 130'
const STEM = 'M222 108H288Q300 108 300 120V300L218 325Q208 328 208 316V120Q208 108 222 108Z'
const ARM = 'M392 268L490 375Q498 388 482 390H388Q378 390 370 382L340 350Z'

export function LogoMark({ className = 'h-10 w-[42px]', tone = 'default' }: LogoMarkProps) {
  const maskId = useId()
  const light = tone === 'light'
  const shape = light ? '#fff' : 'var(--color-primary)'
  const river = light ? 'var(--color-water-light)' : 'var(--color-water)'
  const ringFill = light ? 'var(--color-primary-dark)' : '#fff'

  return (
    <svg viewBox="165 95 335 320" className={className} aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="150" y="80" width="370" height="350">
          <rect x="150" y="80" width="370" height="350" fill="#fff" />
          <path d={RIVER} fill="none" stroke="#000" strokeWidth="66" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`} fill={shape}>
        <path d={STEM} />
        <path d={ARM} />
      </g>
      <path d={RIVER} fill="none" stroke={river} strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="196" cy="380" r="25" fill={ringFill} stroke={shape} strokeWidth="14" />
      <circle cx="468" cy="130" r="25" fill={ringFill} stroke={shape} strokeWidth="14" />
    </svg>
  )
}
