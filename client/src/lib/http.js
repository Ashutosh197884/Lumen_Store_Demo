// Axios instance for the Laravel API (live mode).
// Requests go to /api/* — in dev, Vite proxies them to the Laravel server
// (see vite.config.js). In production, serve the built client from
// Laravel's public/ or point BASE_URL at the API domain.

import axios from 'axios'
import { API } from './settings'

export const http = axios.create({
  baseURL: API.BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

// Laravel Sanctum bearer token (set after login, cleared on logout)
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('lumen.token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      (err.code === 'ERR_NETWORK'
        ? 'API unreachable — start Laravel (`php artisan serve`) or flip USE_MOCK back on.'
        : 'Something went wrong. Please try again.')
    const e = new Error(msg)
    e.code = err.response?.data?.code || 'api_error'
    throw e
  }
)

// Laravel resource controllers wrap collections in { data: [...] }.
export const unwrap = (res) => (res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data)
