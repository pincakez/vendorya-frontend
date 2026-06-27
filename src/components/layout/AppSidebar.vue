<template>
  <aside class="nsb" :class="{ 'nsb-collapsed': collapsed }">

    <!-- ── STICKY TOP: logo + collapse + POS/SRV + Dashboard ── -->
    <div class="nsb-sticky-top">
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
          <button class="nsb-srv-btn" @click="go('/services')" title="Services">SRV</button>
        </div>
        <div v-else class="nsb-pos-collapsed-row">
          <PhysicalButton variant="primary" :collapsed="true" tooltip="POS System" @click="go('/pos')">
            <template #icon><Calculator :size="18" /></template>
          </PhysicalButton>
          <button class="nsb-srv-btn-col" @click="go('/services')" title="Services">
            <Wrench :size="16" />
          </button>
        </div>
      </div>

      <!-- Top solo: Dashboard (store / acting) or Overview (general admin) -->
      <div class="nsb-solo">
        <PhysicalButton variant="sidebar" :collapsed="collapsed" :active="itemActive(soloTo)" :tooltip="soloLabel" @click="go(soloTo)">
          <template #icon><LayoutDashboard :size="17" :class="itemActive(soloTo) ? 'ic-active' : 'ic'" /></template>
          {{ soloLabel }}
        </PhysicalButton>
        <PhysicalButton v-if="admin && !acting" variant="sidebar" :collapsed="collapsed" :active="itemActive('/admin/commands')" tooltip="Commands" @click="go('/admin/commands')">
          <template #icon><Terminal :size="17" :class="itemActive('/admin/commands') ? 'ic-active' : 'ic'" /></template>
          Commands
        </PhysicalButton>
      </div>
    </div><!-- /nsb-sticky-top -->

    <!-- ── SCROLLABLE MIDDLE: acting banner + groups ── -->
    <div class="nsb-scroll-area">
      <!-- Acting-as-store banner -->
      <div v-if="acting && !collapsed" class="nsb-acting">
        <span class="nsb-acting-label">{{ t('nav.acting_as') }}</span>
        <span class="nsb-acting-name">{{ auth.activeStore.name }}</span>
      </div>

      <!-- Groups -->
      <div class="nsb-groups">
        <div v-for="g in displayGroups" :key="g.id" class="nsb-group">
          <!-- Collapsed: icon with rich tooltip showing group + pages -->
          <div v-if="collapsed" class="nsb-group-icon-wrap">
            <button class="nsb-group-head nsb-col" @click="toggle(g.id)">
              <component :is="g.icon" :size="20" class="grp-icon" />
            </button>
            <!-- Rich tooltip: group title + page list -->
            <div class="nsb-group-tooltip">
              <div class="nsb-gtip-title">{{ g.title }}</div>
              <div v-for="it in g.items" :key="it.to" class="nsb-gtip-item" @click.stop="go(it.to)">
                <component :is="it.icon" :size="13" class="nsb-gtip-icon" />
                {{ it.label }}
              </div>
            </div>
          </div>

          <!-- Expanded: normal group header -->
          <button v-else class="nsb-group-head" @click="toggle(g.id)">
            <span>{{ g.title }}</span>
            <ChevronDown :size="14" class="nsb-chevron" :class="{ closed: !open[g.id] }" />
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
      <!-- ── SCROLL-END ACTIONS (exit-to-admin only — logout/settings moved to header) ── -->
      <div v-if="acting" class="nsb-actions-row" :class="{ 'nsb-col': collapsed }">
        <button class="nsb-gear-btn" :title="t('nav.exit_to_admin')" @click="exitToAdmin">
          <ArrowLeft :size="22" />
        </button>
      </div>
    </div><!-- /nsb-scroll-area -->

    <!-- ── BOTTOM (user card only — pinned) ── -->
    <div class="nsb-bottom">
      <div class="nsb-user" :class="{ 'nsb-col': collapsed }" @click="go(userCardTo)">
        <div class="nsb-avatar">
          <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" />
          <span v-else>{{ auth.initials }}</span>
        </div>
        <template v-if="!collapsed">
          <div class="nsb-user-info">
            <span class="nsb-user-name">{{ auth.displayName }}</span>
            <span class="nsb-user-role">{{ admin || auth.isSuperadmin ? t('nav.super_admin') : (auth.userRole || 'User') }}</span>
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
import { useI18n } from 'vue-i18n'
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
  BarChart2, LayoutGrid, Terminal, AlertTriangle, Palette, Archive, Sparkles, CalendarClock,
  Library,
} from 'lucide-vue-next'

