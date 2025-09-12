import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const tenant = localStorage.getItem('tenant_subdomain') || localStorage.getItem('tenant_id')
  const storeId = localStorage.getItem('pref_store_id')
  config.headers = config.headers || {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (tenant) {
    config.headers['X-Tenant-ID'] = tenant
  }
  if (storeId) {
    config.headers['X-Store-ID'] = storeId
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)
