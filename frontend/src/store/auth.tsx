import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { User } from '../services/usersService'
import { authService } from '../services/authService'
import { rolesService } from '../services/rolesService'
import i18n from '../config/i18n'

export type AuthState = { token: string | null; user: User | null; permissions: string[] }

const AuthContext = createContext<{
  auth: AuthState
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => void
}>({ auth: { token: null, user: null, permissions: [] }, login: async () => {}, logout: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    const perms = localStorage.getItem('permissions')
    return { token, user: user ? JSON.parse(user) : null, permissions: perms ? JSON.parse(perms) : [] }
  })

  useEffect(() => {
    const hydrate = async () => {
      if (auth.token) {
        try {
          const me = await authService.me()
          setAuth({ token: auth.token, user: me.user, permissions: me.permissions })
          localStorage.setItem('user', JSON.stringify(me.user))
          localStorage.setItem('permissions', JSON.stringify(me.permissions))
          // hydrate prefs
          if (typeof me.user.pref_service_mode === 'boolean') {
            localStorage.setItem('pref_service_mode', me.user.pref_service_mode ? '1' : '0')
          }
          if (me.user.pref_language) {
            const lang = (me.user.pref_language || 'EN').toLowerCase()
            localStorage.setItem('pref_language', lang.toUpperCase())
            try { document.documentElement.lang = lang } catch {}
            try { i18n.changeLanguage(lang) } catch {}
          }
          return
        } catch {}
      }
      if (auth.token && auth.user && (!auth.permissions || auth.permissions.length === 0)) {
        try {
          const role = await rolesService.get(auth.user.role_id)
          const permissions = role.permissions || []
          setAuth({ ...auth, permissions })
          localStorage.setItem('permissions', JSON.stringify(permissions))
        } catch (e) {
          // token might be invalid
          setAuth({ token: null, user: null, permissions: [] })
          localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('permissions')
        }
      }
    }
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string, remember?: boolean) => {
    const res = await authService.login({ email, password, remember })
    let permissions: string[] = []
    if (res.user?.role_id) {
      try {
        const role = await rolesService.get(res.user.role_id)
        permissions = role.permissions || []
      } catch {}
    }
    setAuth({ token: res.token, user: res.user, permissions })
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    localStorage.setItem('permissions', JSON.stringify(permissions))
    // hydrate prefs on login
    if (typeof res.user.pref_service_mode === 'boolean') localStorage.setItem('pref_service_mode', res.user.pref_service_mode ? '1' : '0')
    if (res.user.pref_language) {
      const lang = (res.user.pref_language || 'EN').toLowerCase()
      localStorage.setItem('pref_language', lang.toUpperCase())
      try { document.documentElement.lang = lang } catch {}
      try { i18n.changeLanguage(lang) } catch {}
    }
  }

  const logout = () => {
    setAuth({ token: null, user: null, permissions: [] })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
  }

  const value = useMemo(() => ({ auth, login, logout }), [auth])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) } 