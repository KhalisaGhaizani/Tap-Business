import { lazy, Suspense, type ComponentType } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { RequireAuth } from './auth/AuthContext'
import { PageLoader } from './components/ui'
import { HomePage } from './pages/HomePage'
import { CardUnregisteredPage, NotFoundPage } from './pages/MessagePage'
import { PublicProfilePage } from './pages/PublicProfilePage'

// The public profile is what people see right after a card tap, so it stays in the
// main bundle; the editor, admin and auth pages load on demand.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const EditorPage = lazy(() => import('./pages/EditorPage').then((m) => ({ default: m.EditorPage })))
const LoginPage = named(() => import('./pages/LoginPage'), 'LoginPage')
const ForgotPasswordPage = named(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage')
const SetPasswordPage = named(() => import('./pages/SetPasswordPage'), 'SetPasswordPage')
const TapSimulationPage = named(() => import('./pages/TapSimulationPage'), 'TapSimulationPage')
const AdminLayout = named(() => import('./pages/admin/AdminLayout'), 'AdminLayout')
const AdminUsersPage = named(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage')
const AdminNewUserPage = named(() => import('./pages/admin/AdminNewUserPage'), 'AdminNewUserPage')
const AdminUserPage = named(() => import('./pages/admin/AdminUserPage'), 'AdminUserPage')

function AdminEditorPage() {
  const { id = '' } = useParams()
  return <EditorPage mode={{ kind: 'admin', userId: id }} />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/activate/:token" element={<SetPasswordPage />} />
        <Route path="/reset-password/:token" element={<SetPasswordPage />} />
        <Route path="/tap" element={<TapSimulationPage />} />
        <Route path="/u/:username" element={<PublicProfilePage />} />
        <Route path="/card/:cardId" element={<CardUnregisteredPage />} />

        <Route
          path="/edit/:tab?"
          element={
            <RequireAuth role="customer">
              <EditorPage mode={{ kind: 'self' }} />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/users/:id/edit/:tab?"
          element={
            <RequireAuth role="admin">
              <AdminEditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminUsersPage />} />
          <Route path="users/new" element={<AdminNewUserPage />} />
          <Route path="users/:id" element={<AdminUserPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
