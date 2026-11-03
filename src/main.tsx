import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '@/routes/router'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { AuthProvider } from '@/context/AuthProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
