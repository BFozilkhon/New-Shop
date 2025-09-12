import { apiClient } from './base/apiClient'

export type PriceTagProperty = {
  key: string
  label: string
  x: number
  y: number
  width: number
  height: number
  font: string
  font_size: number
  align: 'left'|'center'|'right'
  bold: boolean
}

export type PriceTagTemplate = {
  id: string
  tenant_id: string
  name: string
  width_mm: number
  height_mm: number
  barcode_fmt: 'CODE128'|'EAN13'
  properties: PriceTagProperty[]
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const priceTagsService = {
  list: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: Paginated<PriceTagTemplate> }>(`/api/pricetags`, { params }).then(r => r.data.data),

  get: (id: string) => apiClient.get<{ data: PriceTagTemplate }>(`/api/pricetags/${id}`).then(r => r.data.data),

  create: (payload: { name: string; width_mm: number; height_mm: number; barcode_fmt: 'CODE128'|'EAN13'; properties: PriceTagProperty[] }) =>
    apiClient.post<{ data: PriceTagTemplate }>(`/api/pricetags`, payload).then(r => r.data.data),

  update: (id: string, payload: Partial<{ name: string; width_mm: number; height_mm: number; barcode_fmt: 'CODE128'|'EAN13'; properties: PriceTagProperty[] }>) =>
    apiClient.patch<{ data: PriceTagTemplate }>(`/api/pricetags/${id}`, payload).then(r => r.data.data),

  remove: (id: string) => apiClient.delete(`/api/pricetags/${id}`).then(r => r.data),
} 