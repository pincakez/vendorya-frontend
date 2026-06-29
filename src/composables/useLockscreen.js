import { ref, computed } from 'vue'
import api from '@/api/axios'

// Module-level singletons — one timer, one state, shared across all callers
const isLocked   = ref(false)
const settings   = ref({ lock_timeout_minutes: 0, lock_logo_url: null, lock_facts_bank: [], lock_pin_set: false })
const initialized = ref(false)
let _timer = null
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']

function _resetTimer() {
  clearTimeout(_timer)
  const mins = settings.value.lock_timeout_minutes
  if (!mins || isLocked.value) return
  _timer = setTimeout(() => { isLocked.value = true }, mins * 60 * 1000)
}

function _onActivity() {
  if (!isLocked.value) _resetTimer()
}

export function useLockscreen() {
  async function init(storeId) {
    if (initialized.value) return
    try {
      const res = await api.get('/api/core/settings/')
      settings.value = {
        lock_timeout_minutes: res.data.lock_timeout_minutes ?? 0,
        lock_logo_url:        res.data.lock_logo_url ?? null,
        lock_facts_bank:      res.data.lock_facts_bank ?? [],
        lock_pin_set:         res.data.lock_pin_set ?? false,
      }
    } catch { /* non-blocking */ }
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, _onActivity, { passive: true }))
    _resetTimer()
    initialized.value = true
  }

  function refreshSettings(patch) {
    Object.assign(settings.value, patch)
    _resetTimer()
  }

  function lock() {
    clearTimeout(_timer)
    isLocked.value = true
  }

  function unlock() {
    isLocked.value = false
    _resetTimer()
  }

  function destroy() {
    clearTimeout(_timer)
    ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, _onActivity))
    initialized.value = false
    isLocked.value    = false
  }

  // Pick a fact not seen today
  function pickFact(storeId) {
    const bank = settings.value.lock_facts_bank
    if (!bank.length) return null
    const today = new Date().toISOString().slice(0, 10)
    const key   = `ls_seen_${storeId}_${today}`
    let seen    = JSON.parse(localStorage.getItem(key) || '[]')
    const unseen = bank.map((_, i) => i).filter(i => !seen.includes(i))
    const pool  = unseen.length ? unseen : bank.map((_, i) => i)
    const idx   = pool[Math.floor(Math.random() * pool.length)]
    seen = [...new Set([...seen, idx])].slice(-bank.length)
    localStorage.setItem(key, JSON.stringify(seen))
    return bank[idx] || null
  }

  return { isLocked, settings, initialized, init, refreshSettings, lock, unlock, destroy, pickFact }
}
