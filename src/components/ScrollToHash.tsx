import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Rota değişiminde sayfayı başa, #hash varsa ilgili bölüme kaydırır. */
export function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}
