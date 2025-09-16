import { apiClient } from './base/apiClient'

export type Attribute = {
  id: string
  name: string
  values: string[]
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const attributesService = {
  list: (params: { page?: number; limit?: number; search?: string; is_active?: boolean }) =>
    apiClient.get<{ data: Paginated<Attribute> }>(`/api/attributes`, { params }).then(r => r.data.data),
  
  get: (id: string) =>
    apiClient.get<{ data: Attribute }>(`/api/attributes/${id}`).then(r => r.data.data),
  
  create: (payload: { name: string; values: string[] }) =>
    apiClient.post<{ data: Attribute }>(`/api/attributes`, payload).then(r => r.data.data),
  
  update: (id: string, payload: Partial<{ name: string; values: string[]; is_active: boolean }>) =>
    apiClient.patch<{ data: Attribute }>(`/api/attributes/${id}`, payload).then(r => r.data.data),
  
  remove: (id: string) =>
    apiClient.delete(`/api/attributes/${id}`).then(r => r.data),
} 