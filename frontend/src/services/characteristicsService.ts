import { apiClient } from './base/apiClient'

export type Characteristic = {
  id: string
  name: string
  type: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const characteristicsService = {
  list: (params: { page?: number; limit?: number; search?: string; is_active?: boolean; type?: string }) =>
    apiClient.get<{ data: Paginated<Characteristic> }>(`/api/characteristics`, { params }).then(r => r.data.data),
  
  get: (id: string) =>
    apiClient.get<{ data: Characteristic }>(`/api/characteristics/${id}`).then(r => r.data.data),
  
  create: (payload: { name: string; type?: string }) =>
    apiClient.post<{ data: Characteristic }>(`/api/characteristics`, payload).then(r => r.data.data),
  
  update: (id: string, payload: Partial<{ name: string; type: string; is_active: boolean }>) =>
    apiClient.patch<{ data: Characteristic }>(`/api/characteristics/${id}`, payload).then(r => r.data.data),
  
  remove: (id: string) =>
    apiClient.delete(`/api/characteristics/${id}`).then(r => r.data),
} 