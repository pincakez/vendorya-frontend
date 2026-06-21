<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  variant:  { type: String,  default: 'primary' },  // primary · ghost · danger · secondary · admin · refresh
  size:     { type: String,  default: 'md' },        // md · sm
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type:     { type: String,  default: 'button' },
})
</script>

<template>
  <button
    :type="type"
    :class="['btn-' + variant, size === 'sm' ? 'btn-sm' : null]"
    :disabled="disabled || loading"
  >
    <Loader2 v-if="loading" :size="variant === 'refresh' ? 15 : 14" class="btn-spin" />
    <slot v-else />
  </button>
</template>
