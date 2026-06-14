<template>
  <div class="numpad">
    <div class="np-head">
      <span class="np-title">{{ t('pos.numpad.title') }}</span>
      <span class="np-lock" :class="{ on: numLockOn }">
        <component :is="numLockOn ? Lock : LockOpen" :size="11" />
        {{ t('pos.numpad.num_lock') }}
      </span>
    </div>
    <div class="np-grid">
      <button
        v-for="k in keys" :key="k.id"
        type="button"
        class="np-key"
        :class="{ 'np-flash': flashKey === k.id }"
        @mousedown.prevent="press(k.id)"
        @touchstart.prevent="press(k.id)"
      >
        <component :is="k.icon" v-if="k.icon" :size="15" />
        <span v-else>{{ k.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock, LockOpen, Delete } from 'lucide-vue-next'

const { t } = useI18n()

// 3×4 numeric pad, no NumLock key. Purely a tactile feedback widget:
// pressing it (mouse/touch) or the matching physical key flashes it white.
const keys = [
  { id: '7', label: '7' }, { id: '8', label: '8' }, { id: '9', label: '9' },
  { id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' },
  { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' },
  { id: '0', label: '0' }, { id: '.', label: '.' }, { id: 'back', icon: Delete },
]

const numLockOn = ref(true)
const flashKey  = ref(null)
let flashTimer = null

function flash(id) {
  // null → next frame → id restarts the CSS animation even on a repeated key.
  flashKey.value = null
  requestAnimationFrame(() => {
    flashKey.value = id
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { flashKey.value = null }, 220)
  })
}
function press(id) { flash(id) }

function onKey(e) {
  if (typeof e.getModifierState === 'function') {
    numLockOn.value = e.getModifierState('NumLock')
  }
  let id = null
  if (e.key >= '0' && e.key <= '9') id = e.key
  else if (e.key === '.')           id = '.'
  else if (e.key === 'Backspace')   id = 'back'
  if (id) flash(id)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(flashTimer)
})
</script>

<style scoped>
.numpad {
  background: var(--bg-app); border: 1px solid var(--border);
  border-radius: 14px; padding: 8px;
}
.np-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 7px; }
.np-title { font-size: 9.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); }
.np-lock {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-muted); opacity: 0.55;
  transition: color 160ms var(--ease-out), opacity 160ms var(--ease-out);
}
.np-lock.on { color: var(--accent); opacity: 1; }

.np-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.np-key {
  position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  height: 34px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--bg-card);
  font-size: 15px; font-weight: 800; color: var(--text-secondary);
  cursor: pointer; user-select: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out),
              box-shadow 120ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.np-key:hover { border-color: var(--accent); color: var(--accent); }
.np-key:active { transform: scale(0.92); box-shadow: none; transition-duration: var(--press-down); }

/* White flash feedback — fires on press (mouse/touch) or matching physical key */
.np-flash::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: #fff; pointer-events: none;
  animation: np-flash 220ms var(--ease-out);
}
@keyframes np-flash {
  from { opacity: 0.92; }
  to   { opacity: 0; }
}
</style>
