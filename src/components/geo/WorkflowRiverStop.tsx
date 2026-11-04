import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface WorkflowRiverStopProps {
  title: string
  actor: string
  icon: LucideIcon
  /** Geniş ekranda metnin nehrin hangi yanında duracağı */
  side: 'left' | 'right'
  children: ReactNode
}

/**
 * Nehir üzerindeki bir iş akışı durağı. Metin her zaman görünür ve normal içeriktir;
 * yalnızca düğüm (nehir üzerindeki işaret) görünüme girince vurgulanır.
 */
export function WorkflowRiverStop({ title, actor, icon: Icon, side, children }: WorkflowRiverStopProps) {
  const ref = useRef<HTMLLIElement>(null)
  const [active, setActive] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -35% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <li
      ref={ref}
      data-active={active}
      className="river-stop grid grid-cols-[2.5rem_1fr] gap-x-4 pb-10 last:pb-0 md:grid-cols-[1fr_3rem_1fr] md:gap-x-8 md:pb-14"
    >
      <span
        aria-hidden="true"
        className="river-node relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 md:col-start-2 md:h-12 md:w-12"
      >
        <Icon className="h-5 w-5" />
      </span>
      <div
        className={`col-start-2 min-w-0 md:row-start-1 ${
          side === 'left' ? 'md:col-start-1 md:text-right' : 'md:col-start-3'
        }`}
      >
        <p className="text-sm font-semibold text-water">{actor}</p>
        <h3 className="mt-0.5 text-xl font-bold text-navy">{title}</h3>
        <div className="mt-2 max-w-md space-y-2 text-base text-navy-muted md:inline-block">{children}</div>
      </div>
    </li>
  )
}
