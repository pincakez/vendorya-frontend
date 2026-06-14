<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="rm-backdrop">
        <div class="rm-box" role="dialog" aria-modal="true">

          <div v-if="total > 1" class="rm-step">Item {{ current }} of {{ total }}</div>
          <div class="rm-item-name">{{ itemName }}</div>
          <p class="rm-prompt">Why are you deleting this?</p>

          <div class="rm-options">
            <label
              v-for="r in reasons"
              :key="r.value"
              class="rm-opt"
              :class="{ 'rm-opt--active': selected === r.value }"
            >
              <span class="rm-radio-wrap">
                <span class="rm-radio" :class="{ 'rm-radio--on': selected === r.value }" />
              </span>
              <input type="radio" :value="r.value" v-model="selected" class="rm-radio-input" />
              {{ r.label }}
            </label>
          </div>

          <!-- Checkbox A: apply same reason to all remaining items -->
          <label
            v-if="total > 1 && current < total && selected && selected !== mistakeValue"
            class="rm-check"
          >
            <input type="checkbox" v-model="applyToAll" />
            Apply same reason to all remaining items
          </label>

          <!-- Checkbox B: cancel all — only shown when "I deleted by mistake" is selected -->
          <label v-if="selected === mistakeValue" class="rm-check rm-check--warn">
            <input type="checkbox" v-model="cancelAll" />
            Cancel all deletions
          </label>

          <div class="rm-footer">
            <button class="btn-ghost" @click="emit('cancel')">Cancel</button>
            <button class="btn-danger" :disabled="!selected" @click="handleOK">OK</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open:         { type: Boolean, required: true },
  itemName:     { type: String,  default: '' },
  reasons:      { type: Array,   default: () => [] },   // [{value, label}]
  mistakeValue: { type: String,  default: 'MISTAKE' },
  current:      { type: Number,  default: 1 },
  total:        { type: Number,  default: 1 },
})

const emit = defineEmits(['confirm', 'cancel'])

const selected   = ref('')
const applyToAll = ref(false)
const cancelAll  = ref(false)

// Reset internal state when the modal opens or advances to a new item
watch([() => props.open, () => props.current], () => {
  selected.value   = ''
  applyToAll.value = false
  cancelAll.value  = false
})

// Clear checkboxes when reason changes
watch(selected, () => {
  applyToAll.value = false
  cancelAll.value  = false
})

function handleOK() {
  if (!selected.value) return
  emit('confirm', selected.value, applyToAll.value, cancelAll.value)
}
</script>

<style scoped>
.rm-backdrop {
  position: fixed; inset: 0; z-index: 1200;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
}
.rm-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 28px 22px;
  width: 420px; max-width: calc(100vw - 32px);
  box-shadow: 0 20px 60px rgba(0,0,0,.22);
}
.rm-step {
  font-size: 11.5px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px;
}
.rm-item-name {
  font-size: 17px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 4px; word-break: break-word;
}
.rm-prompt {
  font-size: 13px; color: var(--text-muted); margin: 0 0 16px;
}
.rm-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }

.rm-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 10px; cursor: pointer;
  border: 1.5px solid var(--border);
  font-size: 13.5px; font-weight: 500; color: var(--text-primary);
  transition: border-color 120ms, background 120ms;
}
.rm-opt:hover { border-color: var(--accent); background: var(--accent-soft); }
.rm-opt--active { border-color: var(--accent); background: var(--accent-soft); }

.rm-radio-input { display: none; }
.rm-radio-wrap  { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.rm-radio {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid var(--border);
  transition: border-color 120ms, background 120ms;
  position: relative;
}
.rm-radio--on {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: inset 0 0 0 3px var(--bg-card);
}

.rm-check {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--text-secondary);
  margin-bottom: 12px; cursor: pointer; line-height: 1.5;
}
.rm-check input[type=checkbox] { margin-top: 2px; flex-shrink: 0; }
.rm-check--warn { color: var(--danger); }

.rm-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border); margin-top: 8px; }
</style>
