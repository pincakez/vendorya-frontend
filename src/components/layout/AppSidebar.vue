<template>
  <aside class="nsb" :class="{ 'nsb-collapsed': collapsed }">
    <div>
      <!-- Logo + collapse -->
      <div class="nsb-logo-row" :class="{ 'nsb-col': collapsed }">
        <div class="nsb-logo">
          <img v-if="collapsed" src="/favicon.png" alt="Vendorya" class="nsb-logo-mark" />
          <img v-else :src="logoSrc" alt="Vendorya" class="nsb-logo-full" />
          <span v-if="admin && !collapsed" class="nsb-admin-badge">ADMIN</span>
        </div>
        <button class="nsb-collapse" @click="$emit('toggle-collapse')" :title="collapsed ? 'Expand' : 'Collapse'">
          <ChevronLeft :size="18" class="nsb-collapse-icon" :class="{ flip: collapsed }" />
        </button>
      </div>

      <!-- POS + SRV split (store only) -->
      <div v-if="!admin" class="nsb-pos">
        <div v-if="!collapsed" class="nsb-pos-row">
          <PhysicalButton variant="primary" :collapsed="false" tooltip="POS System" class="nsb-pos-main" @click="go('/pos')">
            <template #icon><Calculator :size="18" /></template>
            POS
          </PhysicalButton>
          <button class="nsb-srv-btn" @click="go('/services')" title="Services (F10)">SRV</button>
        </div>
        <PhysicalButton v-else variant="primary" :collapsed="true" tooltip="POS System" @click="go('/pos')">
          <template #icon><Calculator :size="18" /></template>
        </PhysicalButton>
      </div>

      <!-- Top solo: Dashboard (store / acting) or Overview (general admin) -->
      <div class="nsb-solo">
        <PhysicalButton variant="sidebar" :collapsed="collapsed" :active="itemActive(soloTo)" :tooltip="soloLabel" @click="go(soloTo)">
          <template #icon><LayoutDashboard :size="17" :class="itemActive(soloTo) ? 'ic-active' : 'ic'" /></template>
          {{ soloLabel }}
        </PhysicalButton>
      </div>

      <!-- Acting-as-store banner -->
      <div v-if="acting && !collapsed" class="nsb-acting">
        <span class="nsb-acting-label">ACTING AS</span>
        <span class="nsb-acting-name">{{ auth.activeStore.name }}</span>
      </div>

      <!-- Groups -->
      <div class="nsb-groups">
        <div v-for="g in displayGroups" :key="g.id" class="nsb-group">
          <button class="nsb-group-head" :class="{ 'nsb-col': collapsed }" @click="toggle(g.id)" :data-tip="collapsed ? g.title : null">
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
        <!-- Exit to Admin (sudo acting on a store) -->
        <PhysicalButton v-if="acting" variant="sidebar" :collapsed="collapsed" tooltip="Exit to Admin" @click="exitToAdmin">
          <template #icon><ArrowLeft :size="16" /></template>
          Exit to Admin
        </PhysicalButton>
        <!-- Settings (store users only) -->
        <PhysicalButton v-if="!admin" variant="sidebar" :collapsed="collapsed" tooltip="Store Settings" @click="go('/settings')">
          <template #icon><Settings :size="16" /></template>
          Store Settings
        </PhysicalButton>
        <PhysicalButton variant="sidebar" :collapsed="collapsed" tooltip="Log Out" @click="auth.logout()">
          <template #icon><LogOut :size="16" class="ic-logout" /></template>
          <span class="lbl-logout">Log Out</span>
        </PhysicalButton>
      </div>

      <div class="nsb-user" :class="{ 'nsb-col': collapsed }" @click="go(userCardTo)">
        <div class="nsb-avatar">
          <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" />
          <span v-else>{{ auth.initials }}</span>
        </div>
        <template v-if="!collapsed">
          <div class="nsb-user-info">
            <span class="nsb-user-name">{{ auth.displayName }}</span>
            <span class="nsb-user-role">{{ admin || auth.isSuperadmin ? 'Super Admin' : (auth.userRole || 'User') }}</span>
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
  ChevronDown, ChevronLeft, ChevronRight, LogOut, ArrowLeftRight, ArrowLeft,
  Building2, KeyRound, Trash2, Bot, Wrench, ShieldCheck, Star, Keyboard, ArrowDownUp,
  BarChart2,
} from 'lucide-vue-next'

const props = defineProps({ collapsed: Boolean, admin: Boolean })
defineEmits(['toggle-collapse'])

const route = useRoute()
const router = useRouter()
const auth  = useAuthStore()
const theme = useThemeStore()
// Admin sidebar is always dark → always use the dark-mode wordmark there.
const logoSrc = computed(() =>
  props.admin ? '/logo-text-dark-mode.png'
              : (theme.dark ? '/logo-text-dark-mode.png' : '/logo-text-light-mode.png')
)

