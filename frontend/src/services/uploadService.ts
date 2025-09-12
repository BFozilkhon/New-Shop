import { apiClient } from './base/apiClient'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081'

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

    // returned urls are relative (e.g. /uploads/...), convert to absolute
    const urls = response.data.data.urls.map(u => {
      if (u.startsWith('http')) return u
      return `${API_BASE}${u}`
    })

    return urls
  }
} 