const props = defineProps({ collapsed: Boolean, admin: Boolean })
defineEmits(['toggle-collapse'])

const route = useRoute()
const router = useRouter()
const auth  = useAuthStore()
const theme = useThemeStore()
const { t, locale } = useI18n()

const logoSrc = computed(() =>
  props.admin ? '/logo-text-dark-mode.png'
              : (theme.dark ? '/logo-text-dark-mode.png' : '/logo-text-light-mode.png')
)

function toggleLocale() {
  const next = locale.value === 'ar' ? 'en' : 'ar'
  locale.value = next
  localStorage.setItem('vendorya_locale', next)
}

/* ── Store nav ─────────────────────────────────────────────────────────────── */
const groups = computed(() => [
  { id: 'inventory', title: t('nav.groups.inventory'), icon: Package, items: [
    { label: t('nav.items.products'),          to: '/inventory/products',    icon: Package },
    { label: t('nav.items.purchases'),         to: '/inventory/purchases',   icon: ShoppingCart },
    { label: t('nav.items.stock_adjustments'), to: '/inventory/adjustments', icon: SlidersHorizontal },
    { label: t('nav.items.stock_transfers'),   to: '/inventory/transfers',   icon: ArrowLeftRight },
    { label: t('nav.items.memory_base'),       to: '/inventory/memory-base', icon: Library },
    { label: t('nav.items.categories'),        to: '/inventory/categories',  icon: Tag },
    { label: t('nav.items.attributes'),        to: '/inventory/attributes',  icon: List },
    { label: t('nav.items.inventory_reports'), to: '/inventory/reports',     icon: FileBarChart },
    { label: t('nav.items.import_export'),     to: '/inventory/import-export', icon: ArrowDownUp },
    { label: t('nav.items.storage'),           to: '/inventory/storage',     icon: Archive },
  ] },
  { id: 'finance', title: t('nav.groups.finance'), icon: Wallet, items: [
    { label: t('nav.items.sales_invoices'), to: '/finance/invoices',     icon: FileText },
    { label: t('nav.items.returns'),        to: '/finance/returns',      icon: CornerDownLeft },
    { label: t('nav.items.expenses'),       to: '/finance/expenses',     icon: Receipt },
    { label: t('nav.items.shifts'),         to: '/finance/shifts',       icon: Clock },
    { label: t('nav.items.cash_drawer'),    to: '/finance/cash-drawer',  icon: Wallet },
  ] },
  { id: 'reports', title: t('nav.groups.reports'), icon: LineChart, items: [
    { label: t('nav.items.sales'),         to: '/reports/sales',        icon: LineChart },
    { label: t('nav.items.profit_margin'), to: '/reports/profit',       icon: TrendingUp },
    { label: t('nav.items.ar_aging'),      to: '/reports/ar-aging',     icon: Clock },
    { label: t('nav.items.ap_aging'),      to: '/reports/ap-aging',     icon: Clock },
    { label: t('nav.items.pnl'),           to: '/reports/pnl',          icon: DollarSign },
    { label: t('nav.items.expenses'),      to: '/reports/expenses',     icon: Receipt },
    { label: t('nav.items.stock_ledger'),  to: '/reports/stock-ledger', icon: BookOpen },
    { label: t('nav.items.cashier_perf'),  to: '/reports/cashiers',     icon: UserCheck },
    { label: t('nav.items.tax'),           to: '/reports/tax',          icon: Percent },
    { label: t('nav.items.storage_aging'), to: '/reports/storage-aging', icon: Clock },
    { label: t('nav.items.storage_value'), to: '/reports/storage-value', icon: Wallet },
    { label: t('nav.items.storage_movements'), to: '/reports/storage-movements', icon: ArrowDownUp },
    { label: t('nav.items.storage_recon'), to: '/reports/storage-reconciliation', icon: ShieldCheck },
    { label: t('nav.items.expiry'),        to: '/reports/expiry',       icon: CalendarClock },
  ] },
  { id: 'people', title: t('nav.groups.people'), icon: Users, items: [
    { label: t('nav.items.customers'), to: '/people/customers', icon: Users },
    { label: t('nav.items.suppliers'), to: '/people/suppliers', icon: Truck },
    { label: t('nav.items.staff'),     to: '/people/staff',     icon: Briefcase },
  ] },
  { id: 'services', title: t('nav.groups.services'), icon: Wrench, items: [
    { label: t('nav.items.services'), to: '/services', icon: Wrench },
  ] },
  { id: 'general', title: t('nav.groups.general'), icon: Folder, items: [
    { label: t('nav.items.activity_log'), to: '/activity-log', icon: Activity },
    { label: t('nav.items.inbox'),        to: '/inbox',         icon: Inbox },
  ] },
  { id: 'settings', title: t('nav.groups.settings'), icon: Settings, items: [
    { label: t('nav.items.store_settings'),  to: '/settings',                icon: Store },
    { label: t('nav.items.capabilities'),    to: '/settings/capabilities',   icon: SlidersHorizontal },
    { label: t('nav.items.taxes'),           to: '/settings/taxes',          icon: Percent },
    { label: t('nav.items.notifications'),   to: '/settings/notifications',  icon: Bell },
    { label: t('nav.items.billing'),         to: '/settings/billing',        icon: CreditCard, ownerOnly: true },
    { label: t('nav.items.pos_settings'),    to: '/settings/pos',            icon: Keyboard },
    { label: t('nav.items.profile'),         to: '/settings/profile',        icon: User },
    { label: t('nav.items.security'),        to: '/settings/security',       icon: Lock },
    { label: t('nav.items.whats_new'),       to: '/settings/changelog',      icon: Sparkles },
  ] },
])

