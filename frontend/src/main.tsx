import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeroUIProvider } from '@heroui/react'
import AppRoutes from './routes'
import './index.css'
import { ThemeProvider } from './store/theme'
import { AuthProvider } from './store/auth'
import { PreferencesProvider } from './store/prefs'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './config/i18n'

const qc = new QueryClient()

// Initialize language attribute
try {
  const lang = typeof window !== 'undefined' ? (localStorage.getItem('pref_language') || 'EN').toLowerCase() : 'en'
  if (typeof document !== 'undefined') document.documentElement.lang = lang
} catch {}

// Listen to storage changes to update language and refresh when service mode toggles in another tab
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'pref_language' && typeof document !== 'undefined') {
      const lang = (e.newValue || 'EN').toLowerCase()
      document.documentElement.lang = lang
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <HeroUIProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <PreferencesProvider>
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={2000} closeOnClick pauseOnFocusLoss={false} />
          </PreferencesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HeroUIProvider>
  </ThemeProvider>
)
