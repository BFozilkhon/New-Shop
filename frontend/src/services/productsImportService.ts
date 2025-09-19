import { apiClient } from './base/apiClient'

export type ImportHistoryItem = {
  product_id?: string
  product_name?: string
  product_sku?: string
  barcode?: string
  qty?: number
  unit?: string
}

export type ImportHistory = {
  id: string
  external_id?: number
  file_name: string
  store_id?: string
  store_name?: string
  total_rows: number
  success_rows: number
  error_rows: number
  status: string
  import_type?: string
  items?: ImportHistoryItem[]
  created_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const productsImportService = {
  list: (params: { page?: number; limit?: number; store_id?: string }) =>
    apiClient.get<{ data: Paginated<ImportHistory> }>(`/api/import-history/products`, { params }).then(r => r.data.data),
  get: (id: string) =>
    apiClient.get<{ data: ImportHistory }>(`/api/import-history/products/${id}`).then(r => r.data.data),
  create: (payload: { file_name: string; store_id?: string; store_name?: string; total_rows: number; success_rows: number; error_rows: number; status?: string; import_type?: string; items?: ImportHistoryItem[] }) =>
    apiClient.post<{ data: ImportHistory }>(`/api/import-history/products`, payload).then(r => r.data.data),
} 