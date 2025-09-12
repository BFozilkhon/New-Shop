import { apiClient } from './base/apiClient'

export type Warehouse = {
  id: string
  tenant_id: string
  name: string
  address: string
  type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const warehousesService = {
  list: (params: { page?: number; limit?: number; search?: string; is_active?: boolean; type?: string }) =>
    apiClient.get<{ data: Paginated<Warehouse> }>(`/api/warehouses`, { params }).then(r => r.data.data),
  
  get: (id: string) =>
    apiClient.get<{ data: Warehouse }>(`/api/warehouses/${id}`).then(r => r.data.data),
  
  create: (payload: { 
    name: string
    address: string
    type: string
  }) =>
    apiClient.post<{ data: Warehouse }>(`/api/warehouses`, payload).then(r => r.data.data),
  
  update: (id: string, payload: Partial<{ 
    name: string
    address: string
    type: string
    is_active: boolean
  }>) =>
    apiClient.patch<{ data: Warehouse }>(`/api/warehouses/${id}`, payload).then(r => r.data.data),
  
  remove: (id: string) =>
    apiClient.delete(`/api/warehouses/${id}`).then(r => r.data),
} 