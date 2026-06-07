<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">{{ today }}</p>
      </div>
      <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }">
        <RefreshCw :size="15" />
      </button>
    </div>

    <!-- KPI Skeleton -->
    <div v-if="loading" class="kpi-grid">
      <div v-for="i in 4" :key="i" class="kpi-card skeleton-card" />
    </div>

    <!-- KPI Cards -->
    <div v-else class="kpi-grid">
      <div class="kpi-card kpi-green">
        <div class="kpi-label">Today's Sales</div>
        <div class="kpi-value"><Money :value="data.today_sales_total" /></div>
        <div class="kpi-sub">{{ data.today_invoices_count }} invoice{{ data.today_invoices_count !== 1 ? 's' : '' }}</div>
      </div>

      <div class="kpi-card kpi-orange">
        <div class="kpi-label">Items Sold Today</div>
        <div class="kpi-value">{{ formatQty(data.today_items_sold) }}</div>
        <div class="kpi-sub">units dispatched</div>
      </div>

      <div class="kpi-card" :class="data.open_shift ? 'kpi-green card-open' : 'kpi-gray'">
        <div class="kpi-label">Active Shift</div>
        <div class="kpi-value kpi-value--sm">
          {{ data.open_shift ? 'Open' : 'No open shift' }}
        </div>
        <div class="kpi-sub" v-if="data.open_shift">
          since {{ fmtTime(data.open_shift.start_time) }} · {{ data.open_shift.user }}
        </div>
        <div v-if="data.open_shift" class="pulse-dot" />
      </div>

      <div class="kpi-card" :class="data.low_stock_count > 0 ? 'kpi-amber card-warn' : 'kpi-gray'">
        <div class="kpi-label">Low Stock Alerts</div>
        <div class="kpi-value" :class="data.low_stock_count > 0 ? 'text-amber' : ''">
          {{ data.low_stock_count }}
        </div>
        <div class="kpi-sub">items at or below {{ LOW_STOCK_THRESHOLD }} units</div>
      </div>
    </div>

    <!-- Upcoming Services Widget -->
    <div v-if="!loading" class="services-widget">
      <div class="services-header">
        <span class="services-title">Upcoming Services</span>
        <router-link v-if="data.upcoming_services.length > 0" to="/services" class="services-link">View all →</router-link>
      </div>
      <div v-if="data.upcoming_services.length === 0" class="services-empty">
        <Briefcase :size="36" class="empty-icon" />
        <p class="empty-title">No upcoming services</p>
        <p class="empty-sub">Services with ETAs will appear here.</p>
      </div>
      <div v-else class="services-list">
        <div v-for="svc in data.upcoming_services" :key="svc.id" class="service-item">
          <div class="service-col-ref">{{ svc.serial_number }}</div>
          <div class="service-col-main">
            <div class="service-name">{{ svc.client_name }}</div>
            <div class="service-type">{{ svc.service_type }}</div>
          </div>
          <div class="service-col-eta">
            <div class="eta-label">{{ fmtETA(svc.eta_datetime) }}</div>
            <div class="eta-time">{{ fmtTime(svc.eta_datetime) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Recent Sales + Low Stock -->
    <div v-if="!loading" class="bottom-grid">

      <!-- Recent Sales -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Recent Sales</span>
          <router-link to="/finance/invoices" class="panel-link">View all →</router-link>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="data.recent_sales.length === 0">
                <td colspan="4">
                  <div class="empty-state">
                    <ShoppingBag :size="36" class="empty-icon" />
                    <p class="empty-title">No sales today</p>
                    <p class="empty-sub">Sales will appear here once invoices are created.</p>
                  </div>
                </td>
              </tr>
              <tr v-for="inv in data.recent_sales" :key="inv.id" class="table-row">
                <td class="col-ref">{{ inv.invoice_number }}</td>
                <td>{{ inv.customer }}</td>
                <td class="col-amount"><Money :value="inv.grand_total" /></td>
                <td class="col-muted">{{ fmtTime(inv.date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Low Stock Items</span>
          <router-link to="/inventory/products" class="panel-link">View all →</router-link>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Branch</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="data.low_stock_items.length === 0">
                <td colspan="4">
                  <div class="empty-state">
                    <CheckCircle :size="36" class="empty-icon empty-icon--green" />
                    <p class="empty-title">All stock healthy</p>
                    <p class="empty-sub">No items below {{ LOW_STOCK_THRESHOLD }} units.</p>
                  </div>
                </td>
              </tr>
              <tr v-for="(item, i) in data.low_stock_items" :key="i" class="table-row">
                <td class="col-ref">{{ item.sku }}</td>
                <td>{{ item.product_name }}</td>
                <td class="col-muted">{{ item.branch }}</td>
                <td>
                  <span class="qty-badge" :class="Number(item.quantity) === 0 ? 'qty-zero' : 'qty-low'">
                    {{ item.quantity }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, CheckCircle, RefreshCw, Briefcase } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { formatNumber, formatQty } from '@/utils/format'

const auth = useAuthStore()
const loading = ref(false)
const LOW_STOCK_THRESHOLD = 5

const data = ref({
  today_sales_total: 0,
  today_invoices_count: 0,
  today_items_sold: 0,
  open_shift: null,
  low_stock_count: 0,
  low_stock_items: [],
  recent_sales: [],
})

const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/core/dashboard/')
    data.value = res.data
  } catch {} finally {
    loading.value = false
  }
}

function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'
}

function fmtETA(d) {
  if (!d) return '—'
  const eta = new Date(d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const etaDate = new Date(eta.getFullYear(), eta.getMonth(), eta.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (etaDate.getTime() === today.getTime()) return 'Today'
  if (etaDate.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return eta.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

onMounted(fetchData)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.page-title { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.5px; }
.page-sub   { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; font-weight: 500; }

.btn-refresh {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: color 120ms, background 120ms;
}
.btn-refresh:hover { color: var(--text-primary); background: var(--bg-app); }
.btn-refresh.spinning svg { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  border-top-width: 3px;
  padding: 20px 22px 18px;
  position: relative;
  transition: box-shadow 150ms, transform 150ms;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }

/* accent top borders */
.kpi-green  { border-top-color: #22c55e; background: linear-gradient(to bottom, rgba(34,197,94,.06) 0%, transparent 60%); }
.kpi-orange { border-top-color: var(--accent); background: linear-gradient(to bottom, rgba(247,143,30,.07) 0%, transparent 60%); }
.kpi-amber  { border-top-color: #f59e0b; background: linear-gradient(to bottom, rgba(245,158,11,.07) 0%, transparent 60%); }
.kpi-gray   { border-top-color: var(--border); }

.dark .kpi-green  { background: linear-gradient(to bottom, rgba(34,197,94,.08) 0%, transparent 60%); }
.dark .kpi-orange { background: linear-gradient(to bottom, rgba(247,143,30,.09) 0%, transparent 60%); }
.dark .kpi-amber  { background: linear-gradient(to bottom, rgba(245,158,11,.09) 0%, transparent 60%); }

.kpi-label { font-size: 12px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.kpi-value { font-size: 32px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; line-height: 1.1; margin-top: 6px; }
.kpi-value--sm { font-size: 18px; margin-top: 8px; }
.kpi-sub   { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 4px; }
.text-amber { color: #d97706; }

.card-open { border-top-color: #22c55e; }
.card-warn { border-top-color: #f59e0b; }

.skeleton-card { height: 110px; background: var(--border); border-radius: 24px; animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

/* Pulse dot for open shift */
.pulse-dot {
  position: absolute;
  top: 16px; right: 16px;
  width: 9px; height: 9px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 0 0 rgba(22,163,74,.4);
  animation: pulse 1.8s ease-out infinite;
}
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(22,163,74,.4); }
  70%  { box-shadow: 0 0 0 8px rgba(22,163,74,0); }
  100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
}

/* Bottom grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 900px) {
  .bottom-grid { grid-template-columns: 1fr; }
}

.panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.panel-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.panel-link  { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }
.panel-link:hover { text-decoration: underline; }

.table-wrap { overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-secondary);
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
}
.data-table tbody tr.table-row { border-bottom: 1px solid var(--border); transition: background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom: none; }
.data-table tbody tr.table-row:hover { background: var(--bg-app); }
.data-table tbody td { padding: 11px 16px; color: var(--text-primary); }

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}
.empty-icon { color: var(--border); margin-bottom: 12px; }
.empty-icon--green { color: #86efac; }
.empty-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.empty-sub   { font-size: 13px; color: var(--text-muted); margin: 0; }

.col-ref    { font-family: monospace; font-size: 12px; color: var(--text-muted); }
.col-muted  { color: var(--text-muted); font-size: 12px; }
.col-amount { font-variant-numeric: tabular-nums; color: #16a34a; font-weight: 600; }

.qty-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.qty-zero { background: #fee2e2; color: #dc2626; }
.qty-low  { background: #fef3c7; color: #92400e; }

/* Services Widget */
.services-widget {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  margin-bottom: 24px;
  overflow: hidden;
}
.services-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.services-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.services-link  { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }
.services-link:hover { text-decoration: underline; }

.services-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.service-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  transition: background 100ms;
}
.service-item:last-child { border-bottom: none; }
.service-item:hover { background: var(--bg-app); }

.service-col-ref {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.service-col-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.service-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.service-type {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: capitalize;
}

.service-col-eta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.eta-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
.eta-time {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