/* ── Admin nav (general super-admin mode) ──────────────────────────────────── */
const adminGroups = computed(() => [
  { id: 'platform', title: t('nav.groups.platform'), icon: Store, items: [
    { label: t('nav.items.stores'),        to: '/admin/stores',       icon: Store },
    { label: t('nav.items.branches'),      to: '/admin/branches',     icon: Building2 },
    { label: t('nav.items.admin_users'),   to: '/admin/users',        icon: Shield },
    { label: t('nav.items.auth_settings'), to: '/admin/auth-settings',icon: KeyRound },
  ] },
  { id: 'abilling', title: t('nav.groups.billing'), icon: CreditCard, items: [
    { label: t('nav.items.subscriptions'),    to: '/admin/subscriptions',    icon: CreditCard },
    { label: t('nav.items.plans'),            to: '/admin/plans',            icon: Package },
    { label: t('nav.items.billing_settings'), to: '/admin/billing-settings', icon: SlidersHorizontal },
  ] },
  { id: 'asystem', title: t('nav.groups.system'), icon: Activity, items: [
    { label: t('nav.items.activity_log'),   to: '/admin/activity-log',    icon: Activity },
    { label: t('nav.items.tenant_usage'),   to: '/admin/usage',           icon: BarChart2 },
    { label: t('nav.items.trash'),          to: '/admin/trash',           icon: Trash2 },
    { label: t('nav.items.isolation_check'),to: '/admin/isolation-check', icon: ShieldCheck },
  ] },
  { id: 'aai', title: t('nav.groups.ai'), icon: Bot, items: [
    { label: t('nav.items.ai_profiles'), to: '/admin/ai-profiles', icon: Bot },
    { label: t('nav.items.misc'),        to: '/admin/misc',        icon: Wrench },
  ] },
  { id: 'adesign', title: t('nav.groups.design'), icon: LayoutGrid, items: [
    { label: t('nav.items.gallery'),            to: '/admin/widget-gallery',    icon: LayoutGrid },
    { label: t('nav.items.component_gallery'),  to: '/admin/component-gallery', icon: Palette },
  ] },
  { id: 'acomm', title: t('nav.groups.communication'), icon: Bell, items: [
    { label: t('nav.items.alerts_center'), to: '/admin/alerts', icon: Bell },
  ] },
])

