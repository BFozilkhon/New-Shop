import { apiClient } from './base/apiClient'

export type ShopServicePart = { name: string; part_number?: string; quantity: number; cost?: number; price: number }
export type ShopServiceItem = { title: string; labor_hours: number; labor_rate: number; labor_cost?: number; labor_price?: number; parts: ShopServicePart[] }
export type ShopServiceMisc = { name: string; amount: number }

export type ShopService = {
  id: string
  tenant_id: string
  customer_id: string
  contact_id: string
  unit_id: string
  chassis_miles: number
  customer_complaint: string
  technician_id: string
  notes: string
  estimate_number: string
  authorization_number: string
  po_number: string
  description: string
  items: ShopServiceItem[]
  shop_supplies: number
  labor_total: number
  parts_total: number
  extras: ShopServiceMisc[]
  extras_total: number
  subtotal: number
  tax_location: 'EXEMPT'|'LOCAL'
  tax_rate: number
  tax_amount: number
  total: number
  created_at: string
  updated_at: string
  customer_name?: string
  unit_label?: string
}

export type Paginated<T> = { items: T[]; total: number }

export const shopServicesService = {
  async list(params: { page: number; limit: number; search?: string }) {
    const res = await apiClient.get<{ data: Paginated<ShopService> }>(`/api/shop/services`, { params })
    return res.data.data
  },
  async get(id: string) {
    const res = await apiClient.get<{ data: ShopService }>(`/api/shop/services/${id}`)
    return res.data.data
  },
  async create(payload: Partial<ShopService>) {
    const res = await apiClient.post<{ data: ShopService }>(`/api/shop/services`, payload)
    return res.data.data
  },
  async update(id: string, payload: Partial<ShopService>) {
    const res = await apiClient.patch<{ data: ShopService }>(`/api/shop/services/${id}`, payload)
    return res.data.data
  },
  async remove(id: string) {
    await apiClient.delete(`/api/shop/services/${id}`)
  },
} 