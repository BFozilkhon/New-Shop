import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../ui/Layout'
import LoginPage from '../ui/LoginPage'
import StatsPage from '../ui/StatsPage'
import CompaniesPage from '../ui/CompaniesPage'
import BillingPage from '../ui/BillingPage'
import FinancePage from '../ui/FinancePage'
import ProfilePage from '../ui/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/statistics" replace />} />
        <Route path="statistics" element={<StatsPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
} 