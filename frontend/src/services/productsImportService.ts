import { apiClient } from './base/apiClient'

export type ImportHistory = {
  id: string
  file_name: string
  store_id?: string
  store_name?: string
  total_rows: number
  success_rows: number
  error_rows: number
  status: string
  created_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const productsImportService = {
  list: (params: { page?: number; limit?: number; store_id?: string }) =>
    apiClient.get<{ data: Paginated<ImportHistory> }>(`/api/import-history/products`, { params }).then(r => r.data.data),
  create: (payload: { file_name: string; store_id?: string; store_name?: string; total_rows: number; success_rows: number; error_rows: number; status?: string }) =>
    apiClient.post<{ data: ImportHistory }>(`/api/import-history/products`, payload).then(r => r.data.data),
} 