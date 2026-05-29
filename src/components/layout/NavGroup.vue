<template>
  <div>
    <!-- Group header (acts like a nav-item) -->
    <div
      class="nav-item"
      :class="{ active: active && !open }"
      :title="collapsed ? label : undefined"
      @click="$emit('toggle')"
    >
      <span class="nav-item-icon">
        <component :is="iconComponent" :size="17" />
      </span>
      <span v-if="!collapsed" class="nav-item-text">{{ label }}</span>
      <ChevronRight
        v-if="!collapsed"
        :size="14"
        class="nav-chevron"
        :class="{ open }"
      />
    </div>

    <!-- Sub-items — slide in/out -->
    <Transition name="submenu">
      <div v-if="open && !collapsed" class="nav-submenu">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Package, CreditCard, Users, ChevronRight, BarChart3
} from 'lucide-vue-next'

const props = defineProps({
  icon: String,
  label: String,
  collapsed: Boolean,
  open: Boolean,
  active: Boolean,
})

defineEmits(['toggle'])

const iconMap = {
  'package': Package,
  'credit-card': CreditCard,
  'users': Users,
  'bar-chart-3': BarChart3,
}

const iconComponent = computed(() => iconMap[props.icon] || Package)
</script>

<style scoped>
.submenu-enter-active,
.submenu-leave-active {
  transition: max-height 200ms ease, opacity 150ms ease;
  max-height: 400px;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
