import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chargebacks from './pages/Chargebacks'
import ChargebackDetail from './pages/ChargebackDetail'
import NewChargeback from './pages/NewChargeback'
import Analytics from './pages/Analytics'
import AuditLogs from './pages/AuditLogs'

function ProtectedLayout({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="flex h-screen bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/chargebacks"
        element={
          <ProtectedLayout>
            <Chargebacks />
          </ProtectedLayout>
        }
      />
      <Route
        path="/chargebacks/:id"
        element={
          <ProtectedLayout>
            <ChargebackDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/new"
        element={
          <ProtectedLayout>
            <NewChargeback />
          </ProtectedLayout>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedLayout>
            <Analytics />
          </ProtectedLayout>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedLayout>
            <AuditLogs />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
