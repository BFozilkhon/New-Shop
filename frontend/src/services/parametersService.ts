import { apiClient } from './base/apiClient'

export type Parameter = {
  id: string
  tenant_id: string
  name: string
  type: string
  values: string[]
  unit: string
  required: boolean
  status: string
  category: string
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const parametersService = {
  list: (params: { 
    page?: number
    limit?: number
    search?: string
    type?: string
    status?: string
    category?: string
    required?: boolean
  }) =>
    apiClient.get<{ data: Paginated<Parameter> }>(`/api/parameters`, { params }).then(r => r.data.data),
  
  get: (id: string) =>
    apiClient.get<{ data: Parameter }>(`/api/parameters/${id}`).then(r => r.data.data),
  
  create: (payload: { 
    name: string
    type: string
    values: string[]
    unit: string
    required: boolean
    status: string
    category: string
  }) =>
    apiClient.post<{ data: Parameter }>(`/api/parameters`, payload).then(r => r.data.data),
  
  update: (id: string, payload: Partial<{ 
    name: string
    type: string
    values: string[]
    unit: string
    required: boolean
    status: string
    category: string
  }>) =>
    apiClient.patch<{ data: Parameter }>(`/api/parameters/${id}`, payload).then(r => r.data.data),
  
  remove: (id: string) =>
    apiClient.delete(`/api/parameters/${id}`).then(r => r.data),
} 