import { createBrowserRouter } from 'react-router'
import { MainLayout } from '@/layouts/MainLayout'
import { GuestOnlyRoute, ProtectedRoute, RoleRoute } from '@/routes/guards'
import {
  HomePage,
  LoginPage,
  RegisterPage,
  PanelPage,
  NewRequestPage,
  MyRequestsPage,
  RequestDetailPage,
  NotFoundPage,
  StaffDashboardPage,
  StaffRequestDetailPage,
  AdminUsersPage,
} from '@/routes/lazy-pages'
import { RouteErrorFallback } from '@/routes/RouteErrorFallback'
import { ROUTES, STAFF_ROLES } from '@/lib/constants'


export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <RouteErrorFallback />,
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
