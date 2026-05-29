<template>
  <button
    ref="btn"
    type="button"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointerleave="onUp"
    :style="tiltStyle"
    :class="['pb', `pb-${variant}`, { 'pb-active': active, 'pb-collapsed': collapsed }]"
  >
    <span class="pb-inner" :class="collapsed ? 'pb-center' : 'pb-between'">
      <span class="pb-lead" :class="{ 'pb-center': collapsed }">
        <slot name="icon" />
        <span v-if="!collapsed" class="pb-label"><slot /></span>
      </span>
      <span v-if="badge && !collapsed" class="pb-badge">{{ badge }}</span>
    </span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  variant:   { type: String,  default: 'primary' },   // primary | sidebar | icon
  active:    { type: Boolean, default: false },
  badge:     { type: [String, Number], default: null },
  collapsed: { type: Boolean, default: false },
})

const btn = ref(null)
const pressed = ref(false)
const tilt = ref({ x: 0, y: 0 })
const MAX = 14

function angleFrom(e) {
  const r = btn.value.getBoundingClientRect()
  const rx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
  const ry = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
  tilt.value = { x: ry * MAX, y: -rx * MAX }
}
function onDown(e) {
  if (!btn.value) return
  pressed.value = true
  angleFrom(e)
  try { btn.value.setPointerCapture(e.pointerId) } catch { /* noop */ }
}
function onMove(e) { if (pressed.value && btn.value) angleFrom(e) }
function onUp() { pressed.value = false; tilt.value = { x: 0, y: 0 } }

const tiltStyle = computed(() =>
  pressed.value
    ? { transform: `perspective(420px) rotateX(${tilt.value.x}deg) rotateY(${tilt.value.y}deg) scale(0.93)`, transition: 'transform 0.05s ease-out' }
    : { transform: 'perspective(420px) rotateX(0) rotateY(0) scale(1)', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)' }
)
</script>

<style scoped>
.pb {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 100%; border: none; cursor: pointer; outline: none; user-select: none;
  font-family: inherit; background: none;
}
.pb-inner { pointer-events: none; width: 100%; display: flex; align-items: center; }
.pb-between { justify-content: space-between; }
.pb-center  { justify-content: center; }
.pb-lead { display: flex; align-items: center; gap: 12px; min-width: 0; }
.pb-lead.pb-center { gap: 0; }
.pb-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pb-badge {
  margin-left: auto; height: 20px; min-width: 20px; padding: 0 6px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; background: var(--accent); color: #fff;
  font-size: 11px; font-weight: 700;
}

/* primary — the POS / hero button */
.pb-primary {
  background: var(--accent); color: #1a1208;
  border-radius: 12px; padding: 12px 16px; font-size: 14px; font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  transition: background 140ms;
}
.pb-primary:hover { background: var(--accent-hover); }

/* sidebar — nav rows inside group cards */
.pb-sidebar {
  color: var(--sb-text); border-radius: 10px; padding: 9px 12px;
  font-size: 13.5px; font-weight: 500; transition: background 120ms, color 120ms;
}
.pb-sidebar:hover { background: var(--sb-hover); color: var(--sb-text-active); }
.pb-sidebar.pb-active {
  background: var(--sb-item-active-bg); color: var(--sb-item-active-text);
  font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

/* icon — square utility button */
.pb-icon {
  background: var(--sb-hover); color: var(--sb-text);
  border-radius: 10px; padding: 10px; transition: background 120ms, color 120ms;
}
.pb-icon:hover { background: var(--sb-active); color: var(--sb-text-active); }
.pb-icon.pb-collapsed, .pb-sidebar.pb-collapsed { padding-left: 0; padding-right: 0; }
</style>
