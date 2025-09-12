import { apiClient } from './base/apiClient'

export type User = {
  id: string
  name: string
  email: string
  role_id: string
  role_name: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  phone?: string
  gender?: string
  date_of_birth?: string
  pref_service_mode?: boolean
  pref_language?: string
}

export type Paginated<T> = { items: T[]; total: number }

export const usersService = {
  list: (params: { page?: number; limit?: number; search?: string; is_active?: boolean; role_key?: string }) =>
    apiClient.get<{ data: Paginated<User> }>(`/api/users`, { params }).then(r => r.data.data),
  get: (id: string) =>
    apiClient.get<{ data: User }>(`/api/users/${id}`).then(r => r.data.data),
  create: (payload: { name: string; email: string; password: string; role_id: string; phone?: string; gender?: string; date_of_birth?: string }) =>
    apiClient.post<{ data: User }>(`/api/users`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<{ name: string; email: string; password: string; role_id: string; is_active: boolean; phone: string; gender: string; date_of_birth: string; pref_service_mode: boolean; pref_language: string }>) =>
    apiClient.patch<{ data: User }>(`/api/users/${id}`, payload).then(r => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/api/users/${id}`).then(r => r.data),
}