/* ── Store nav ─────────────────────────────────────────────────────────────── */
const groups = [
  { id: 'inventory', title: 'INVENTORY', icon: Package, items: [
    { label: 'Products', to: '/inventory/products', icon: Package },
    { label: 'Purchases', to: '/inventory/purchases', icon: ShoppingCart },
    { label: 'Stock Adjustments', to: '/inventory/adjustments', icon: SlidersHorizontal },
    { label: 'Stock Transfers',   to: '/inventory/transfers',   icon: ArrowLeftRight },
    { label: 'Categories', to: '/inventory/categories', icon: Tag },
    { label: 'Attributes', to: '/inventory/attributes', icon: List },
    { label: 'Reports', to: '/inventory/reports', icon: FileBarChart },
    { label: 'Import / Export', to: '/inventory/import-export', icon: ArrowDownUp },
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
  { id: 'services', title: 'SERVICES', icon: Wrench, items: [
    { label: 'Services', to: '/services', icon: Wrench },
  ] },
  { id: 'general', title: 'GENERAL', icon: Folder, items: [
    { label: 'Activity Log', to: '/activity-log', icon: Activity },
    { label: 'Inbox', to: '/inbox', icon: Inbox },
  ] },
  { id: 'settings', title: 'SETTINGS', icon: Settings, items: [
    { label: 'Store Settings', to: '/settings', icon: Store },
    { label: 'Taxes', to: '/settings/taxes', icon: Percent },
    { label: 'Notifications', to: '/settings/notifications', icon: Bell },
    { label: 'Billing', to: '/settings/billing', icon: CreditCard, ownerOnly: true },
    { label: 'POS Favorites', to: '/settings/pos/favorites', icon: Star },
    { label: 'POS Top Selling', to: '/settings/pos/top-selling', icon: TrendingUp },
    { label: 'POS UX', to: '/settings/pos/ux', icon: Keyboard },
    { label: 'Profile', to: '/settings/profile', icon: User },
    { label: 'Security', to: '/settings/security', icon: Lock },
  ] },
]

/* ── Admin nav (general super-admin mode) ──────────────────────────────────── */
const adminGroups = [
  { id: 'platform', title: 'PLATFORM', icon: Store, items: [
    { label: 'Stores', to: '/admin/stores', icon: Store },
    { label: 'Branches', to: '/admin/branches', icon: Building2 },
    { label: 'Admin Users', to: '/admin/users', icon: Shield },
    { label: 'Auth Settings', to: '/admin/auth-settings', icon: KeyRound },
  ] },
  { id: 'abilling', title: 'BILLING', icon: CreditCard, items: [
    { label: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard },
    { label: 'Plans', to: '/admin/plans', icon: Package },
    { label: 'Billing Settings', to: '/admin/billing-settings', icon: SlidersHorizontal },
  ] },
  { id: 'asystem', title: 'SYSTEM', icon: Activity, items: [
    { label: 'Activity Log', to: '/admin/activity-log', icon: Activity },
    { label: 'Tenant Usage', to: '/admin/usage', icon: BarChart2 },
    { label: 'Trash', to: '/admin/trash', icon: Trash2 },
    { label: 'Isolation Check', to: '/admin/isolation-check', icon: ShieldCheck },
  ] },
  { id: 'aai', title: 'AI', icon: Bot, items: [
    { label: 'AI Profiles', to: '/admin/ai-profiles', icon: Bot },
    { label: 'Misc', to: '/admin/misc', icon: Wrench },
  ] },
  { id: 'acomm', title: 'COMMUNICATION', icon: Bell, items: [
    { label: 'Alerts Center', to: '/admin/alerts', icon: Bell },
  ] },
]

const canBilling = computed(() => auth.userRole === 'OWNER' || auth.isSuperadmin)
const visibleGroups = computed(() =>
  groups.map(g => ({ ...g, items: g.items.filter(it => !it.ownerOnly || canBilling.value) }))
)

// Sudo acting on a specific store from inside the admin shell.
const acting = computed(() => props.admin && !!auth.activeStore)

const displayGroups = computed(() =>
  (props.admin && !acting.value) ? adminGroups : visibleGroups.value
)

const soloTo    = computed(() => (props.admin && !acting.value) ? '/admin/dashboard' : '/dashboard')
const soloLabel = computed(() => (props.admin && !acting.value) ? 'Overview' : 'Dashboard')
const userCardTo = computed(() => props.admin ? '/admin/users' : '/settings/profile')

function itemActive(to) {
  if (to === '/settings') return route.path === '/settings'
  if (to === '/admin/dashboard' || to === '/dashboard') return route.path === to
  return route.path === to || route.path.startsWith(to + '/')
}

const open = reactive({})
;[...groups, ...adminGroups].forEach(g => { open[g.id] = g.items.some(it => itemActive(it.to)) })

function toggle(id) { open[id] = !open[id] }
function go(to) { if (route.path !== to) router.push(to) }
function exitToAdmin() { auth.clearActiveStore(); router.push('/admin/dashboard') }
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
.nsb-logo-full { height: 28px; width: auto; max-width: 130px; object-fit: contain; flex-shrink: 0; }
.nsb-admin-badge {
  flex-shrink: 0; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; padding: 2px 6px;
  border-radius: 5px; background: var(--sb-badge-bg); color: var(--sb-badge-text); text-transform: uppercase;
}
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
.nsb-pos-row { display: flex; gap: 5%; align-items: stretch; }
.nsb-pos-main { flex: 0 0 70%; }
.nsb-srv-btn {
  flex: 0 0 25%;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .06em;
  cursor: pointer;
  transition: background 140ms, transform 100ms;
}
.nsb-srv-btn:hover  { background: #15803d; }
.nsb-srv-btn:active { transform: scale(0.94); }
.nsb-solo { margin-bottom: 16px; }

/* Acting-as banner */
.nsb-acting {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 12px; margin-bottom: 16px;
  border-radius: 12px; background: var(--accent-soft);
  border: 1px solid var(--accent);
}
.nsb-acting-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; color: var(--accent); }
.nsb-acting-name { font-size: 13px; font-weight: 600; color: var(--sb-text-active); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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

/* Tooltip for collapsed group headers */
.nsb-group-head[data-tip] { position: relative; }
.nsb-group-head[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: #1a1208;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  padding: 5px 10px;
  border-radius: 8px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,.25);
}
.nsb-group-head[data-tip]:hover::after { opacity: 1; }
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
.nsb-actions { display: flex; flex-direction: column; gap: 3px; }
.nsb-actions.nsb-col { gap: 6px; }
.lbl-logout { color: #ef4444; }
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
