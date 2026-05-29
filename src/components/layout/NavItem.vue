<template>
  <RouterLink
    :to="to"
    class="nav-item"
    :class="{ active: isActive }"
    :title="collapsed ? label : undefined"
  >
    <span class="nav-item-icon">
      <component :is="iconComponent" :size="17" />
    </span>
    <span v-if="!collapsed" class="nav-item-text">{{ label }}</span>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard, Package, CreditCard, Users, Settings, Monitor,
  Store, Building, Shield, Activity, Inbox, Receipt, Wrench, Bot, KeyRound
} from 'lucide-vue-next'

const props = defineProps({
  icon: String,
  label: String,
  to: String,
  collapsed: Boolean,
})

const route = useRoute()
const isActive = computed(() => route.path === props.to || route.path.startsWith(props.to + '/'))

const iconMap = {
  'layout-dashboard': LayoutDashboard,
  'package': Package,
  'credit-card': CreditCard,
  'users': Users,
  'settings': Settings,
  'monitor': Monitor,
  'store': Store,
  'building': Building,
  'shield': Shield,
  'activity': Activity,
  'inbox': Inbox,
  'receipt': Receipt,
  'wrench': Wrench,
  'bot': Bot,
  'key': KeyRound,
}

const iconComponent = computed(() => iconMap[props.icon] || Settings)
</script>