const canBilling = computed(() => auth.userRole === 'OWNER' || auth.isSuperadmin)
const visibleGroups = computed(() =>
  groups.value.map(g => ({ ...g, items: g.items.filter(it => !it.ownerOnly || canBilling.value) }))
)

const acting = computed(() => props.admin && !!auth.activeStore)

const displayGroups = computed(() =>
  (props.admin && !acting.value) ? adminGroups.value : visibleGroups.value
)

const soloTo    = computed(() => (props.admin && !acting.value) ? '/admin/dashboard' : '/dashboard')
const soloLabel = computed(() => (props.admin && !acting.value) ? t('nav.overview') : t('nav.dashboard'))
const userCardTo = computed(() => props.admin ? '/admin/users' : '/settings/profile')

function itemActive(to) {
  if (to === '/settings') return route.path === '/settings'
  if (to === '/admin/dashboard' || to === '/dashboard') return route.path === to
  return route.path === to || route.path.startsWith(to + '/')
}

const open = reactive({})
;[...groups.value, ...adminGroups.value].forEach(g => { open[g.id] = g.items.some(it => itemActive(it.to)) })

function toggle(id) { open[id] = !open[id] }
function go(to) { if (route.path !== to) router.push(to) }
function exitToAdmin() { auth.clearActiveStore(); router.push('/admin/dashboard') }
</script>

<style scoped>
.nsb {
  width: var(--sb-width); min-width: var(--sb-width);
  background: var(--sb-bg); border-right: 1px solid var(--sb-border);
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: var(--sb-panel-shadow);
  transition: width 220ms ease, min-width 220ms ease, padding 220ms ease;
}
.nsb-collapsed { width: var(--sb-collapsed); min-width: var(--sb-collapsed); }

/* Sticky top (logo + POS/SRV + dashboard) */
.nsb-sticky-top {
  flex-shrink: 0;
  padding: 20px 14px 0;
  background: var(--sb-bg);
  border-bottom: 1px solid var(--sb-border);
  padding-bottom: 12px;
  z-index: 2;
}
.nsb-collapsed .nsb-sticky-top { padding: 20px 8px 12px; }

/* Scrollable groups area */
.nsb-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 14px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--sb-border) transparent;
}
.nsb-collapsed .nsb-scroll-area { padding: 14px 8px 0; }

