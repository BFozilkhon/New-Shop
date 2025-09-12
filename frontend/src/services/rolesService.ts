import { apiClient } from './base/apiClient'

export type Role = {
  id: string
  name: string
  key: string
  description?: string
  permissions?: string[]
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export type PermissionItem = { key: string; name: string }
export type PermissionGroup = { key: string; name: string; items: PermissionItem[] }

export const rolesService = {
  list: (params: { page?: number; limit?: number; search?: string; is_active?: boolean }) =>
    apiClient.get<{ data: Paginated<Role> }>(`/api/roles`, { params }).then(r => r.data.data),
  get: (id: string) =>
    apiClient.get<{ data: Role }>(`/api/roles/${id}`).then(r => r.data.data),
  create: (payload: { name: string; key: string; description?: string; permissions?: string[] }) =>
    apiClient.post<{ data: Role }>(`/api/roles`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<{ name: string; key: string; description: string; permissions: string[]; is_active: boolean }>) =>
    apiClient.patch<{ data: Role }>(`/api/roles/${id}`, payload).then(r => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/api/roles/${id}`).then(r => r.data),
  permissions: () =>
    apiClient.get<{ data: PermissionGroup[] }>(`/api/permissions`).then(r => r.data.data),
}
