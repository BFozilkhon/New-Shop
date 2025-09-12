import { apiClient } from './base/apiClient'

export type DaySchedule = { enabled: boolean; open: string; close: string }
export type WeekSchedule = { mon: DaySchedule; tue: DaySchedule; wed: DaySchedule; thu: DaySchedule; fri: DaySchedule; sat: DaySchedule; sun: DaySchedule }
export type StoreContacts = { phone: string; facebook: string; instagram: string; telegram: string; website: string }

export type Store = {
  id: string
  tenant_id: string
  company_id: string
  title: string
  square: number
  tin: string
  working: WeekSchedule
  contacts: StoreContacts
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const storesService = {
  list: (params: { page?: number; limit?: number; search?: string; company_id?: string }) =>
    apiClient.get<{ data: Paginated<Store> }>(`/api/stores`, { params }).then(r => r.data.data),
  get: (id: string) =>
    apiClient.get<{ data: Store }>(`/api/stores/${id}`).then(r => r.data.data),
  create: (payload: { company_id: string; title: string; square: number; tin: string; working: WeekSchedule; contacts: StoreContacts }) =>
    apiClient.post<{ data: Store }>(`/api/stores`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<{ company_id: string; title: string; square: number; tin: string; working: WeekSchedule; contacts: StoreContacts }>) =>
    apiClient.patch<{ data: Store }>(`/api/stores/${id}`, payload).then(r => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/api/stores/${id}`).then(r => r.data),
} 