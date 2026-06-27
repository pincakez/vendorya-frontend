<template>
  <Teleport to="body">
    <Transition :name="anim === 'drop' ? 'modaldrop' : 'modal'">
      <div v-if="open" class="modal-backdrop">
        <div class="modal-box" :class="{ 'is-drop': anim === 'drop' }" :style="{ maxWidth: width }">
          <div class="modal-header">
            <span class="modal-title">{{ title }}</span>
            <button v-if="!hideClose" class="modal-close" :class="{ 'modal-close--lg': largeClose }" @click="attemptClose">
              <X :size="largeClose ? 20 : 16" />
            </button>
          </div>
          <div class="modal-body" @input.capture="markDirty" @change.capture="markDirty">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>

          <!-- Dirty-close warning overlay (rendered inside modal-box so it inherits width/rounding) -->
          <Transition name="warn">
            <div v-if="showWarning" class="modal-warn-overlay" @keydown="onWarningKey">
              <div class="modal-warn-card">
                <AlertTriangle class="modal-warn-icon" :size="28" />
                <p class="modal-warn-title">Unsaved changes</p>
                <p class="modal-warn-msg">You have unsaved changes. Closing will discard them.</p>
                <div class="modal-warn-actions">
                  <button ref="cancelBtnRef" class="warn-btn warn-btn--primary" @click="dismissWarning">Cancel</button>
                  <button class="warn-btn warn-btn--ghost" @click="confirmClose">Discard &amp; close</button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X, AlertTriangle } from 'lucide-vue-next'
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  open: Boolean,
  title: String,
  width: { type: String, default: '480px' },
  noBackdropClose: { type: Boolean, default: true },   // now defaults true — backdrop never closes
  hideClose: { type: Boolean, default: false },
  largeClose: { type: Boolean, default: false },
  anim: { type: String, default: '' },
  isDirty: { type: Boolean, default: false },          // optional parent override for dirty state
})
const emit = defineEmits(['close'])

const showWarning = ref(false)
const internalDirty = ref(false)
const cancelBtnRef = ref(null)

function markDirty() { internalDirty.value = true }

function attemptClose() {
  if (props.hideClose) return
  if (props.isDirty || internalDirty.value) {
    showWarning.value = true
    nextTick(() => cancelBtnRef.value?.focus())
  } else {
    emit('close')
  }
}

function dismissWarning() { showWarning.value = false }

function confirmClose() {
  showWarning.value = false
  internalDirty.value = false
  emit('close')
}

// Arrow keys navigate between warning buttons; ESC dismisses warning or attempts close
function onWarningKey(e) {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const btns = [...e.currentTarget.querySelectorAll('.warn-btn')]
    const idx = btns.indexOf(document.activeElement)
    if (idx !== -1) btns[(idx + 1) % btns.length]?.focus()
    e.preventDefault()
  }
}

function onKey(e) {
  if (e.key === 'Escape' && props.open && !props.hideClose) {
    e.stopPropagation()
    if (showWarning.value) dismissWarning()
    else attemptClose()
  }
}

// Reset internal state when modal is closed from the outside (e.g. form submitted)
watch(() => props.open, (val) => {
  if (!val) { internalDirty.value = false; showWarning.value = false }
})

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}

.modal-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  width: 100%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  overflow: hidden;
  position: relative;
  /* Keep header + footer (action buttons) always on-screen; scroll the body
     instead of letting a tall form push the footer off small laptops. */
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 100ms, color 100ms;
}

.modal-close:hover { background: var(--border); color: var(--text-primary); }

/* Bigger close button for POS modals (mouse-friendly). */
.modal-close--lg { width: 36px; height: 36px; border-radius: 9px; }

.modal-body  { padding: 20px; overflow-y: auto; flex: 1 1 auto; }
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Dirty-close warning overlay ─────────────────────────────────── */
.modal-warn-overlay {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.modal-warn-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px 32px 24px;
  max-width: 340px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}

.modal-warn-icon { color: #f59e0b; flex-shrink: 0; }

.modal-warn-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-warn-msg {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.modal-warn-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.warn-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 120ms, box-shadow 120ms;
  outline: none;
}

/* Cancel — filled accent, auto-focused default */
.warn-btn--primary {
  background: var(--accent);
  color: #fff;
}
.warn-btn--primary:hover  { filter: brightness(1.08); }
.warn-btn--primary:focus  { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent); }

/* Discard & close — ghost danger */
.warn-btn--ghost {
  background: transparent;
  color: var(--danger, #ef4444);
  border: 1px solid var(--danger, #ef4444);
}
.warn-btn--ghost:hover  { background: color-mix(in srgb, var(--danger, #ef4444) 10%, transparent); }
.warn-btn--ghost:focus  { box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger, #ef4444) 25%, transparent); }

/* Warning overlay transition */
.warn-enter-active { transition: opacity 120ms, transform 120ms cubic-bezier(0.34,1.56,0.64,1); }
.warn-leave-active { transition: opacity 100ms ease; }
.warn-enter-from   { opacity: 0; transform: scale(0.92); }
.warn-leave-to     { opacity: 0; }

/* Transitions */
.modal-enter-active { transition: opacity 150ms, transform 150ms cubic-bezier(0.34,1.56,0.64,1); }
.modal-leave-active { transition: opacity 120ms, transform 100ms ease; }
.modal-enter-from   { opacity: 0; transform: scale(0.95) translateY(8px); }
.modal-leave-to     { opacity: 0; transform: scale(0.97) translateY(4px); }

/* Heavy-drop (anim="drop"): the backdrop just fades; the BOX starts at 2× and
   drops to its real size. Opacity 0→1 over 0.5s, scale 2→1 over 1s, both from
   t=0, with a heavy ease-out "landing". */
.modaldrop-enter-active { transition: opacity 0.3s ease; }
.modaldrop-leave-active { transition: opacity 0.2s ease; }
.modaldrop-enter-from,
.modaldrop-leave-to     { opacity: 0; }
.modal-box.is-drop      { animation: heavydrop 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes heavydrop {
  0%   { opacity: 0; transform: scale(2); }
  50%  { opacity: 1; }
  100% { opacity: 1; transform: scale(1); }
}
</style>
