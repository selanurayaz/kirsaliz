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
import { StaffDashboardPage } from '@/pages/StaffDashboardPage'
import { StaffRequestDetailPage } from '@/pages/StaffRequestDetailPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { GuestOnlyRoute, ProtectedRoute, RoleRoute } from '@/routes/guards'
import { ROUTES, STAFF_ROLES } from '@/lib/constants'

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
          {
            element: <RoleRoute allowed={STAFF_ROLES} />,
            children: [
              { path: ROUTES.staffDashboard, element: <StaffDashboardPage /> },
              { path: ROUTES.staffRequestDetail, element: <StaffRequestDetailPage /> },
            ],
          },
          {
            element: <RoleRoute allowed={['admin']} />,
            children: [{ path: ROUTES.adminUsers, element: <AdminUsersPage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
