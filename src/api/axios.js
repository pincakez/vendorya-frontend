import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('vendorya_refresh')
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/token/refresh/`,
          { refresh }
        )
        localStorage.setItem('vendorya_access', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
