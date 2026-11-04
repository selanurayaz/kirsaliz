import { lazy } from 'react'

// Sayfalar rota bazında ayrı parçalara bölünür; yükleme MainLayout içindeki Suspense ile karşılanır.
export const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
export const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
export const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
export const PanelPage = lazy(() => import('@/pages/PanelPage').then((m) => ({ default: m.PanelPage })))
export const NewRequestPage = lazy(() => import('@/pages/NewRequestPage').then((m) => ({ default: m.NewRequestPage })))
export const MyRequestsPage = lazy(() => import('@/pages/MyRequestsPage').then((m) => ({ default: m.MyRequestsPage })))
export const RequestDetailPage = lazy(() => import('@/pages/RequestDetailPage').then((m) => ({ default: m.RequestDetailPage })))
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
export const StaffDashboardPage = lazy(() => import('@/pages/StaffDashboardPage').then((m) => ({ default: m.StaffDashboardPage })))
export const StaffRequestDetailPage = lazy(() => import('@/pages/StaffRequestDetailPage').then((m) => ({ default: m.StaffRequestDetailPage })))
export const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
export const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
