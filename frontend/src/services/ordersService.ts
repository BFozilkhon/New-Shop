import { apiClient } from './base/apiClient'
import type { Paginated } from './productsService'

export type OrderUser = { id: string; name: string }
export type OrderShop = { id: string; name: string }
export type OrderSupplier = { id: string; name: string; phone_numbers?: string[] }
export type OrderItem = { id?: string; product_id?: string; product_name?: string; product_sku?: string; quantity: number; unit_price: number; total_price?: number; supply_price?: number; retail_price?: number; unit?: string; returned_quantity?: number }

export type Order = {
  id: string
  tenant_id: string
  external_id?: number
  name: string
  invoice_number?: number
  comment?: string
  company_id?: string
  allowed_shops?: string
  type: string
  status_id?: string
  is_finished?: boolean
  is_from_file?: boolean
  sale_progress?: number
  settlement_type?: string
  retail_price_change_type?: string
  supplier_id: string
  supplier?: OrderSupplier
  shop_id: string
  shop?: OrderShop
  created_by?: OrderUser
  accepted_by?: OrderUser
  created_at: string
  updated_at: string
  accepting_date?: string
  payment_date?: string
  deleted_at?: number
  total_price?: number
  total_supply_price?: number
  total_retail_price?: number
  total_paid_amount?: number
  total_amount_debit?: number
  total_returned_amount?: number
  processed_supply_price?: number
  to_return_amount?: number
  returned_payments?: number
  items_count?: number
  items: OrderItem[]
}

export const ordersService = {
  list: (params: any) => apiClient.get<{ data: Paginated<Order> }>(`/api/orders`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: Order }>(`/api/orders/${id}`).then(r => r.data.data),
  create: (payload: Partial<Order>) => apiClient.post<{ data: Order }>(`/api/orders`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<Order>) => apiClient.patch<{ data: Order }>(`/api/orders/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/orders/${id}`).then(r => r.data),
  addPayment: (id: string, payload: { amount: number; payment_method: string; description?: string; payment_date?: string }) => apiClient.post<{ data: Order }>(`/api/orders/${id}/payments`, payload).then(r => r.data.data),

  // helpers
  getShops: () => apiClient.get(`/api/stores`, { params: { page: 1, limit: 200 } }).then(r => (r.data?.data?.items || []).map((s: any) => ({ id: s.id, name: s.title }))),
  getSuppliers: () => apiClient.get(`/api/suppliers`, { params: { page: 1, limit: 200 } }).then(r => (r.data?.data?.items || []).map((s: any) => ({ id: s.id, name: s.name }))),
} 