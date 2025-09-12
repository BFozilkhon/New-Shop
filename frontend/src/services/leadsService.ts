import { apiClient } from './base/apiClient'

export type Lead = {
  id: string
  title: string
  name?: string
  description?: string
  company?: string
  company_name?: string
  customer_name?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contacts?: string[]
  amount?: number
  price?: number
  currency?: string
  status: string
  stage?: string
  owner_id?: string
  assigned_to?: string
  priority?: string
  priority_int?: number
  probability?: number
  source?: string
  source_details?: string
  expected_close_date?: string
  closing_date?: string | null
  notes?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export type Paginated<T> = { items: T[]; total: number }

export const leadsService = {
  list: (params?: any) => apiClient.get<{ data: Paginated<Lead> }>(`/api/leads`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: Lead }>(`/api/leads/${id}`).then(r => r.data.data),
  create: (data: any) => apiClient.post<{ data: Lead }>(`/api/leads`, data).then(r => r.data.data),
  update: (id: string, data: any) => apiClient.patch<{ data: Lead }>(`/api/leads/${id}`, data).then(r => r.data.data),
  updateStatus: (id: string, status: string) => apiClient.put(`/api/leads/${id}/status`, { status }).then(r => r.data),
  bulkUpdate: (data: any) => apiClient.post(`/api/leads/bulk-update`, data).then(r => r.data),
  getStages: async () => {
    const res = await apiClient.get<{ data: any[] }>(`/api/pipeline/stages`)
    const items = res.data?.data || []
    return items.map((s: any) => ({
      id: s.id || s.ID || s._id || s._id?.$oid,
      key: s.key || s.Key || s.name || s.Name,
      title: s.title || s.Title || s.name || s.Name,
      order: s.order || s.Order || s.position || 0,
    }))
  },
  createStage: (data: { key: string; title: string; order?: number }) => apiClient.post(`/api/pipeline/stages`, data).then(r => r.data),
  reorderStages: (keys: string[]) => apiClient.put(`/api/pipeline/stages/reorder`, { keys }).then(r => r.data),
  deleteStage: (key: string) => apiClient.delete(`/api/pipeline/stages/${key}`).then(r => r.data),
} 