<template>
  <RouterLink :to="to" class="nav-subitem" :class="{ active: isActive }">
    {{ label }}
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({ label: String, to: String })
const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
