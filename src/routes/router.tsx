import { createBrowserRouter } from 'react-router'
import { MainLayout } from '@/layouts/MainLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { PanelPage } from '@/pages/PanelPage'
import { NewRequestPage } from '@/pages/NewRequestPage'
import { MyRequestsPage } from '@/pages/MyRequestsPage'
import { RequestDetailPage } from '@/pages/RequestDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { GuestOnlyRoute, ProtectedRoute } from '@/routes/guards'
import { ROUTES } from '@/lib/constants'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.home, element: <HomePage /> },
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.register, element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: ROUTES.panel, element: <PanelPage /> },
          { path: ROUTES.newRequest, element: <NewRequestPage /> },
          { path: ROUTES.myRequests, element: <MyRequestsPage /> },
          { path: ROUTES.requestDetail, element: <RequestDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
