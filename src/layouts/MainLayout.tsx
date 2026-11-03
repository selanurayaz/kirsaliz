import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ScrollToHash } from '@/components/ScrollToHash'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToHash />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
