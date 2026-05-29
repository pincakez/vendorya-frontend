import { ref, computed } from 'vue'
import api from '@/api/axios'
import { playSound } from '@/utils/sound'

const items       = ref([])
const prefs       = ref(null)
const lastSeenIds = new Set()

export function useNotifications() {
  const unreadCount = computed(() => items.value.filter(n => n.is_unread).length)
  const recent      = computed(() => items.value.filter(n => n.is_unread).slice(0, 5))

  async function fetchPrefs() {
    try {
      const res = await api.get('/api/notifications/preferences/')
      prefs.value = res.data
    } catch {}
  }

  async function fetchRecent() {
    try {
      const res = await api.get('/api/notifications/recent/')
      const incoming = Array.isArray(res.data) ? res.data : []

      // Detect brand-new unread notifications and play sound
      for (const n of incoming) {
        if (!lastSeenIds.has(n.id) && n.is_unread) {
          _playForPriority(n.priority)
        }
        lastSeenIds.add(n.id)
      }

      items.value = incoming
    } catch {}
  }

  async function fetchAll(priority = null) {
    try {
      const params = priority ? { priority } : {}
      const res = await api.get('/api/notifications/', { params })
      return Array.isArray(res.data) ? res.data : (res.data.results || [])
    } catch {
      return []
    }
  }

  async function markRead(id) {
    try {
      await api.post(`/api/notifications/${id}/read/`)
      const n = items.value.find(x => x.id === id)
      if (n) n.is_unread = false
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.post('/api/notifications/read-all/')
      items.value.forEach(n => { n.is_unread = false })
    } catch {}
  }

  function _playForPriority(priority) {
    if (!prefs.value) return
    const map = {
      INFO:    { enabled: prefs.value.info_enabled,    sound: prefs.value.info_sound },
      WARNING: { enabled: prefs.value.warning_enabled, sound: prefs.value.warning_sound },
      ALERT:   { enabled: prefs.value.alert_enabled,   sound: prefs.value.alert_sound },
      ADMIN:   { enabled: true,                        sound: prefs.value.admin_sound },
    }
    const cfg = map[priority]
    if (cfg?.enabled) playSound(cfg.sound)
  }

  return {
    items, prefs, unreadCount, recent,
    fetchPrefs, fetchRecent, fetchAll,
    markRead, markAllRead,
  }
}
