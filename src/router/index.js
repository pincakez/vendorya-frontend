import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import POSLayout from '@/layouts/POSLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('@/views/Login.vue'), meta: { public: true } },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/views/Dashboard.vue') },
        { path: 'inventory/products', component: () => import('@/views/inventory/Products.vue') },
        { path: 'inventory/purchases', component: () => import('@/views/inventory/Purchases.vue') },
        { path: 'inventory/adjustments', component: () => import('@/views/inventory/StockAdjustments.vue') },
        { path: 'inventory/categories', component: () => import('@/views/inventory/Categories.vue') },
        { path: 'inventory/attributes', component: () => import('@/views/inventory/Attributes.vue') },
        { path: 'inventory/reports', component: () => import('@/views/inventory/InventoryReports.vue') },
        { path: 'finance/invoices', component: () => import('@/views/sales/SalesInvoices.vue') },
        { path: 'finance/returns', component: () => import('@/views/sales/Returns.vue') },
        { path: 'finance/expenses', component: () => import('@/views/finance/Expenses.vue') },
        { path: 'finance/shifts', component: () => import('@/views/finance/Shifts.vue') },
        { path: 'finance/cash-drawer', component: () => import('@/views/finance/CashDrawer.vue') },
        { path: 'people/customers', component: () => import('@/views/people/Customers.vue') },
        { path: 'people/suppliers', component: () => import('@/views/people/Suppliers.vue') },
        { path: 'people/staff', component: () => import('@/views/people/Staff.vue') },
        { path: 'settings', component: () => import('@/views/settings/StoreSettings.vue') },
        { path: 'settings/policies', component: () => import('@/views/settings/Policies.vue') },
        { path: 'settings/taxes', component: () => import('@/views/settings/Taxes.vue') },
        { path: 'settings/profile', component: () => import('@/views/settings/Profile.vue') },
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
  if (!to.meta.public && !auth.isAuthenticated) next('/login')
  else if (to.path === '/login' && auth.isAuthenticated) next('/dashboard')
  else next()
})

export default router
