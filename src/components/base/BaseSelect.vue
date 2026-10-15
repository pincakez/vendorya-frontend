<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue:  { default: '' },
  options:     { type: Array,   default: () => [] }, // [{ value, label, group? }] — `group` (optional) = an <optgroup> heading
  label:       { type: String,  default: '' },
  placeholder: { type: String,  default: '' },
  error:       { type: String,  default: '' },
  disabled:    { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

// Options that carry a `group` render inside <optgroup>s, in the order the groups first appear (s170 Treasury owner
// level: box pickers grouped by part). No `group` on any option = the plain list, exactly as before.
const grouped = computed(() => {
  if (!props.options.some(o => o.group)) return null
  const out = []
  const byName = {}
  for (const o of props.options) {
    const g = o.group || ''
    if (!byName[g]) { byName[g] = { label: g, options: [] }; out.push(byName[g]) }
    byName[g].options.push(o)
  }
  return out
})
</script>

<template>
  <div class="base-select-root">
    <label v-if="label" class="form-label">{{ label }}</label>
    <div class="select-wrap">
      <select
        :value="modelValue"
        :disabled="disabled"
        :class="['form-input', error ? 'input-error' : '']"
        v-bind="$attrs"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue">{{ placeholder }}</option>
        <template v-if="grouped">
          <optgroup v-for="g in grouped" :key="g.label" :label="g.label">
            <option v-for="opt in g.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </optgroup>
        </template>
        <template v-else>
          <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </template>
      </select>
      <span class="select-chevron" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
    <span v-if="error" class="input-error-msg">{{ error }}</span>
  </div>
</template>
