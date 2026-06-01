<template>
  <aside class="nsb" :class="{ 'nsb-collapsed': collapsed }">
    <div>
      <!-- Logo + collapse -->
      <div class="nsb-logo-row" :class="{ 'nsb-col': collapsed }">
        <div class="nsb-logo">
          <img v-if="collapsed" src="/favicon.png" alt="Vendorya" class="nsb-logo-mark" />
          <img v-else :src="vendoryaLogo" alt="Vendorya" class="nsb-logo-full" />
        </div>
        <button class="nsb-collapse" @click="$emit('toggle-collapse')" :title="collapsed ? 'Expand' : 'Collapse'">
          <ChevronLeft :size="18" class="nsb-collapse-icon" :class="{ flip: collapsed }" />
        </button>
      </div>

      <!-- POS -->
      <div class="nsb-pos">
        <PhysicalButton variant="primary" :collapsed="collapsed" @click="go('/pos')">
          <template #icon><Calculator :size="18" /></template>
          POS SYSTEM
        </PhysicalButton>
      </div>

      <!-- Dashboard (standalone) -->
      <div class="nsb-solo">
        <PhysicalButton variant="sidebar" :collapsed="collapsed" :active="itemActive('/dashboard')" @click="go('/dashboard')">
          <template #icon><LayoutDashboard :size="17" :class="itemActive('/dashboard') ? 'ic-active' : 'ic'" /></template>
          Dashboard
        </PhysicalButton>
      </div>

      <!-- Groups -->
      <div class="nsb-groups">
        <div v-for="g in visibleGroups" :key="g.id" class="nsb-group">
          <button class="nsb-group-head" :class="{ 'nsb-col': collapsed }" @click="toggle(g.id)">
            <component :is="g.icon" v-if="collapsed" :size="20" class="grp-icon" />
            <span v-else>{{ g.title }}</span>
            <ChevronDown v-if="!collapsed" :size="14" class="nsb-chevron" :class="{ closed: !open[g.id] }" />
          </button>

          <div class="nsb-group-body" :class="{ open: open[g.id] }">
            <div class="nsb-group-inner">
              <div class="nsb-group-card" :class="{ 'nsb-col': collapsed }">
                <PhysicalButton
                  v-for="it in g.items" :key="it.to"
                  variant="sidebar" :collapsed="collapsed" :active="itemActive(it.to)"
                  :tooltip="it.label"
                  @click="go(it.to)"
                >
                  <template #icon><component :is="it.icon" :size="16" :class="itemActive(it.to) ? 'ic-active' : 'ic'" /></template>
                  {{ it.label }}
                </PhysicalButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom -->
    <div class="nsb-bottom">
      <div class="nsb-actions" :class="{ 'nsb-col': collapsed }">
        <PhysicalButton variant="icon" :collapsed="collapsed" @click="go('/settings')">
          <template #icon><Settings :size="16" /></template>
        </PhysicalButton>
        <PhysicalButton variant="icon" :collapsed="collapsed" @click="auth.logout()">
          <template #icon><LogOut :size="16" class="ic-logout" /></template>
        </PhysicalButton>
      </div>

      <div class="nsb-user" :class="{ 'nsb-col': collapsed }" @click="go('/settings/profile')">
        <div class="nsb-avatar">
          <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" />
          <span v-else>{{ auth.initials }}</span>
        </div>
        <template v-if="!collapsed">
          <div class="nsb-user-info">
            <span class="nsb-user-name">{{ auth.displayName }}</span>
            <span class="nsb-user-role">{{ auth.userRole || 'User' }}</span>
          </div>
          <ChevronRight :size="15" class="nsb-user-chev" />
        </template>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import PhysicalButton from '@/components/ui/PhysicalButton.vue'
import {
  LayoutDashboard, Calculator, Package, ShoppingCart, SlidersHorizontal, Tag, List,
  FileBarChart, Wallet, FileText, CornerDownLeft, Receipt, Clock, LineChart, TrendingUp,
  DollarSign, BookOpen, UserCheck, Percent, Users, Truck, Briefcase, Folder, Activity,
  Inbox, Settings, Store, Shield, Bell, User, Lock, CreditCard,
  ChevronDown, ChevronLeft, ChevronRight, LogOut, ArrowLeftRight,
} from 'lucide-vue-next'

