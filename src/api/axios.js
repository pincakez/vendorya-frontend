import axios from 'axios'

// Dev: fallback to localhost:8000 (Vite on 5173, Django on 8000).
// Prod: empty string = same-origin relative URLs (Django serves both).
const BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')

// Set true the moment an intentional logout starts. While true the response
// interceptor must NOT try to refresh a dead token or re-populate localStorage —
// otherwise an in-flight 401 races the logout and causes the /login ↔ /dashboard
// flicker. Reset on a full page load (this module re-initialises).
let isLoggingOut = false
export function beginLogout() { isLoggingOut = true }

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  // Send/receive the httpOnly refresh cookie (phased migration).
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vendorya_access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Super-admin scoping: send the selected store on every request when in store mode.
  // Server ignores this header for non-super-admin users.
  const storeId = localStorage.getItem('vendorya_active_store')
  if (storeId) config.headers['X-Store-ID'] = storeId
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    // Don't fight an in-progress logout — let the request die quietly.
    if (error.response?.status === 401 && isLoggingOut) {
      return Promise.reject(error)
    }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('vendorya_refresh')
        // Body refresh for the localStorage path; cookie is sent automatically
        // via withCredentials so this also works once access is memory-only.
        const res = await axios.post(
          `${BASE}/api/auth/token/refresh/`,
          { refresh },
          { withCredentials: true },
        )
        localStorage.setItem('vendorya_access', res.data.access)
        // ROTATE + BLACKLIST_AFTER_ROTATION: the old refresh is now dead, so we
        // MUST persist the rotated one returned in the body.
        if (res.data.refresh) localStorage.setItem('vendorya_refresh', res.data.refresh)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        // Guard against a reload loop if a request on the login page itself 401s.
        if (window.location.pathname !== '/login') window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
