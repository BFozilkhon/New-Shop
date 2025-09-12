import { apiClient } from './base/apiClient'

export type CompanyRequisites = {
  legal_name: string
  legal_address: string
  country: string
  zip_code: string
  bank_account: string
  bank_name: string
  tin: string
  ibt: string
}

export type Company = {
  id: string
  tenant_id: string
  title: string
  email: string
  requisites: CompanyRequisites
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const companiesService = {
  list: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: Paginated<Company> }>(`/api/companies`, { params }).then(r => r.data.data),
  get: (id: string) =>
    apiClient.get<{ data: Company }>(`/api/companies/${id}`).then(r => r.data.data),
  create: (payload: { title: string; email: string; requisites: CompanyRequisites }) =>
    apiClient.post<{ data: Company }>(`/api/companies`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<{ title: string; email: string; requisites: CompanyRequisites }>) =>
    apiClient.patch<{ data: Company }>(`/api/companies/${id}`, payload).then(r => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/api/companies/${id}`).then(r => r.data),
} 