import { apiClient } from './base/apiClient'

export type Category = {
  id: string
  name: string
  image?: string
  children?: Category[]
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const categoriesService = {
  list: (params: { page?: number; limit?: number; search?: string; is_active?: boolean }) =>
    apiClient.get<{ data: Paginated<Category> }>(`/api/categories`, { params }).then(r => r.data.data),
  
  getTree: () =>
    apiClient.get<{ data: Category[] }>(`/api/categories/tree`).then(r => r.data.data),
  
  get: (id: string) =>
    apiClient.get<{ data: Category }>(`/api/categories/${id}`).then(r => r.data.data),
  
  create: (payload: { name: string; image?: string }) =>
    apiClient.post<{ data: Category }>(`/api/categories`, payload).then(r => r.data.data),
  
  update: (id: string, payload: Partial<{ name: string; image: string; is_active: boolean }>) =>
    apiClient.patch<{ data: Category }>(`/api/categories/${id}`, payload).then(r => r.data.data),
  
  remove: (id: string) =>
    apiClient.delete(`/api/categories/${id}`).then(r => r.data),
} 