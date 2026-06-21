<script setup>
defineProps({
  modelValue:  { default: '' },
  type:        { type: String,  default: 'text' },
  label:       { type: String,  default: '' },
  placeholder: { type: String,  default: '' },
  error:       { type: String,  default: '' },
  prefix:      { type: String,  default: '' },
  suffix:      { type: String,  default: '' },
  disabled:    { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="base-input-root">
    <label v-if="label" class="form-label">{{ label }}</label>
    <div class="input-wrap">
      <span v-if="prefix" class="input-affix input-prefix">{{ prefix }}</span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="['form-input', error ? 'input-error' : '', prefix ? 'has-prefix' : '', suffix ? 'has-suffix' : '']"
        v-bind="$attrs"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <span v-if="suffix" class="input-affix input-suffix">{{ suffix }}</span>
    </div>
    <span v-if="error" class="input-error-msg">{{ error }}</span>
  </div>
</template>
