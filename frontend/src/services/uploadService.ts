import { apiClient } from './base/apiClient'

const API_BASE = (import.meta.env.VITE_API_BASE || '').trim()

const toAbsoluteUrl = (u: string) => {
  if (!u) return u
  if (/^https?:\/\//i.test(u)) return u
  // If API base is site-root or empty, keep the path as-is (e.g., '/uploads/...')
  if (API_BASE === '' || API_BASE === '/') return u
  const base = API_BASE.replace(/\/+$/, '')
  const path = u.startsWith('/') ? u : `/${u}`
  return `${base}${path}`
}

export const uploadService = {
  uploadImages: async (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })

    const response = await apiClient.post<{ data: { urls: string[] } }>('/api/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    // returned urls are relative (e.g. /uploads/...), convert to absolute only when needed
    const urls = response.data.data.urls.map(toAbsoluteUrl)

    return urls
  }
} 