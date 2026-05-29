import { onMounted, onUnmounted } from 'vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

/**
 * Client-side idle auto-logout. The per-store StoreSettings.session_timeout_minutes
 * (0 = disabled) drives how long a user can be idle before being logged out.
 *
 * This is a UX guard, not a security boundary — the access token remains
 * technically valid until it expires server-side. Mounted once in the
 * authenticated layout.
 */
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']

export function useIdleTimeout() {
  const auth = useAuthStore()
  let timer = null
  let timeoutMs = 0

  function doLogout() {
    // logout() does a full-page redirect to /login?idle=1 itself.
    auth.logout({ idle: true })
  }

  function reset() {
    if (!timeoutMs) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(doLogout, timeoutMs)
  }

  async function init() {
    // Sudo acts cross-store and has no single store setting — skip.
    if (!auth.isAuthenticated || auth.isSuperadmin) return
    try {
      const { data } = await api.get('/api/core/settings/')
      const minutes = Number(data.session_timeout_minutes) || 0
      if (minutes <= 0) return
      timeoutMs = minutes * 60 * 1000
      ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))
      reset()
    } catch { /* settings unavailable — no idle logout */ }
  }

  onMounted(init)
  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset))
  })
}
