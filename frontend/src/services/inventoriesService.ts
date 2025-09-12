import { apiClient } from './base/apiClient'
import type { Paginated } from './productsService'

export type InventoryUser = { id: string; name: string }

export type Inventory = {
  id: string
  tenant_id: string
  external_id?: number
  name: string
  shop_id: string
  shop_name?: string
  total_measurement_value?: number
  new_products?: number
  shortage?: number
  postponed?: number
  surplus?: number
  difference_sum?: number
  type: 'FULL'|'PARTIAL'|string
  status_id?: string
  process_percentage?: number
  created_at: string
  updated_at: string
  finished_at?: string
  created_by?: InventoryUser
  finished_by?: InventoryUser
  items?: Array<{ product_id?: string; product_name?: string; product_sku?: string; barcode?: string; declared?: number; scanned?: number; unit?: string; price?: number; cost_price?: number }>
}

export const inventoriesService = {
  list: (params: any) => apiClient.get<{ data: Paginated<Inventory> }>(`/api/inventories`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: Inventory }>(`/api/inventories/${id}`).then(r => r.data.data),
  create: (payload: Partial<Inventory>) => apiClient.post<{ data: Inventory }>(`/api/inventories`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<Inventory> & { finished?: boolean }) => apiClient.patch<{ data: Inventory }>(`/api/inventories/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/inventories/${id}`).then(r => r.data),
} 