import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import LayoutSwitch from '@/layouts/LayoutSwitch.vue'
import i18n from '@/i18n'
import { showWarningToast } from '@/utils/toast'

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

        // Store routes — visible to regular users always, to sudo only when a store is selected.
        // s167 meta.minRole = the LOWEST role the server lets read this page's main data (the page's own
        // ViewSet role_map 'list' / IsManagerOrAbove…). The ONE source for the guard below, the sidebar and
        // the header page-search. No minRole = every store user (CASHIER and up).
        { path: 'dashboard',            component: () => import('@/views/Dashboard.vue'),                  meta: { store: true } },
        { path: 'inventory/products',           component: () => import('@/views/inventory/Products.vue'),       meta: { store: true } },
        { path: 'inventory/products/:id',       component: () => import('@/views/inventory/ProductDetail.vue'),  meta: { store: true }, props: true },
        { path: 'inventory/purchases',  component: () => import('@/views/inventory/Purchases.vue'),        meta: { store: true, minRole: 'MANAGER' } },
        { path: 'inventory/supplier-returns', component: () => import('@/views/inventory/SupplierReturns.vue'), meta: { store: true, minRole: 'MANAGER' } },   // s171
        { path: 'inventory/serials',    component: () => import('@/views/inventory/SerialLookup.vue'),     meta: { store: true, minRole: 'CASHIER' } },   // New 7: serial / IMEI lookup
        { path: 'inventory/adjustments',component: () => import('@/views/inventory/StockAdjustments.vue'), meta: { store: true, minRole: 'MANAGER' } },
        { path: 'inventory/transfers',  component: () => import('@/views/inventory/StockTransfers.vue'),  meta: { store: true, minRole: 'ADMIN' } },
        { path: 'inventory/memory-base', component: () => import('@/views/inventory/MemoryBase.vue'),       meta: { store: true } },
        { path: 'inventory/categories', component: () => import('@/views/inventory/Categories.vue'),       meta: { store: true } },
        { path: 'inventory/attributes', component: () => import('@/views/inventory/Attributes.vue'),       meta: { store: true } },
        { path: 'inventory/reports',    component: () => import('@/views/inventory/InventoryReports.vue'), meta: { store: true } },
        { path: 'inventory/import-export', component: () => import('@/views/inventory/ImportExport.vue'),  meta: { store: true, minRole: 'MANAGER' } },
        { path: 'inventory/storage',    component: () => import('@/views/inventory/Storage.vue'),         meta: { store: true } },
        { path: 'finance/invoices',     component: () => import('@/views/sales/SalesInvoices.vue'),        meta: { store: true } },
        { path: 'finance/invoices/:id', component: () => import('@/views/sales/InvoiceDetail.vue'),        meta: { store: true }, props: true },
        { path: 'finance/returns',      component: () => import('@/views/sales/Returns.vue'),              meta: { store: true } },
        { path: 'finance/expenses',     component: () => import('@/views/finance/Expenses.vue'),           meta: { store: true, minRole: 'MANAGER' } },
        // s172: reservations with a deposit — in menus only while the shop's switch is on (canOpen); open ones stay reachable.
        { path: 'finance/reservations', component: () => import('@/views/finance/Reservations.vue'),       meta: { store: true, minRole: 'CASHIER', reservations: true } },
        // s173: payment due dates (PAYMENT-DUES.md) — only while the shop's switch is on
        { path: 'finance/due-dates',    component: () => import('@/views/finance/PaymentDues.vue'),        meta: { store: true, minRole: 'MANAGER', paymentDues: true } },
        { path: 'finance/cheques',      component: () => import('@/views/finance/Cheques.vue'),            meta: { store: true, minRole: 'MANAGER', cheques: true } },   // s171 · s174: only with the switch on
        { path: 'finance/shifts',           component: () => import('@/views/finance/Shifts.vue'),            meta: { store: true } },
        { path: 'finance/shifts/:id',       component: () => import('@/views/finance/ShiftDetail.vue'),     meta: { store: true }, props: true },
        { path: 'finance/cash-drawer',  component: () => import('@/views/finance/CashDrawer.vue'),         meta: { store: true } },
        // Treasury Wave 1 (s169c): money boxes. meta.treasury = shown in menus only when the shop's Treasury switch is on
        // (canOpen below); a deep link while off still opens and the page explains it (the API answers code treasury_off).
        { path: 'finance/treasury',     component: () => import('@/views/finance/Treasury.vue'),           meta: { store: true, minRole: 'MANAGER', treasury: true } },
        { path: 'finance/treasury/:id', component: () => import('@/views/finance/TreasuryBox.vue'),        meta: { store: true, minRole: 'MANAGER', treasury: true }, props: true },
        // Treasury Wave 2 (s170, TREASURY.md § 12.5): "My money" — the owner level. meta.ownerLevel = in menus only when the Treasury
        // AND the owner level are on AND this login is the owner (canOpen); a deep link while off opens and explains
        // (the API answers owner_level_off / not_owner).
        { path: 'finance/my-money',         component: () => import('@/views/finance/MyMoney.vue'),         meta: { store: true, minRole: 'OWNER', ownerLevel: true } },
        { path: 'finance/my-money/box/:id', component: () => import('@/views/finance/MyMoneyBox.vue'),      meta: { store: true, minRole: 'OWNER', ownerLevel: true }, props: true },
        // Reports v1
        { path: 'reports/sales',        component: () => import('@/views/reports/SalesReport.vue'),         meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/profit',       component: () => import('@/views/reports/ProfitMargin.vue'),        meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/ar-aging',     component: () => import('@/views/reports/ReceivablesAging.vue'),    meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/ap-aging',     component: () => import('@/views/reports/PayablesAging.vue'),       meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/pnl',          component: () => import('@/views/reports/ProfitLoss.vue'),          meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/expenses',     component: () => import('@/views/reports/ExpenseBreakdown.vue'),    meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/stock-ledger', component: () => import('@/views/reports/StockLedger.vue'),         meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/cashiers',     component: () => import('@/views/reports/CashierPerformance.vue'),  meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/tax',          component: () => import('@/views/reports/TaxReport.vue'),           meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/storage-aging',          component: () => import('@/views/reports/StorageAging.vue'),          meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/storage-value',          component: () => import('@/views/reports/StorageValue.vue'),          meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/storage-movements',      component: () => import('@/views/reports/StorageMovements.vue'),      meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/storage-reconciliation', component: () => import('@/views/reports/StorageReconciliation.vue'), meta: { store: true, minRole: 'MANAGER' } },
        { path: 'reports/expiry',           component: () => import('@/views/reports/ExpiryReport.vue'),       meta: { store: true, minRole: 'MANAGER' } },
        { path: 'people/customers',         component: () => import('@/views/people/Customers.vue'),          meta: { store: true } },
        { path: 'people/customers/:id',     component: () => import('@/views/people/CustomerDetail.vue'),   meta: { store: true }, props: true },
        { path: 'people/suppliers',         component: () => import('@/views/people/Suppliers.vue'),          meta: { store: true, minRole: 'MANAGER' } },
        { path: 'people/suppliers/:id',     component: () => import('@/views/people/SupplierDetail.vue'),   meta: { store: true, minRole: 'MANAGER' }, props: true },
        { path: 'people/staff',         component: () => import('@/views/people/Staff.vue'),               meta: { store: true, minRole: 'MANAGER' } },
        { path: 'services',             component: () => import('@/views/services/Services.vue'),         meta: { store: true } },
        { path: 'activity-log',         component: () => import('@/views/ActivityLog.vue'),                meta: { store: true, minRole: 'MANAGER' } },
        { path: 'settings',             component: () => import('@/views/settings/StoreSettings.vue'),     meta: { store: true } },
        { path: 'settings/branches/:id', component: () => import('@/views/settings/BranchDetail.vue'),    meta: { store: true } },
        { path: 'settings/capabilities', component: () => import('@/views/settings/Capabilities.vue'),    meta: { store: true, minRole: 'OWNER' } },   // every save = PATCH /api/core/settings/ = IsOwner (s167)
        { path: 'settings/taxes',       component: () => import('@/views/settings/Taxes.vue'),             meta: { store: true } },
        { path: 'settings/profile',     component: () => import('@/views/settings/Profile.vue'),           meta: { store: true } },
        { path: 'settings/security',    component: () => import('@/views/settings/Security.vue'),          meta: { store: true } },
        { path: 'settings/changelog',   component: () => import('@/views/settings/Changelog.vue'),         meta: { store: true } },
        { path: 'settings/export',      component: () => import('@/views/settings/ShopExport.vue'),        meta: { store: true, minRole: 'OWNER' } },   // GET /api/core/shop-export/ = role_map OWNER (s167)
        { path: 'settings/billing',     component: () => import('@/views/settings/Billing.vue'),           meta: { store: true, minRole: 'OWNER' } },
        { path: 'settings/billing/invoices/:id',   component: () => import('@/views/settings/Billing.vue'),           meta: { store: true, minRole: 'OWNER' } },
        { path: 'settings/notifications',         component: () => import('@/views/settings/NotificationPrefs.vue'), meta: { store: true } },
        { path: 'settings/pos',                    component: () => import('@/views/settings/PosSettings.vue'),       meta: { store: true } },
        { path: 'settings/lockscreen',             component: () => import('@/views/settings/LockscreenSettings.vue'), meta: { store: true } },
        // Legacy deep-links → redirect into the merged POS Settings page
        { path: 'settings/pos/favorites',          redirect: '/settings/pos' },
        { path: 'settings/pos/top-selling',        redirect: '/settings/pos' },
        { path: 'settings/pos/ux',                 redirect: '/settings/pos' },

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
        { path: 'admin/auth-settings', component: () => import('@/views/admin/AdminAuthSettings.vue'),  meta: { admin: true } },
        { path: 'admin/alerts',        component: () => import('@/views/admin/AdminAlerts.vue'),         meta: { admin: true } },
        { path: 'admin/trash',         component: () => import('@/views/admin/AdminTrash.vue'),          meta: { admin: true } },
        { path: 'admin/widget-gallery',     component: () => import('@/views/admin/WidgetGallery.vue'),     meta: { admin: true } },
        { path: 'admin/component-gallery', component: () => import('@/views/admin/ComponentGallery.vue'), meta: { admin: true } },
        { path: 'admin/isolation-check', component: () => import('@/views/admin/AdminIsolation.vue'),     meta: { admin: true } },
        { path: 'admin/usage',           component: () => import('@/views/admin/AdminUsage.vue'),          meta: { admin: true } },
        { path: 'admin/sku',             component: () => import('@/views/admin/AdminSku.vue'),            meta: { admin: true } },
        { path: 'admin/commands',        component: () => import('@/views/admin/AdminCommands.vue'),       meta: { admin: true } },
      ]
    },
    // Bare printable pages — no app shell.
    { path: '/finance/invoices/:id/print', component: () => import('@/views/sales/InvoicePrint.vue'), meta: { requiresAuth: true } },
    { path: '/inventory/purchases/:id/print', component: () => import('@/views/inventory/PurchaseInvoicePrint.vue'), meta: { requiresAuth: true, minRole: 'MANAGER' } },
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

  // §PRIVACY-SUDO (s163): the platform account never opens a shop's screens → admin dashboard.
  if (to.meta.store && auth.isSuperadmin) {
    return next('/admin/dashboard')
  }

  // s167: a page the server would refuse this role (deep links too) → the dashboard + a small note why.
  if (to.meta.minRole && !auth.isSuperadmin && !auth.hasRole(to.meta.minRole)) {
    showWarningToast(i18n.global.t(`nav.role_blocked.${to.meta.minRole}`))
    return next('/dashboard')
  }

  next()
})

// s167: may the signed-in user open this path? Reads the route's meta.minRole — the sidebar and the
// header page-search use it so a menu never offers a page the guard above would bounce.
export function canOpen(path) {
  const meta = router.resolve(path).meta
  if (meta.treasury && !useFormatStore().treasuryEnabled) return false   // s169c: Treasury switch off → no menu entry
  if (meta.reservations && !useFormatStore().reservationsEnabled) return false   // s172
  if (meta.paymentDues && !useFormatStore().paymentDuesEnabled) return false     // s173
  if (meta.cheques && !useFormatStore().chequesEnabled) return false             // s174
  if (meta.ownerLevel) {   // s170: the owner level — both switches on AND this login is the owner
    const f = useFormatStore()
    if (!(f.treasuryEnabled && f.treasuryOwnerLevel && f.treasuryIsOwner)) return false
  }
  return useAuthStore().hasRole(meta.minRole)
}

export default router
