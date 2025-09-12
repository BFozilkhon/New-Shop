import { Outlet, Navigate } from 'react-router-dom'

export default function ProtectedRoutes() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
