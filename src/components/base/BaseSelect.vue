<script setup>
defineProps({
  modelValue:  { default: '' },
  options:     { type: Array,   default: () => [] }, // [{ value, label }]
  label:       { type: String,  default: '' },
  placeholder: { type: String,  default: '' },
  error:       { type: String,  default: '' },
  disabled:    { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
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
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
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
