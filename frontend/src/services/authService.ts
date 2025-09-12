import { apiClient } from './base/apiClient'
import type { User } from './usersService'

export type LoginRequest = { email: string; password: string; remember?: boolean }
export type LoginResponse = { token: string; user: User }

export const authService = {
  login: (payload: LoginRequest) =>
    apiClient.post<{ data: LoginResponse }>(`/api/auth/login`, payload).then(r => r.data.data),
  me: () =>
    apiClient.get<{ data: { user: User; permissions: string[] } }>(`/api/auth/me`).then(r => r.data.data),
} 