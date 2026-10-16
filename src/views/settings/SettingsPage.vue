<template>
  <div class="sp">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.hub.title') }}</h1>
        <p class="page-sub">{{ t('settings.hub.sub') }}</p>
      </div>
    </div>

    <div class="sp-layout" :class="{ 'sp-layout--narrow': navCollapsed }">
      <!-- Side list: Shop group + Me group. Collapses to icons (remembered per browser). -->
      <nav class="sp-nav" :aria-label="t('settings.hub.title')">
        <div class="sp-nav-top">
          <div v-if="!navCollapsed" class="sp-search">
            <Search :size="14" class="sp-search-icon" />
            <input v-model="query" type="search" class="sp-search-input" :placeholder="t('settings.hub.search_ph')" :aria-label="t('settings.hub.search_ph')" />
          </div>
          <BaseButton variant="ghost" size="sm" class="sp-collapse" :title="navCollapsed ? t('settings.hub.expand') : t('settings.hub.collapse')"
                      :aria-label="navCollapsed ? t('settings.hub.expand') : t('settings.hub.collapse')" @click="toggleNav">
            <component :is="navCollapsed ? PanelLeftOpen : PanelLeftClose" :size="16" />
          </BaseButton>
        </div>

        <template v-for="g in navGroups" :key="g.id">
          <div v-if="!navCollapsed" class="sp-group">{{ t('settings.hub.group_' + g.id) }}</div>
          <div v-else class="sp-group-rule" />
          <RouterLink v-for="tab in g.tabs" :key="tab.id" :to="{ path: '/settings', query: { tab: tab.id } }"
                      class="sp-item" :class="{ active: tab.id === activeId }" :title="navCollapsed ? label(tab) : ''">
            <component :is="tab.icon" :size="16" class="sp-item-icon" />
            <span class="sp-item-label">{{ label(tab) }}</span>
            <span v-if="tab.id === 'modules' && moduleCount" class="sp-count">{{ t('settings.hub.on_count', { n: moduleCount.on, total: moduleCount.total }) }}</span>
          </RouterLink>
        </template>
        <p v-if="!navCollapsed && query && !navGroups.length" class="sp-nomatch">{{ t('settings.hub.no_match') }}</p>
      </nav>

      <!-- The chosen tab: its parts stacked, each part = one of today's screens in embedded mode. -->
      <section class="sp-body">
        <div class="sp-head">
          <h2 class="sp-title">{{ label(activeTab) }}</h2>
          <span class="sp-scope" :class="activeTab.group === 'me' ? 'sp-scope--me' : ''">
            {{ activeTab.group === 'me' ? t('settings.hub.scope_me') : (isOwner ? t('settings.hub.scope_shop_owner') : t('settings.hub.scope_shop')) }}
          </span>
        </div>
        <div v-for="(pane, i) in activePanes" :key="activeTab.id + i" class="sp-pane">
          <h3 v-if="pane.title" class="sp-pane-title">{{ t(pane.title) }}</h3>
          <component :is="pane.comp" v-bind="pane.props" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// s176 (Yakot 10-16, layout A): ONE settings page. A side list (Shop / Me) on the left, the chosen tab on the right.