/* Logo */
.nsb-logo-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 18px; }
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
.nsb-pos { margin-bottom: 14px; }
.nsb-pos-row { display: flex; gap: 5%; align-items: stretch; }
.nsb-pos-main { flex: 0 0 70%; }
.nsb-srv-btn {
  flex: 0 0 25%;
  background: linear-gradient(155deg, #34d399 0%, #059669 100%);
  color: #fff; border: none; border-radius: 12px;
  font-size: 13px; font-weight: 800; letter-spacing: .06em; cursor: pointer;
  text-shadow: 0 1px 2px rgba(0,0,0,.18);
  transition: filter 160ms, transform 100ms;
}
.nsb-srv-btn:hover  { filter: brightness(1.07); }
.nsb-srv-btn:active { transform: scale(0.94); }

/* Collapsed POS/SRV row */
.nsb-pos-collapsed-row { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.nsb-srv-btn-col {
  width: 40px; height: 36px;
  background: linear-gradient(155deg, #34d399 0%, #059669 100%);
  color: #fff; border: none; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: filter 160ms, transform 100ms;
}
.nsb-srv-btn-col:hover  { filter: brightness(1.07); }
.nsb-srv-btn-col:active { transform: scale(0.94); }

.nsb-solo { margin-bottom: 0; }

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
.nsb-groups { display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px; }
.nsb-group-head {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
  padding: 4px 8px; border: none; background: none; cursor: pointer;
  font-size: 16px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--sb-text); margin-bottom: 8px; transition: color 120ms; outline: none;
}
.nsb-group-head:hover { color: var(--sb-text-active); }
.nsb-group-head.nsb-col { justify-content: center; padding: 4px 0; margin-bottom: 6px; }
.grp-icon { color: var(--accent); }

/* Rich tooltip for collapsed group icons */
.nsb-group-icon-wrap { position: relative; margin-bottom: 6px; }
.nsb-group-icon-wrap:hover .nsb-group-tooltip { opacity: 1; pointer-events: all; transform: translateY(-50%) translateX(0); }
.nsb-group-tooltip {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%) translateX(-4px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 0;
  min-width: 170px;
  box-shadow: 0 8px 28px rgba(0,0,0,.18);
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 140ms, transform 140ms;
}
.nsb-gtip-title {
  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
  color: var(--accent); padding: 4px 14px 8px;
  border-bottom: 1px solid var(--border); margin-bottom: 4px;
}
.nsb-gtip-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; font-size: 12.5px; font-weight: 500; color: var(--text-secondary);
  cursor: pointer; transition: background 100ms, color 100ms;
}
.nsb-gtip-item:hover { background: var(--sb-hover); color: var(--text-primary); }
.nsb-gtip-icon { color: var(--accent); flex-shrink: 0; opacity: 0.7; }

.nsb-chevron { transition: transform 250ms ease; opacity: 0.7; }
.nsb-chevron.closed { transform: rotate(-90deg); }

.nsb-group-body { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 250ms ease, opacity 200ms ease; }
.nsb-group-body.open { grid-template-rows: 1fr; opacity: 1; }
.nsb-group-inner { overflow: hidden; }
.nsb-group-card {
  display: flex; flex-direction: column; gap: 3px;
  background: var(--sb-group-bg); border: 1px solid var(--sb-group-border);
  border-radius: 14px; padding: 6px; box-shadow: var(--sb-card-shadow);
}
.nsb-group-card.nsb-col { background: transparent; border-color: transparent; box-shadow: none; padding: 0; gap: 6px; }

/* Icon tint */
.ic { opacity: 0.7; flex-shrink: 0; }
.ic-active { color: var(--accent); flex-shrink: 0; }
.ic-logout { color: var(--danger); }

/* Scroll-end actions row (settings gear + logout — not sticky) */
.nsb-actions-row {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 0 16px; border-top: 1px solid var(--sb-border); margin-top: 8px;
}
.nsb-actions-row.nsb-col { flex-direction: column; align-items: center; }
.nsb-gear-btn {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: var(--sb-text); padding: 8px; border-radius: 10px;
  transition: background 120ms, color 120ms; flex-shrink: 0;
}
.nsb-gear-btn:hover { background: var(--sb-hover); color: var(--sb-text-active); }
.nsb-logout-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: var(--danger-soft); border: 1px solid rgba(239,68,68,0.25);
  color: var(--danger); border-radius: 10px; padding: 8px 12px;
  cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit;
  transition: background 120ms, border-color 120ms;
}
.nsb-logout-btn:hover { background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.5); }
.nsb-logout-btn.nsb-logout-col { flex: unset; padding: 8px; }

/* Bottom (user card only — pinned) */
.nsb-bottom { padding: 10px 14px 14px; border-top: 1px solid var(--sb-border); display: flex; flex-direction: column; gap: 0; flex-shrink: 0; background: var(--sb-bg); }
.nsb-collapsed .nsb-bottom { padding: 10px 8px 14px; }
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
