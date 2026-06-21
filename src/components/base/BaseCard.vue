<script setup>
defineProps({
  padding: { type: String, default: 'md' }, // sm · md · lg
  shadow:  { type: String, default: 'default' }, // default · none · strong
})
</script>

<template>
  <div :class="['base-card', `base-card--pad-${padding}`, `base-card--shadow-${shadow}`]">
    <slot />
  </div>
</template>
