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
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#dcfce7;color:#16a34a;">
          <TrendingUp :size="20" />
        </div>
        <div class="kpi-body">
          <div class="kpi-label">Today's Sales</div>
          <div class="kpi-value">{{ auth.currency }} {{ formatNumber(data.today_sales_total) }}</div>
          <div class="kpi-sub">{{ data.today_invoices_count }} invoice{{ data.today_invoices_count !== 1 ? 's' : '' }}</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#dbeafe;color:#2563eb;">
          <ShoppingBag :size="20" />
        </div>
        <div class="kpi-body">
          <div class="kpi-label">Items Sold Today</div>
          <div class="kpi-value">{{ formatQty(data.today_items_sold) }}</div>
          <div class="kpi-sub">units dispatched</div>
        </div>
      </div>

      <div class="kpi-card" :class="data.open_shift ? 'card-open' : ''">
        <div class="kpi-icon" :style="data.open_shift ? 'background:#dcfce7;color:#16a34a;' : 'background:#f3f4f6;color:#9ca3af;'">
          <Clock :size="20" />
        </div>
        <div class="kpi-body">
          <div class="kpi-label">Active Shift</div>
          <div class="kpi-value" style="font-size:15px;">
            {{ data.open_shift ? 'Open' : 'No open shift' }}
          </div>
          <div class="kpi-sub" v-if="data.open_shift">
            since {{ fmtTime(data.open_shift.start_time) }} · {{ data.open_shift.user }}
          </div>
        </div>
        <div v-if="data.open_shift" class="pulse-dot" />
      </div>

      <div class="kpi-card" :class="data.low_stock_count > 0 ? 'card-warn' : ''">
        <div class="kpi-icon" :style="data.low_stock_count > 0 ? 'background:#fef3c7;color:#d97706;' : 'background:#f3f4f6;color:#9ca3af;'">
          <AlertTriangle :size="20" />
        </div>
        <div class="kpi-body">
          <div class="kpi-label">Low Stock Alerts</div>
          <div class="kpi-value" :style="data.low_stock_count > 0 ? 'color:#d97706' : ''">
            {{ data.low_stock_count }}
          </div>
          <div class="kpi-sub">items at or below {{ LOW_STOCK_THRESHOLD }} units</div>
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
                <td colspan="4" class="table-empty">No sales today</td>
              </tr>
              <tr v-for="inv in data.recent_sales" :key="inv.id" class="table-row">
                <td class="col-ref">{{ inv.invoice_number }}</td>
                <td>{{ inv.customer }}</td>
                <td class="col-amount">{{ auth.currency }} {{ formatNumber(inv.grand_total) }}</td>
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
                <td colspan="4" class="table-empty">
                  <CheckCircle :size="28" style="opacity:.3;margin-bottom:6px;" />
                  <div>All stock levels healthy</div>
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
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-vue-next'
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

onMounted(fetchData)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub   { font-size: 13px; color: var(--text-muted); margin: 3px 0 0; }

.btn-refresh {
  width: 34px; height: 34px;
  border-radius: 8px;
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
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  position: relative;
  transition: box-shadow 120ms;
}
.kpi-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.07); }
.kpi-card.card-open  { border-color: #86efac; }
.kpi-card.card-warn  { border-color: #fcd34d; }

.kpi-icon {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-body  { flex: 1; min-width: 0; }
.kpi-label { font-size: 11.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 3px; }
.kpi-value { font-size: 20px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; line-height: 1.2; }
.kpi-sub   { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }

.skeleton-card { height: 82px; background: var(--border); border-radius: 12px; animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

/* Pulse dot for open shift */
.pulse-dot {
  position: absolute;
  top: 14px; right: 14px;
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
  border-radius: 12px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.panel-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.panel-link  { font-size: 12px; color: var(--accent); text-decoration: none; }
.panel-link:hover { text-decoration: underline; }

.table-wrap { overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead th {
  padding: 9px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-muted);
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
}
.data-table tbody tr.table-row { border-bottom: 1px solid var(--border); transition: background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom: none; }
.data-table tbody tr.table-row:hover { background: var(--bg-app); }
.data-table tbody td { padding: 9px 14px; color: var(--text-primary); }

.table-empty {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.col-ref    { font-family: monospace; font-size: 12px; color: var(--text-muted); }
.col-muted  { color: var(--text-muted); font-size: 12px; }
.col-amount { font-variant-numeric: tabular-nums; color: #16a34a; font-weight: 600; }

.qty-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.qty-zero { background: #fee2e2; color: #dc2626; }
.qty-low  { background: #fef3c7; color: #92400e; }
</style>
