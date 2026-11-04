import { useEffect, useSyncExternalStore, type RefObject } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

/** Kullanıcı hareketi azaltmayı tercih ediyor mu? (Sunucu/test ortamında false.) */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : false),
    () => false,
  )
}

/**
 * Elemanın görünüm alanındaki ilerlemesini (0–1) bir CSS özel özelliğine yazar.
 * React durumu güncellenmez: pasif scroll dinleyicisi + requestAnimationFrame ile
 * doğrudan style.setProperty kullanılır. Hareket azaltma açıksa değer 1'de sabitlenir.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, property = '--river-progress') {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (reduced) {
      element.style.setProperty(property, '1')
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const anchor = window.innerHeight * 0.6
      const progress = Math.min(1, Math.max(0, (anchor - rect.top) / Math.max(rect.height, 1)))
      element.style.setProperty(property, progress.toFixed(4))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, property, reduced])
}
