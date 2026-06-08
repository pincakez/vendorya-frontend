import axios from 'axios'
import { getAccessToken, setAccessToken } from './token'

// Dev: fallback to localhost:8000 (Vite on 5173, Django on 8000).
// Prod: empty string = same-origin relative URLs (Django serves both).
const BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')

// Set true the moment an intentional logout starts. While true the response
// interceptor must NOT try to refresh a dead token — otherwise an in-flight 401
// races the logout and causes the /login ↔ /dashboard flicker. Reset on a full
// page load (this module re-initialises).
let isLoggingOut = false
export function beginLogout() { isLoggingOut = true }

// Single in-flight refresh shared by every caller (concurrent 401s AND the boot
// refresh). The refresh cookie ROTATES on use, so firing it twice would spend
// the rotated token and blacklist us — one shared promise prevents that.
let refreshPromise = null
export function refreshAccessToken() {
  if (!refreshPromise) {
    // No body: the refresh token rides in the httpOnly cookie (withCredentials).
    refreshPromise = axios
      .post(`${BASE}/api/auth/token/refresh/`, {}, { withCredentials: true })
      .then(res => {
        setAccessToken(res.data.access)
        return res.data.access
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// Tear down client-side session state and bounce to login. Auth lives in the
// httpOnly cookie now; the only JS-side remnants are UX prefs in localStorage.
function failToLogin() {
  setAccessToken(null)
  localStorage.removeItem('vendorya_user')
  localStorage.removeItem('vendorya_active_store')
  localStorage.removeItem('vendorya_active_store_obj')
  localStorage.removeItem('vendorya_preview_mode')
  if (window.location.pathname !== '/login') window.location.href = '/login'
}

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  // Send/receive the httpOnly refresh cookie.
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Super-admin scoping: send the selected store on every request when in store mode.
  // Server ignores this header for non-super-admin users.
  const storeId = localStorage.getItem('vendorya_active_store')
  if (storeId) config.headers['X-Store-ID'] = storeId
  return config
})

api.interceptors.response.use(
  response => {
    // Emit sync event on successful writes
    if (['POST', 'PATCH', 'PUT'].includes(response.config.method.toUpperCase())) {
      window.dispatchEvent(new CustomEvent('api:synced'))
    }
    return response
  },
  async error => {
    const original = error.config
    // Don't fight an in-progress logout — let the request die quietly.
    if (error.response?.status === 401 && isLoggingOut) {
      return Promise.reject(error)
    }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const access = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      } catch {
        failToLogin()
      }
    }
    return Promise.reject(error)
  }
)

export default api