// Each tab stacks parts of today's screens in embedded mode, so nothing is rewritten. Who sees a part = who may change
// it on the server: shop settings = Owner · branches, payment methods, taxes = Admin · favourites + label sizes = Manager.
// Everyone gets "My account". The tab lives in ?tab= (UI tabs inside the view, not router tabs).
import { ref, computed, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Store, ShoppingCart, Calculator, Printer, SlidersHorizontal, ShieldCheck, CreditCard, UserCircle, Sparkles,
         Search, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/base/BaseButton.vue'
import StoreSettings from './StoreSettings.vue'
import Capabilities from './Capabilities.vue'
import Taxes from './Taxes.vue'
import SkuInfoCard from './SkuInfoCard.vue'
import POSFavorites from './POSFavorites.vue'
import POSTopSelling from './POSTopSelling.vue'
import PosCartDisplay from './PosCartDisplay.vue'
import PosUX from './PosUX.vue'
import LockscreenSettings from './LockscreenSettings.vue'
import NotificationPrefs from './NotificationPrefs.vue'
import Billing from './Billing.vue'
import ShopExport from './ShopExport.vue'
import Profile from './Profile.vue'
import Security from './Security.vue'
import Changelog from './Changelog.vue'

const { t, locale } = useI18n()
const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const isOwner = computed(() => auth.userRole === 'OWNER')
const can = role => !role || auth.hasRole(role)

const C = c => markRaw(c)
// A StoreSettings part lists {section: minRole}; the page passes only the sections this login may change.
const TABS = [
  { id: 'shop', group: 'shop', icon: Store, panes: [
    { comp: C(StoreSettings), sections: { store: 'OWNER', branding: 'OWNER', branches: 'ADMIN' } },
  ] },
  { id: 'selling', group: 'shop', icon: ShoppingCart, panes: [
    { comp: C(StoreSettings), sections: { rules: 'OWNER', payments: 'ADMIN' } },
    { comp: C(Taxes), minRole: 'ADMIN', title: 'nav.items.taxes', props: { embedded: true } },
    { comp: C(SkuInfoCard), minRole: 'OWNER', title: 'settings.hub.sku_title' },
  ] },
  { id: 'till', group: 'shop', icon: Calculator, panes: [
    { comp: C(POSFavorites), minRole: 'MANAGER', title: 'settings.favorites.title', props: { embedded: true } },
    { comp: C(POSTopSelling), minRole: 'OWNER', title: 'settings.top_selling.title', props: { embedded: true } },
    { comp: C(PosCartDisplay), minRole: 'OWNER', title: 'settings.cart_display.title', props: { embedded: true } },
  ] },
  { id: 'printing', group: 'shop', icon: Printer, panes: [
    { comp: C(StoreSettings), sections: { printing: 'MANAGER' }, printSubs: () => isOwner.value ? null : ['labels'] },
  ] },
  { id: 'modules', group: 'shop', icon: SlidersHorizontal, panes: [
    { comp: C(Capabilities), minRole: 'OWNER', props: { embedded: true } },
  ] },
  { id: 'access', group: 'shop', icon: ShieldCheck, panes: [
    { comp: C(StoreSettings), sections: { visibility: 'OWNER', security: 'OWNER' } },
    { comp: C(LockscreenSettings), minRole: 'OWNER', title: 'nav.items.lockscreen', props: { embedded: true } },
    { comp: C(NotificationPrefs), minRole: 'OWNER', title: 'settings.hub.default_sounds', props: { embedded: true, part: 'shop' } },
  ] },
  { id: 'plan', group: 'shop', icon: CreditCard, panes: [
    { comp: C(Billing), minRole: 'OWNER', props: { embedded: true } },
    { comp: C(ShopExport), minRole: 'OWNER', title: 'settings.export.title', props: { embedded: true } },
  ] },
  { id: 'me', group: 'me', icon: UserCircle, panes: [
    { comp: C(Profile), props: { embedded: true } },
    { comp: C(Security), title: 'settings.hub.password_title', props: { embedded: true } },
    { comp: C(NotificationPrefs), title: 'settings.hub.my_sounds', props: { embedded: true, part: 'me' } },
    { comp: C(PosUX), title: 'settings.ux.title', props: { embedded: true } },
  ] },
  { id: 'whats-new', group: 'me', icon: Sparkles, panes: [
    { comp: C(Changelog), props: { embedded: true } },
  ] },
]

// The parts this login may see, ready to render.
function panesFor(tab) {
  return tab.panes.flatMap(p => {
    if (p.sections) {
      const sections = Object.keys(p.sections).filter(s => can(p.sections[s]))
      if (!sections.length) return []
      return [{ comp: p.comp, title: p.title, props: { sections, printSubs: p.printSubs ? p.printSubs() : null } }]
    }
    return can(p.minRole) ? [{ comp: p.comp, title: p.title, props: p.props || {} }] : []
  })
}
const visibleTabs = computed(() => TABS.filter(tab => panesFor(tab).length))

const label = tab => t('settings.hub.tabs.' + tab.id)

// Search: the tab name + its keywords in the screen's language, plus the English keywords (people type both).
const query = ref('')
const kw = tab => `${label(tab)} ${t('settings.hub.kw.' + tab.id)} ${locale.value === 'en' ? '' : t('settings.hub.kw.' + tab.id, {}, { locale: 'en' })}`.toLowerCase()
const navGroups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const tabs = visibleTabs.value.filter(tab => !q || kw(tab).includes(q))
  return ['shop', 'me'].map(id => ({ id, tabs: tabs.filter(x => x.group === id) })).filter(g => g.tabs.length)
})

const activeTab = computed(() => {
  const want = visibleTabs.value.find(x => x.id === route.query.tab)
  return want || visibleTabs.value.find(x => x.group === 'shop') || visibleTabs.value[0]
})
const activeId = computed(() => activeTab.value?.id)
const activePanes = computed(() => activeTab.value ? panesFor(activeTab.value) : [])
// A hidden or unknown ?tab= quietly becomes the first tab this login may open.
watch(() => route.query.tab, tab => {
  if (tab !== activeId.value && route.path === '/settings') router.replace({ path: '/settings', query: { tab: activeId.value } })
}, { immediate: true })

