import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CasesPage from './pages/CasesPage'
import CaseDetailPage from './pages/CaseDetailPage'
import ClientsPage from './pages/ClientsPage'
import HearingsPage from './pages/HearingsPage'
import DocumentsPage from './pages/DocumentsPage'
import SearchPage from './pages/SearchPage'
import ResearchPage from './pages/ResearchPage'
import SettingsPage from './pages/SettingsPage'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:id" element={<CaseDetailPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="hearings" element={<HearingsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
