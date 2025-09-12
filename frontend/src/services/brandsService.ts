import { apiClient } from './base/apiClient'

export type Brand = {
  id: string
  tenant_id: string
  name: string
  description: string
  logo: string
  images: { [key: string]: any }[]
  website: string
  is_active: boolean
  product_count: number
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const brandsService = {
  list: (params: { page?: number; limit?: number; search?: string; is_active?: boolean }) =>
    apiClient.get<{ data: Paginated<Brand> }>(`/api/brands`, { params }).then(r => r.data.data),
  
  get: (id: string) =>
    apiClient.get<{ data: Brand }>(`/api/brands/${id}`).then(r => r.data.data),
  
  create: (payload: { 
    name: string
    description: string
    logo: string
    images: { [key: string]: any }[]
    website: string
  }) =>
    apiClient.post<{ data: Brand }>(`/api/brands`, payload).then(r => r.data.data),
  
  update: (id: string, payload: Partial<{ 
    name: string
    description: string
    logo: string
    images: { [key: string]: any }[]
    website: string
    is_active: boolean
  }>) =>
    apiClient.patch<{ data: Brand }>(`/api/brands/${id}`, payload).then(r => r.data.data),
  
  remove: (id: string) =>
    apiClient.delete(`/api/brands/${id}`).then(r => r.data),
} 