defineProps({ collapsed: Boolean })
defineEmits(['toggle-collapse'])

const route = useRoute()
const router = useRouter()
const auth  = useAuthStore()
const theme = useThemeStore()
const vendoryaLogo = computed(() => theme.dark ? '/logo-text-dark-mode.png' : '/logo-text-light-mode.png')

const groups = [
  { id: 'inventory', title: 'INVENTORY', icon: Package, items: [
    { label: 'Products', to: '/inventory/products', icon: Package },
    { label: 'Purchases', to: '/inventory/purchases', icon: ShoppingCart },
    { label: 'Stock Adjustments', to: '/inventory/adjustments', icon: SlidersHorizontal },
    { label: 'Stock Transfers',   to: '/inventory/transfers',   icon: ArrowLeftRight },
    { label: 'Categories', to: '/inventory/categories', icon: Tag },
    { label: 'Attributes', to: '/inventory/attributes', icon: List },
    { label: 'Reports', to: '/inventory/reports', icon: FileBarChart },
  ] },
  { id: 'finance', title: 'FINANCE', icon: Wallet, items: [
    { label: 'Sales Invoices', to: '/finance/invoices', icon: FileText },
    { label: 'Returns', to: '/finance/returns', icon: CornerDownLeft },
    { label: 'Expenses', to: '/finance/expenses', icon: Receipt },
    { label: 'Shifts', to: '/finance/shifts', icon: Clock },
    { label: 'Cash Drawer', to: '/finance/cash-drawer', icon: Wallet },
  ] },
  { id: 'reports', title: 'REPORTS', icon: LineChart, items: [
    { label: 'Sales', to: '/reports/sales', icon: LineChart },
    { label: 'Profit Margin', to: '/reports/profit', icon: TrendingUp },
    { label: 'A/R Aging', to: '/reports/ar-aging', icon: Clock },
    { label: 'A/P Aging', to: '/reports/ap-aging', icon: Clock },
    { label: 'Profit & Loss', to: '/reports/pnl', icon: DollarSign },
    { label: 'Expenses', to: '/reports/expenses', icon: Receipt },
    { label: 'Stock Ledger', to: '/reports/stock-ledger', icon: BookOpen },
    { label: 'Cashier Perf.', to: '/reports/cashiers', icon: UserCheck },
    { label: 'Tax', to: '/reports/tax', icon: Percent },
  ] },
  { id: 'people', title: 'PEOPLE', icon: Users, items: [
    { label: 'Customers', to: '/people/customers', icon: Users },
    { label: 'Suppliers', to: '/people/suppliers', icon: Truck },
    { label: 'Staff', to: '/people/staff', icon: Briefcase },
  ] },
  { id: 'general', title: 'GENERAL', icon: Folder, items: [
    { label: 'Activity Log', to: '/activity-log', icon: Activity },
    { label: 'Inbox', to: '/inbox', icon: Inbox },
  ] },
  { id: 'settings', title: 'SETTINGS', icon: Settings, items: [
    { label: 'Store Info', to: '/settings', icon: Store },
    { label: 'Policies', to: '/settings/policies', icon: Shield },
    { label: 'Taxes', to: '/settings/taxes', icon: Percent },
    { label: 'Notifications', to: '/settings/notifications', icon: Bell },
    { label: 'Billing', to: '/settings/billing', icon: CreditCard, ownerOnly: true },
    { label: 'Profile', to: '/settings/profile', icon: User },
    { label: 'Security', to: '/settings/security', icon: Lock },
  ] },
]

const canBilling = computed(() => auth.userRole === 'OWNER' || auth.isSuperadmin)
const visibleGroups = computed(() =>
  groups.map(g => ({ ...g, items: g.items.filter(it => !it.ownerOnly || canBilling.value) }))
)