// Collapsed side list — a per-browser convenience.
const NAV_KEY = 'vya_settings_nav'
const navCollapsed = ref(false)
try { navCollapsed.value = localStorage.getItem(NAV_KEY) === 'collapsed' } catch { /* private window */ }
function toggleNav() {
  navCollapsed.value = !navCollapsed.value
  try { localStorage.setItem(NAV_KEY, navCollapsed.value ? 'collapsed' : 'open') } catch { /* ignore */ }
}

// "N of M on" next to Modules (owner only — the switches are the owner's).
const MODULE_FIELDS = ['multi_unit_enabled', 'expiry_tracking_enabled', 'weight_selling_enabled', 'enable_agel_selling',
  'reservations_enabled', 'payment_dues_enabled', 'cheques_enabled', 'salesperson_picker_enabled', 'treasury_enabled',
  'treasury_owner_level', 'tax_enabled', 'services_enabled', 'supplier_returns_enabled', 'serials_enabled', 'transfers_enabled']
const moduleCount = ref(null)
async function loadCount() {
  if (!isOwner.value) return
  try {
    const { data } = await api.get('/api/core/settings/')
    const present = MODULE_FIELDS.filter(f => f in data)
    moduleCount.value = { on: present.filter(f => data[f]).length, total: present.length }
  } catch { moduleCount.value = null }
}
watch(activeId, loadCount, { immediate: true })
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.sp-layout { display:grid; grid-template-columns:220px minmax(0, 1fr); gap:20px; align-items:start; }
.sp-layout--narrow { grid-template-columns:52px minmax(0, 1fr); }

.sp-nav { position:sticky; top:12px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:8px;
  display:flex; flex-direction:column; gap:2px; }
.sp-nav-top { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
.sp-layout--narrow .sp-nav-top { justify-content:center; }
.sp-search { position:relative; flex:1; min-width:0; }
.sp-search-icon { position:absolute; inset-inline-start:9px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.sp-search-input { width:100%; height:32px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app);
  color:var(--text-primary); font:inherit; font-size:12.5px; padding-inline:28px 8px; }
.sp-search-input:focus { outline:2px solid var(--accent-soft); border-color:var(--accent); }
.sp-collapse { flex:none; }

.sp-group { font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); padding:10px 8px 4px; }
.sp-group-rule { height:1px; background:var(--border); margin:6px 4px; }
.sp-item { display:flex; align-items:center; gap:9px; padding:7px 9px; border-radius:8px; color:var(--text-secondary);
  font-size:13px; text-decoration:none; transition:background 120ms, color 120ms; }
.sp-layout--narrow .sp-item { justify-content:center; padding:8px 0; }
.sp-layout--narrow .sp-item-label, .sp-layout--narrow .sp-count { display:none; }
.sp-item:hover { background:var(--bg-app); color:var(--text-primary); }
.sp-item.active { background:var(--accent-soft); color:var(--text-primary); font-weight:700; box-shadow:inset 3px 0 0 var(--accent); }
.sp-item:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
.sp-item-icon { flex:none; color:var(--text-muted); }
.sp-item.active .sp-item-icon { color:var(--accent); }
.sp-item-label { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sp-count { flex:none; font-size:11px; color:var(--text-muted); font-variant-numeric:tabular-nums; }
.sp-nomatch { font-size:12px; color:var(--text-muted); padding:8px; margin:0; }

.sp-body { min-width:0; display:flex; flex-direction:column; gap:22px; }
.sp-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.sp-title { font-size:19px; font-weight:800; margin:0; color:var(--text-primary); }
.sp-scope { font-size:11.5px; font-weight:700; border-radius:999px; padding:2px 10px; background:var(--bg-app); color:var(--text-muted); border:1px solid var(--border); }
.sp-scope--me { background:var(--accent-soft); color:var(--accent); border-color:transparent; }
.sp-pane { min-width:0; }
.sp-pane-title { font-size:15px; font-weight:700; color:var(--text-primary); margin:0 0 12px; }

/* Phone / small tablet: the list becomes a row of chips above the content. */
@media (max-width: 900px) {
  .sp-layout, .sp-layout--narrow { grid-template-columns:minmax(0, 1fr); }
  .sp-nav { position:static; flex-direction:row; flex-wrap:nowrap; overflow-x:auto; padding:6px; }
  .sp-nav-top, .sp-group, .sp-group-rule, .sp-nomatch { display:none; }
  .sp-item, .sp-layout--narrow .sp-item { flex:none; padding:7px 12px; justify-content:flex-start; }
  .sp-item.active { box-shadow:inset 0 -2px 0 var(--accent); }
  .sp-layout--narrow .sp-item-label { display:inline; }
  .sp-layout--narrow .sp-count { display:inline; }
}
</style>
