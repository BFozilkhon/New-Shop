import { apiClient } from './base/apiClient'

export type TenantSettings = {
  language?: string
  timezone?: string
  currency?: string
  date_format?: string
}

export type Tenant = {
  id: string
  company_name: string
  subdomain: string
  settings: TenantSettings
}

export const tenantsService = {
  getCurrent: () =>
    apiClient.get<{ data: Tenant }>(`/api/tenant/current`).then(r => r.data.data),
  updateCurrent: (payload: { settings: TenantSettings }) =>
    apiClient.patch<{ data: Tenant }>(`/api/tenant/current`, payload).then(r => r.data.data),
} 