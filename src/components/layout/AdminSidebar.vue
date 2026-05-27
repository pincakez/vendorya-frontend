<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon" style="background: rgba(249,115,22,0.20); color: var(--admin-accent);">V</div>
      <template v-if="!collapsed">
        <span class="sidebar-logo-text">Vendorya</span>
        <span class="sidebar-logo-badge">ADMIN</span>
      </template>
    </div>

    <nav class="sidebar-nav">
      <!-- GENERAL ADMIN MODE -->
      <template v-if="!auth.activeStore">
        <NavItem icon="layout-dashboard" label="Overview"    to="/admin/dashboard" :collapsed="collapsed" />

        <div v-if="!collapsed" class="nav-section-label">Platform</div>
        <NavItem icon="store"     label="Stores"       to="/admin/stores"   :collapsed="collapsed" />
        <NavItem icon="building"  label="Branches"     to="/admin/branches" :collapsed="collapsed" />
        <NavItem icon="shield"    label="Admin Users"  to="/admin/users"    :collapsed="collapsed" />
      </template>

      <!-- STORE MODE (sudo acting as a specific store) -->
      <template v-else>
        <div v-if="!collapsed" class="nav-section-label" style="color: var(--admin-accent); opacity: 1;">
          ACTING AS
        </div>
        <div v-if="!collapsed" style="padding: 0 16px 8px; font-size: 13px; font-weight: 600; color: var(--sb-logo-text);">
          {{ auth.activeStore.name }}
        </div>

        <NavItem icon="layout-dashboard" label="Dashboard" to="/dashboard" :collapsed="collapsed" />

        <div v-if="!collapsed" class="nav-section-label">Operations</div>
        <NavGroup icon="package" label="Inventory" :collapsed="collapsed"
          :open="openGroup === 'inventory'" @toggle="toggleGroup('inventory')"
          :active="route.path.startsWith('/inventory')">
          <NavSubItem label="Products"          to="/inventory/products" />
          <NavSubItem label="Purchases"         to="/inventory/purchases" />
          <NavSubItem label="Stock Adjustments" to="/inventory/adjustments" />
          <NavSubItem label="Categories"        to="/inventory/categories" />
          <NavSubItem label="Attributes"        to="/inventory/attributes" />
          <NavSubItem label="Reports"           to="/inventory/reports" />
        </NavGroup>

        <NavGroup icon="credit-card" label="Finance" :collapsed="collapsed"
          :open="openGroup === 'finance'" @toggle="toggleGroup('finance')"
          :active="route.path.startsWith('/finance')">
          <NavSubItem label="Sales Invoices" to="/finance/invoices" />
          <NavSubItem label="Returns"        to="/finance/returns" />
          <NavSubItem label="Expenses"       to="/finance/expenses" />
          <NavSubItem label="Shifts"         to="/finance/shifts" />
          <NavSubItem label="Cash Drawer"    to="/finance/cash-drawer" />
        </NavGroup>

        <div v-if="!collapsed" class="nav-section-label">Management</div>
        <NavGroup icon="users" label="People" :collapsed="collapsed"
          :open="openGroup === 'people'" @toggle="toggleGroup('people')"
          :active="route.path.startsWith('/people')">
          <NavSubItem label="Customers" to="/people/customers" />
          <NavSubItem label="Suppliers" to="/people/suppliers" />
          <NavSubItem label="Staff"     to="/people/staff" />
        </NavGroup>

        <NavItem icon="settings" label="Settings" to="/settings" :collapsed="collapsed" />

        <!-- Exit back to admin -->
        <div v-if="!collapsed" style="padding: 16px 16px 0;">
          <button class="exit-store-btn" @click="exitStoreMode">
            <ArrowLeft :size="14" />
            <span>Exit to Admin</span>
          </button>
        </div>
        <button v-else class="header-icon-btn" style="margin: 16px auto 0;" @click="exitStoreMode" title="Exit to Admin">
          <ArrowLeft :size="16" />
        </button>
      </template>
    </nav>

    <!-- User Card -->
    <div class="sidebar-user" @click="router.push('/admin/users')">
      <div class="sidebar-avatar" style="background: rgba(249,115,22,0.20); color: var(--admin-accent);">
        <span>{{ auth.initials }}</span>
      </div>
      <template v-if="!collapsed">
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ auth.displayName }}</div>
          <div class="sidebar-user-role" style="color: var(--admin-accent);">SUPER ADMIN</div>
        </div>
        <LogOut :size="15" style="opacity:0.4;flex-shrink:0;" @click.stop="handleLogout" />
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard, Package, CreditCard, Users, Settings,
  Store, Building, Shield, LogOut, ArrowLeft
} from 'lucide-vue-next'
import NavItem from './NavItem.vue'
import NavGroup from './NavGroup.vue'
import NavSubItem from './NavSubItem.vue'

defineProps({ collapsed: Boolean })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// NavItem renders the icon via slot; we use lucide-vue-next components by registering them
// using the same `icons` map pattern that NavItem expects.
// NavItem accepts icon as string — it resolves via its own internal map.
// To keep things in sync, we add new icons here if NavItem supports them.

const openGroup = ref(
  route.path.startsWith('/inventory') ? 'inventory'
  : route.path.startsWith('/finance') ? 'finance'
  : route.path.startsWith('/people') ? 'people'
  : null
)

function toggleGroup(name) {
  openGroup.value = openGroup.value === name ? null : name
}

function exitStoreMode() {
  auth.clearActiveStore()
  router.push('/admin/dashboard')
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.exit-store-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--admin-accent-soft);
  color: var(--admin-accent);
  font-size: 12.5px;
  font-weight: 600;
  transition: background 120ms, transform 80ms;
}
.exit-store-btn:hover { background: rgba(249,115,22,0.22); }
.exit-store-btn:active { transform: scale(0.96); }
</style>
