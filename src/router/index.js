import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LayoutSwitch from '@/layouts/LayoutSwitch.vue'
import POSLayout from '@/layouts/POSLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('@/views/Login.vue'), meta: { public: true } },
    {
      path: '/',
      component: LayoutSwitch,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },

        // Store routes — visible to regular users always, to sudo only when a store is selected
        { path: 'dashboard',            component: () => import('@/views/Dashboard.vue'),                  meta: { store: true } },
        { path: 'inventory/products',   component: () => import('@/views/inventory/Products.vue'),         meta: { store: true } },
        { path: 'inventory/purchases',  component: () => import('@/views/inventory/Purchases.vue'),        meta: { store: true } },
        { path: 'inventory/adjustments',component: () => import('@/views/inventory/StockAdjustments.vue'), meta: { store: true } },
        { path: 'inventory/categories', component: () => import('@/views/inventory/Categories.vue'),       meta: { store: true } },
        { path: 'inventory/attributes', component: () => import('@/views/inventory/Attributes.vue'),       meta: { store: true } },
        { path: 'inventory/reports',    component: () => import('@/views/inventory/InventoryReports.vue'), meta: { store: true } },
        { path: 'finance/invoices',     component: () => import('@/views/sales/SalesInvoices.vue'),        meta: { store: true } },
        { path: 'finance/returns',      component: () => import('@/views/sales/Returns.vue'),              meta: { store: true } },
        { path: 'finance/expenses',     component: () => import('@/views/finance/Expenses.vue'),           meta: { store: true } },
        { path: 'finance/shifts',       component: () => import('@/views/finance/Shifts.vue'),             meta: { store: true } },
        { path: 'finance/cash-drawer',  component: () => import('@/views/finance/CashDrawer.vue'),         meta: { store: true } },
        { path: 'people/customers',     component: () => import('@/views/people/Customers.vue'),           meta: { store: true } },
        { path: 'people/suppliers',     component: () => import('@/views/people/Suppliers.vue'),           meta: { store: true } },
        { path: 'people/staff',         component: () => import('@/views/people/Staff.vue'),               meta: { store: true } },
        { path: 'activity-log',         component: () => import('@/views/ActivityLog.vue'),                meta: { store: true } },
        { path: 'settings',             component: () => import('@/views/settings/StoreSettings.vue'),     meta: { store: true } },
        { path: 'settings/policies',    component: () => import('@/views/settings/Policies.vue'),          meta: { store: true } },
        { path: 'settings/taxes',       component: () => import('@/views/settings/Taxes.vue'),             meta: { store: true } },
        { path: 'settings/profile',     component: () => import('@/views/settings/Profile.vue'),           meta: { store: true } },
        { path: 'settings/billing',     component: () => import('@/views/settings/Billing.vue'),           meta: { store: true } },
        { path: 'settings/billing/invoices/:id', component: () => import('@/views/settings/Billing.vue'),  meta: { store: true } },

        // Inbox — any authenticated store user
        { path: 'inbox',                component: () => import('@/views/Inbox.vue'),                      meta: { store: true } },

        // Admin routes — sudo only
        { path: 'admin',           redirect: '/admin/dashboard' },
        { path: 'admin/dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { admin: true } },
        { path: 'admin/stores',    component: () => import('@/views/admin/AdminStores.vue'),    meta: { admin: true } },
        { path: 'admin/branches',  component: () => import('@/views/admin/AdminBranches.vue'),  meta: { admin: true } },
        { path: 'admin/users',         component: () => import('@/views/admin/AdminUsers.vue'),        meta: { admin: true } },
        { path: 'admin/activity-log',  component: () => import('@/views/admin/AdminActivityLog.vue'),  meta: { admin: true } },
        { path: 'admin/plans',         component: () => import('@/views/admin/AdminPlans.vue'),         meta: { admin: true } },
        { path: 'admin/subscriptions', component: () => import('@/views/admin/AdminSubscriptions.vue'), meta: { admin: true } },
        { path: 'admin/misc',          component: () => import('@/views/admin/AdminMisc.vue'),          meta: { admin: true } },
      ]
    },
    {
      path: '/pos',
      component: POSLayout,
      meta: { requiresAuth: true },
      children: [{ path: '', component: () => import('@/views/POS.vue') }]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Public routes
  if (to.meta.public) {
    if (to.path === '/login' && auth.isAuthenticated) {
      return next(auth.isSuperadmin ? '/admin/dashboard' : '/dashboard')
    }
    return next()
  }

  // Auth gate
  if (!auth.isAuthenticated) return next('/login')

  // Admin-only routes: block non-sudo
  if (to.meta.admin && !auth.isSuperadmin) return next('/dashboard')

  // Sudo visiting a store route without picking a store → bounce to admin dashboard
  if (to.meta.store && auth.isSuperadmin && !auth.activeStore) {
    return next('/admin/dashboard')
  }

  next()
})

export default router
