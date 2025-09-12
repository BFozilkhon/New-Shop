import { apiClient } from './base/apiClient'

export type CustomerAddress = {
  country: string
  city: string
  address: string
  post_index: string
  note: string
}

export type Customer = {
  id: string
  tenant_id: string
  first_name: string
  last_name?: string
  middle_name?: string
  date_of_birth?: string | null
  gender?: 'male' | 'female' | ''
  phone_number: string
  primary_language: 'UZ' | 'RU' | 'EN'
  address: CustomerAddress
  email?: string
  telegram?: string
  facebook?: string
  instagram?: string
  created_at?: string
  updated_at?: string
}

export type Paginated<T> = { items: T[]; total: number }

export const customersService = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient.get<{ data: Paginated<Customer> }>(`/api/customers`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: Customer }>(`/api/customers/${id}`).then(r => r.data.data),
  create: (payload: Partial<Customer> & { first_name: string; phone_number: string }) =>
    apiClient.post<{ data: Customer }>(`/api/customers`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<Customer>) =>
    apiClient.patch<{ data: Customer }>(`/api/customers/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/customers/${id}`).then(r => r.data),
} 