<template>
  <Teleport to="body">
    <Transition :name="anim === 'drop' ? 'modaldrop' : 'modal'">
      <div v-if="open" class="modal-backdrop" @click.self="!noBackdropClose && $emit('close')">
        <div class="modal-box" :class="{ 'is-drop': anim === 'drop' }" :style="{ maxWidth: width }">
          <div class="modal-header">
            <span class="modal-title">{{ title }}</span>
            <button v-if="!hideClose" class="modal-close" :class="{ 'modal-close--lg': largeClose }" @click="$emit('close')">
              <X :size="largeClose ? 20 : 16" />
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X } from 'lucide-vue-next'
import { onMounted, onUnmounted } from 'vue'
const props = defineProps({
  open: Boolean,
  title: String,
  width: { type: String, default: '480px' },
  noBackdropClose: { type: Boolean, default: false },
  hideClose: { type: Boolean, default: false },
  largeClose: { type: Boolean, default: false },   // bigger X (POS modals)
  anim: { type: String, default: '' },             // '' = default | 'drop' = heavy-drop
})
const emit = defineEmits(['close'])

// ESC closes the modal — unless it's explicitly non-dismissible (e.g. BranchPicker).
function onKey(e) {
  if (e.key === 'Escape' && props.open && !props.noBackdropClose && !props.hideClose) {
    e.stopPropagation()
    emit('close')
  }
}
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