function itemActive(to) {
  if (to === '/settings') return route.path === '/settings'
  return route.path === to || route.path.startsWith(to + '/')
}

const open = reactive({})
groups.forEach(g => { open[g.id] = g.items.some(it => itemActive(it.to)) })

function toggle(id) { open[id] = !open[id] }
function go(to) { if (route.path !== to) router.push(to) }
</script>

<style scoped>
.nsb {
  width: var(--sb-width); min-width: var(--sb-width);
  background: var(--sb-bg); border-right: 1px solid var(--sb-border);
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 20px 14px; overflow-y: auto; overflow-x: hidden;
  transition: width 220ms ease, min-width 220ms ease, padding 220ms ease;
}
.nsb-collapsed { width: var(--sb-collapsed); min-width: var(--sb-collapsed); padding: 20px 8px; }

/* Logo */
.nsb-logo-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 22px; }
.nsb-logo-row.nsb-col { flex-direction: column; gap: 14px; }
.nsb-logo { display: flex; align-items: center; gap: 8px; min-width: 0; }
.nsb-logo-mark { width: 26px; height: 26px; flex-shrink: 0; }
.nsb-logo-full { height: 28px; width: auto; max-width: 140px; object-fit: contain; flex-shrink: 0; }
.nsb-collapse {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px; border: none; cursor: pointer;
  background: none; color: var(--sb-text); transition: background 120ms, color 120ms;
}
.nsb-collapse:hover { background: var(--sb-hover); color: var(--sb-text-active); }
.nsb-collapse-icon { transition: transform 250ms ease; }
.nsb-collapse-icon.flip { transform: rotate(180deg); }

/* POS + solo */
.nsb-pos { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--sb-border); }
.nsb-solo { margin-bottom: 16px; }

/* Groups */
.nsb-groups { display: flex; flex-direction: column; gap: 16px; }
.nsb-group-head {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
  padding: 4px 8px; border: none; background: none; cursor: pointer;
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--sb-text); margin-bottom: 8px; transition: color 120ms; outline: none;
}
.nsb-group-head:hover { color: var(--sb-text-active); }
.nsb-group-head.nsb-col { justify-content: center; padding: 4px 0; margin-bottom: 6px; }
.grp-icon { color: var(--accent); }
.nsb-chevron { transition: transform 250ms ease; opacity: 0.7; }
.nsb-chevron.closed { transform: rotate(-90deg); }

.nsb-group-body { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 250ms ease, opacity 200ms ease; }
.nsb-group-body.open { grid-template-rows: 1fr; opacity: 1; }
.nsb-group-inner { overflow: hidden; }
.nsb-group-card {
  display: flex; flex-direction: column; gap: 3px;
  background: var(--sb-group-bg); border: 1px solid var(--sb-group-border);
  border-radius: 14px; padding: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.nsb-group-card.nsb-col { background: transparent; border-color: transparent; box-shadow: none; padding: 0; gap: 6px; }

/* Icon tint */
.ic { opacity: 0.7; flex-shrink: 0; }
.ic-active { color: var(--accent); flex-shrink: 0; }
.ic-logout { color: #ef4444; }

/* Bottom */
.nsb-bottom { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--sb-border); display: flex; flex-direction: column; gap: 10px; }
.nsb-actions { display: flex; gap: 8px; }
.nsb-actions.nsb-col { flex-direction: column; }
.nsb-user {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 8px 10px; border-radius: 12px; cursor: pointer; transition: background 120ms;
}
.nsb-user:hover { background: var(--sb-hover); }
.nsb-user.nsb-col { justify-content: center; padding: 8px 0; }
.nsb-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  background: var(--accent-soft); color: var(--accent);
  display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;
}
.nsb-avatar img { width: 100%; height: 100%; object-fit: cover; }
.nsb-user-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.nsb-user-name { font-size: 13px; font-weight: 600; color: var(--sb-text-active); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nsb-user-role { font-size: 11px; color: var(--sb-text); text-transform: capitalize; }
.nsb-user-chev { color: var(--sb-text); flex-shrink: 0; }
</style>
