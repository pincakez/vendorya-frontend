// s174 (Yakot): "My private accounts" (the owner level) behind the owner's authenticator.
// The SERVER keeps the lock (treasury/owner_lock.py → 403 owner_locked); this is only the screen side: the status, the
// blurred code prompt (OwnerLockScreen.vue), the countdown that closes the tree again, and "lock now" from the tree's lock icon.
import { ref, computed } from 'vue'
import api from '@/api/axios'

// Module-level singletons — one state for the sidebar, the router guard and the prompt.
const status   = ref(null)          // { enabled, open, seconds_left, minutes, enrolled } — null = not asked yet
const prompt   = ref(false)         // the code prompt is showing
const pending  = ref(null)          // where to go after the right code (a route path)
let   _timer   = null
const _listeners = new Set()        // called when the tree locks again (sidebar collapses, page leaves)

function _arm() {
  clearTimeout(_timer)
  const s = status.value
  if (!s?.enabled || !s.open || !s.seconds_left) return
  _timer = setTimeout(() => { _lockedNow() }, s.seconds_left * 1000)
}

function _lockedNow() {
  clearTimeout(_timer)
  if (status.value) status.value = { ...status.value, open: false, seconds_left: 0 }
  _listeners.forEach(fn => { try { fn() } catch { /* a listener never blocks the lock */ } })
}

export function useOwnerLock() {
  const enabled = computed(() => !!status.value?.enabled)
  const isOpen  = computed(() => !status.value?.enabled || !!status.value?.open)

  async function refresh() {
    try {
      const { data } = await api.get('/api/treasury/owner/lock/')
      status.value = data
      _arm()
    } catch {
      status.value = null   // not the owner / owner level off — the tree isn't shown anyway
    }
    return status.value
  }

  async function ensure() { return status.value ?? refresh() }

  function ask(path = null) { pending.value = path; prompt.value = true }
  function cancel() { prompt.value = false; pending.value = null }

  /** → 'ok' | 'wrong' | 'paused' */
  async function openWithCode(code) {
    try {
      const { data } = await api.post('/api/treasury/owner/lock/open/', { code })
      status.value = data
      _arm()
      prompt.value = false
      return 'ok'
    } catch (e) {
      return e.response?.status === 429 ? 'paused' : 'wrong'
    }
  }

  async function lockNow() {
    try { await api.post('/api/treasury/owner/lock/close/') } catch { /* the countdown still ends it */ }
    _lockedNow()
  }

  function onLocked(fn) { _listeners.add(fn); return () => _listeners.delete(fn) }

  return { status, prompt, pending, enabled, isOpen, refresh, ensure, ask, cancel, openWithCode, lockNow, onLocked }
}
