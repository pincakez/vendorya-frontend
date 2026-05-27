<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">V</div>
      <template v-if="!collapsed">
        <span class="sidebar-logo-text">Vendorya</span>
        <span v-if="auth.isPremium" class="sidebar-logo-badge">PREMIUM</span>
      </template>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <!-- Dashboard -->
      <NavItem
        icon="layout-dashboard"
        label="Dashboard"
        to="/dashboard"
        :collapsed="collapsed"
      />

      <div v-if="!collapsed" class="nav-section-label">Operations</div>

      <!-- Inventory -->
      <NavGroup
        icon="package"
        label="Inventory"
        :collapsed="collapsed"
        :open="openGroup === 'inventory'"
        @toggle="toggleGroup('inventory')"
        :active="route.path.startsWith('/inventory')"
      >
        <NavSubItem label="Products" to="/inventory/products" />
        <NavSubItem label="Purchases" to="/inventory/purchases" />
        <NavSubItem label="Stock Adjustments" to="/inventory/adjustments" />
        <NavSubItem label="Categories" to="/inventory/categories" />
        <NavSubItem label="Attributes" to="/inventory/attributes" />
        <NavSubItem label="Reports" to="/inventory/reports" />
      </NavGroup>

      <!-- Finance -->
      <NavGroup
        icon="credit-card"
        label="Finance"
        :collapsed="collapsed"
        :open="openGroup === 'finance'"
        @toggle="toggleGroup('finance')"
        :active="route.path.startsWith('/finance')"
      >
        <NavSubItem label="Sales Invoices" to="/finance/invoices" />
        <NavSubItem label="Returns" to="/finance/returns" />
        <NavSubItem label="Expenses" to="/finance/expenses" />
        <NavSubItem label="Shifts" to="/finance/shifts" />
        <NavSubItem label="Cash Drawer" to="/finance/cash-drawer" />
      </NavGroup>

      <div v-if="!collapsed" class="nav-section-label">Management</div>

      <!-- People -->
      <NavGroup
        icon="users"
        label="People"
        :collapsed="collapsed"
        :open="openGroup === 'people'"
        @toggle="toggleGroup('people')"
        :active="route.path.startsWith('/people')"
      >
        <NavSubItem label="Customers" to="/people/customers" />
        <NavSubItem label="Suppliers" to="/people/suppliers" />
        <NavSubItem label="Staff" to="/people/staff" />
      </NavGroup>

      <!-- Activity Log -->
      <NavItem
        icon="activity"
        label="Activity Log"
        to="/activity-log"
        :collapsed="collapsed"
      />

      <!-- Inbox -->
      <NavItem
        icon="inbox"
        label="Inbox"
        to="/inbox"
        :collapsed="collapsed"
      />

      <!-- Settings -->
      <NavItem
        icon="settings"
        label="Settings"
        to="/settings"
        :collapsed="collapsed"
      />

      <!-- Billing (owner-only — header gates anyway, link is fine for visibility) -->
      <NavItem
        v-if="auth.userRole === 'OWNER' || auth.isSuperadmin"
        icon="receipt"
        label="Billing"
        to="/settings/billing"
        :collapsed="collapsed"
      />

      <!-- POS -->
      <NavItem
        icon="monitor"
        label="Point of Sale"
        to="/pos"
        :collapsed="collapsed"
      />
    </nav>

    <!-- User Card -->
    <div class="sidebar-user" @click="router.push('/settings/profile')">
      <div class="sidebar-avatar">
        <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" style="width:100%;height:100%;object-fit:cover;" />
        <span v-else>{{ auth.initials }}</span>
      </div>
      <template v-if="!collapsed">
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ auth.displayName }}</div>
          <div class="sidebar-user-role">{{ auth.userRole || 'User' }}</div>
        </div>
        <component :is="icons['log-out']" :size="15" style="opacity:0.4;flex-shrink:0;" @click.stop="handleLogout" />
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard, Package, CreditCard, Users, Settings, Monitor,
  LogOut, ChevronRight
} from 'lucide-vue-next'
import NavItem from './NavItem.vue'
import NavGroup from './NavGroup.vue'
import NavSubItem from './NavSubItem.vue'

defineProps({ collapsed: Boolean })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const icons = {
  'layout-dashboard': LayoutDashboard,
  'package': Package,
  'credit-card': CreditCard,
  'users': Users,
  'settings': Settings,
  'monitor': Monitor,
  'log-out': LogOut,
  'chevron-right': ChevronRight,
}

const openGroup = ref(
  route.path.startsWith('/inventory') ? 'inventory'
  : route.path.startsWith('/finance') ? 'finance'
  : route.path.startsWith('/people') ? 'people'
  : null
)

function toggleGroup(name) {
  openGroup.value = openGroup.value === name ? null : name
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
