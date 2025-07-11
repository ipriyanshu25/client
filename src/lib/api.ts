import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Create axios instance with JSON defaults and credentials
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token from localStorage to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

// GET request (JSON)
export const get = async <T = any>(url: string, params?: any): Promise<T> => {
  const response = await api.get(url, { params })
  return response.data as T
}

// POST request (JSON or FormData)
export const post = async <T = any>(url: string, data?: any): Promise<T> => {
  if (data instanceof FormData) {
    const response = await api.post(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data as T
  }
  const response = await api.post(url, data)
  return response.data as T
}

// GET request expecting Blob (e.g. file download)
export const getBlob = async (url: string, params?: any): Promise<Blob> => {
  const response = await api.get(url, { params, responseType: 'blob' })
  return response.data as Blob
}

// POST request expecting Blob (e.g. file download)
export const postBlob = async (
  url: string,
  data?: any
): Promise<Blob> => {
  const config: any = { responseType: 'blob' }
  // if sending FormData, set header
  if (data instanceof FormData) config.headers = { 'Content-Type': 'multipart/form-data' }
  const response = await api.post(url, data, config)
  return response.data as Blob
}

export default api
