import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn, getRole } from './services/api'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WomanDashboardPage from './pages/WomanDashboardPage'
import ActiveSessionPage from './pages/ActiveSessionPage'
import EmergencyPage from './pages/EmergencyPage'
import GuardianDashboardPage from './pages/GuardianDashboardPage'
import ReportPage from './pages/ReportPage'
import ProfilePage from './pages/ProfilePage'
import LiveMapPage from './pages/LiveMapPage'
import CommunityMapPage from './pages/CommunityMapPage'

function PrivateRoute({ children, role }: { children: React.ReactElement; role?: string }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (role && getRole() !== role) {
    return <Navigate to={getRole() === 'guardian' ? '/guardian' : '/dashboard'} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <PrivateRoute role="woman"><WomanDashboardPage /></PrivateRoute>
        } />
        <Route path="/session" element={
          <PrivateRoute role="woman"><ActiveSessionPage /></PrivateRoute>
        } />
        <Route path="/session/emergency" element={
          <PrivateRoute role="woman"><EmergencyPage /></PrivateRoute>
        } />
        <Route path="/guardian" element={
          <PrivateRoute role="guardian"><GuardianDashboardPage /></PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute role="woman"><ReportPage /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />
        <Route path="/map/live" element={
          <PrivateRoute><LiveMapPage /></PrivateRoute>
        } />
        <Route path="/map/community" element={
          <PrivateRoute><CommunityMapPage /></PrivateRoute>
        } />
        <Route path="*" element={
          isLoggedIn()
            ? <Navigate to={getRole() === 'guardian' ? '/guardian' : '/dashboard'} replace />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  )
}
