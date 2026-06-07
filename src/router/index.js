import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import LayoutSwitch from '@/layouts/LayoutSwitch.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('@/views/Login.vue'), meta: { public: true } },
    { path: '/change-password', component: () => import('@/views/ChangePassword.vue'), meta: { requiresAuth: true, forceChange: true } },
    {
      path: '/',
      component: LayoutSwitch,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },

        // Store routes — visible to regular users always, to sudo only when a store is selected
        { path: 'dashboard',            component: () => import('@/views/Dashboard.vue'),                  meta: { store: true } },
        { path: 'inventory/products',           component: () => import('@/views/inventory/Products.vue'),       meta: { store: true } },
        { path: 'inventory/products/:id',       component: () => import('@/views/inventory/ProductDetail.vue'),  meta: { store: true }, props: true },
        { path: 'inventory/purchases',  component: () => import('@/views/inventory/Purchases.vue'),        meta: { store: true } },
        { path: 'inventory/adjustments',component: () => import('@/views/inventory/StockAdjustments.vue'), meta: { store: true } },
        { path: 'inventory/transfers',  component: () => import('@/views/inventory/StockTransfers.vue'),  meta: { store: true } },
        { path: 'inventory/categories', component: () => import('@/views/inventory/Categories.vue'),       meta: { store: true } },
        { path: 'inventory/attributes', component: () => import('@/views/inventory/Attributes.vue'),       meta: { store: true } },
        { path: 'inventory/reports',    component: () => import('@/views/inventory/InventoryReports.vue'), meta: { store: true } },
        { path: 'inventory/import-export', component: () => import('@/views/inventory/ImportExport.vue'),  meta: { store: true } },
        { path: 'finance/invoices',     component: () => import('@/views/sales/SalesInvoices.vue'),        meta: { store: true } },
        { path: 'finance/returns',      component: () => import('@/views/sales/Returns.vue'),              meta: { store: true } },
        { path: 'finance/expenses',     component: () => import('@/views/finance/Expenses.vue'),           meta: { store: true } },
        { path: 'finance/shifts',           component: () => import('@/views/finance/Shifts.vue'),            meta: { store: true } },
        { path: 'finance/shifts/:id',       component: () => import('@/views/finance/ShiftDetail.vue'),     meta: { store: true }, props: true },
        { path: 'finance/cash-drawer',  component: () => import('@/views/finance/CashDrawer.vue'),         meta: { store: true } },
        // Reports v1
        { path: 'reports/sales',        component: () => import('@/views/reports/SalesReport.vue'),         meta: { store: true } },
        { path: 'reports/profit',       component: () => import('@/views/reports/ProfitMargin.vue'),        meta: { store: true } },
        { path: 'reports/ar-aging',     component: () => import('@/views/reports/ReceivablesAging.vue'),    meta: { store: true } },
        { path: 'reports/ap-aging',     component: () => import('@/views/reports/PayablesAging.vue'),       meta: { store: true } },
        { path: 'reports/pnl',          component: () => import('@/views/reports/ProfitLoss.vue'),          meta: { store: true } },
        { path: 'reports/expenses',     component: () => import('@/views/reports/ExpenseBreakdown.vue'),    meta: { store: true } },
        { path: 'reports/stock-ledger', component: () => import('@/views/reports/StockLedger.vue'),         meta: { store: true } },
        { path: 'reports/cashiers',     component: () => import('@/views/reports/CashierPerformance.vue'),  meta: { store: true } },
        { path: 'reports/tax',          component: () => import('@/views/reports/TaxReport.vue'),           meta: { store: true } },
        { path: 'people/customers',         component: () => import('@/views/people/Customers.vue'),          meta: { store: true } },
        { path: 'people/customers/:id',     component: () => import('@/views/people/CustomerDetail.vue'),   meta: { store: true }, props: true },
        { path: 'people/suppliers',         component: () => import('@/views/people/Suppliers.vue'),          meta: { store: true } },
        { path: 'people/suppliers/:id',     component: () => import('@/views/people/SupplierDetail.vue'),   meta: { store: true }, props: true },
        { path: 'people/staff',         component: () => import('@/views/people/Staff.vue'),               meta: { store: true } },
        { path: 'activity-log',         component: () => import('@/views/ActivityLog.vue'),                meta: { store: true } },
        { path: 'settings',             component: () => import('@/views/settings/StoreSettings.vue'),     meta: { store: true } },
        { path: 'settings/taxes',       component: () => import('@/views/settings/Taxes.vue'),             meta: { store: true } },
        { path: 'settings/profile',     component: () => import('@/views/settings/Profile.vue'),           meta: { store: true } },
        { path: 'settings/security',    component: () => import('@/views/settings/Security.vue'),          meta: { store: true } },
        { path: 'settings/billing',     component: () => import('@/views/settings/Billing.vue'),           meta: { store: true } },
        { path: 'settings/billing/invoices/:id',   component: () => import('@/views/settings/Billing.vue'),           meta: { store: true } },
        { path: 'settings/notifications',         component: () => import('@/views/settings/NotificationPrefs.vue'), meta: { store: true } },
        { path: 'settings/pos/favorites',          component: () => import('@/views/settings/POSFavorites.vue'),      meta: { store: true } },
        { path: 'settings/pos/top-selling',        component: () => import('@/views/settings/POSTopSelling.vue'),     meta: { store: true } },
        { path: 'settings/pos/ux',                 component: () => import('@/views/settings/PosUX.vue'),             meta: { store: true } },

        // POS — uses DefaultLayout with sidebar auto-collapsed
        { path: 'pos',                  component: () => import('@/views/POS.vue'),                       meta: { store: true } },

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
        { path: 'admin/billing-settings', component: () => import('@/views/admin/AdminBillingSettings.vue'), meta: { admin: true } },
        { path: 'admin/misc',          component: () => import('@/views/admin/AdminMisc.vue'),          meta: { admin: true } },
        { path: 'admin/ai-profiles',   component: () => import('@/views/admin/AdminAIProfiles.vue'),   meta: { admin: true } },
        { path: 'admin/auth-settings', component: () => import('@/views/admin/AdminAuthSettings.vue'),  meta: { admin: true } },
        { path: 'admin/alerts',        component: () => import('@/views/admin/AdminAlerts.vue'),         meta: { admin: true } },
        { path: 'admin/trash',         component: () => import('@/views/admin/AdminTrash.vue'),          meta: { admin: true } },
        { path: 'admin/isolation-check', component: () => import('@/views/admin/AdminIsolation.vue'),     meta: { admin: true } },
        { path: 'admin/usage',           component: () => import('@/views/admin/AdminUsage.vue'),          meta: { admin: true } },
      ]
    },
    // Bare printable pages — no app shell.
    { path: '/finance/invoices/:id/print', component: () => import('@/views/sales/InvoicePrint.vue'), meta: { requiresAuth: true } },
    { path: '/print/labels',               component: () => import('@/views/print/LabelPrint.vue'),   meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

// Access token is memory-only, so a page reload starts with no token. Before the
// FIRST navigation we must trade the httpOnly refresh cookie for a fresh access
// token — otherwise the guard below would see "logged out" and bounce to /login
// even though the session is valid. (vue-router fires this initial navigation at
// app.use(router) time, before main.js code runs, so the gate must live here.)
let booted = false

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (!booted) {
    booted = true
    await auth.bootstrap()
    if (auth.isAuthenticated) useFormatStore().loadForStore()
  }

  // Public routes
  if (to.meta.public) {
    if (to.path === '/login' && auth.isAuthenticated) {
      return next(auth.isSuperadmin ? '/admin/dashboard' : '/dashboard')
    }
    return next()
  }

  // Auth gate
  if (!auth.isAuthenticated) return next('/login')

  // Forced password change blocks everything until the user sets a new password.
  if (auth.user?.force_password_change) {
    if (to.path !== '/change-password') return next('/change-password')
    return next()
  }
  // Not forced → the change-password gate isn't for them.
  if (to.meta.forceChange) return next(auth.isSuperadmin ? '/admin/dashboard' : '/dashboard')

  // Admin-only routes: block non-sudo
  if (to.meta.admin && !auth.isSuperadmin) return next('/dashboard')

  // Sudo visiting a store route without picking a store → bounce to admin dashboard
  if (to.meta.store && auth.isSuperadmin && !auth.activeStore) {
    return next('/admin/dashboard')
  }

  next()
})

export default router
