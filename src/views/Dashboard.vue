<template>
  <div class="dash-page">

    <!-- ── AI Advice Strip ─────────────────────────────────── -->
    <div class="ai-strip intersect:motion-preset-fade intersect-once">
      <span class="ai-label">V-Agent</span>
      <div class="ai-ticker-wrap">
        <Transition name="ticker">
          <p :key="tickerIdx" class="ai-text">{{ insights[tickerIdx] }}</p>
        </Transition>
      </div>
      <div class="ai-dots">
        <button v-for="(_, i) in insights" :key="i"
          class="ai-dot" :class="{ active: i === tickerIdx }"
          @click="tickerIdx = i" />
      </div>
      <button class="ai-refresh" @click="fetchData" :class="{ spinning: loading }">
        <RefreshCw :size="13" />
      </button>
    </div>

    <!-- ── Skeleton ────────────────────────────────────────── -->
    <div v-if="loading" class="dash-grid">
      <div v-for="i in 10" :key="i" class="dash-card skel" />
    </div>

    <!-- ── Live Grid ───────────────────────────────────────── -->
    <div v-else class="dash-grid">

      <!-- Recent Sales — list style -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[60ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">{{ t('core.dash.recent_sales') }}</span>
          <router-link to="/finance/invoices" class="chip-link">{{ t('core.dash.view_all') }}</router-link>
        </div>
        <div v-if="!data.recent_sales?.length" class="b-empty">
          <ShoppingBag :size="28" /><span>{{ t('core.dash.no_sales') }}</span>
        </div>
        <div v-else class="sales-list">
          <div v-for="inv in data.recent_sales.slice(0, 5)" :key="inv.id" class="sales-row">
            <div class="sales-info">
              <span class="sales-num">{{ inv.invoice_number }}</span>
              <span class="sales-customer">{{ inv.customer }}</span>
            </div>
            <div class="sales-right">
              <span class="sales-amount"><Money :value="inv.grand_total" /></span>
              <span class="sales-time">{{ fmtTime(inv.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Revenue — real last-7-days store revenue -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[120ms] intersect:motion-ease-spring-bouncier intersect-once">
        <WeekRevenueChart :data="data.weekly_revenue" />
      </div>

      <!-- Upcoming Services -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[180ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">{{ t('core.dash.upcoming_services') }}</span>
          <router-link v-if="data.upcoming_services?.length" to="/services" class="chip-link">{{ t('core.dash.view') }}</router-link>
        </div>
        <div v-if="!data.upcoming_services?.length" class="b-empty">
          <Briefcase :size="28" /><span>{{ t('core.dash.no_services') }}</span>
        </div>
        <div v-else class="svc-list">
          <div v-for="svc in data.upcoming_services.slice(0, 4)" :key="svc.id" class="svc-row">
            <div class="svc-info">
              <span class="svc-name">{{ svc.client_name }}</span>
              <span class="svc-type">{{ svc.service_type }}</span>
            </div>
            <div class="svc-eta">
              <span class="eta-day">{{ fmtETA(svc.eta_datetime) }}</span>
              <span class="eta-time">{{ fmtTime(svc.eta_datetime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Low Stock Items -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[240ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">{{ t('core.dash.low_stock_items') }}</span>
          <router-link to="/inventory/products" class="chip-link">{{ t('core.dash.view') }}</router-link>
        </div>
        <div v-if="!data.low_stock_items?.length" class="b-empty">
          <CheckCircle :size="28" /><span>{{ t('core.dash.all_healthy') }}</span>
        </div>
        <div v-else class="stock-list">
          <div v-for="(item, i) in data.low_stock_items.slice(0, 5)" :key="i" class="stock-row">
            <span class="stock-name">{{ item.product_name }}</span>
            <span class="chip" :class="Number(item.quantity) === 0 ? 'chip-red' : 'chip-amber'">
              {{ item.quantity }}
            </span>
          </div>
        </div>
      </div>

      <!-- Today's KPIs -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[300ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">Today</span>
          <BarChart3 :size="14" style="color: var(--text-muted)" />
        </div>
        <div class="kpi-grid">
          <div class="kpi-item">
            <span class="kpi-val"><Money :value="data.today_sales_total" /></span>
            <span class="kpi-lbl">Revenue</span>
          </div>
          <div class="kpi-divider" />
          <div class="kpi-item">
            <span class="kpi-val">{{ data.today_invoices_count }}</span>
            <span class="kpi-lbl">Sales</span>
          </div>
          <div class="kpi-divider" />
          <div class="kpi-item">
            <span class="kpi-val"><Money :value="avgTicket" /></span>
            <span class="kpi-lbl">Avg Ticket</span>
          </div>
        </div>
      </div>

      <!-- Shift Summary -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[360ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">Current Shift</span>
          <router-link to="/finance/shifts" class="chip-link">View</router-link>
        </div>
        <div v-if="!data.open_shift" class="b-empty">
          <Clock :size="28" /><span>No shift open</span>
        </div>
        <div v-else class="shift-body">
          <div class="shift-avatar">{{ shiftInitials }}</div>
          <div class="shift-info">
            <div class="shift-cashier">{{ data.open_shift.user }}</div>
            <div class="shift-since">Since {{ fmtTime(data.open_shift.start_time) }}</div>
          </div>
          <div class="shift-stats">
            <div class="shift-stat">
              <span class="shift-stat-val">{{ data.open_shift.invoices_count }}</span>
              <span class="shift-stat-lbl">Sales</span>
            </div>
            <div class="shift-stat-sep" />
            <div class="shift-stat">
              <span class="shift-stat-val"><Money :value="data.open_shift.sales_total" /></span>
              <span class="shift-stat-lbl">Revenue</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Debt -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[420ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">Customer Debt</span>
          <router-link to="/people/customers" class="chip-link">View all</router-link>
        </div>
        <div v-if="!data.customer_debt?.length" class="b-empty">
          <Users :size="28" /><span>No outstanding balances</span>
        </div>
        <div v-else class="sales-list">
          <div v-for="(c, i) in data.customer_debt" :key="i" class="sales-row">
            <span class="sales-customer">{{ c.name }}</span>
            <span class="chip chip-red debt-amt"><Money :value="c.outstanding" /></span>
          </div>
        </div>
      </div>

      <!-- Top Sellers -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[480ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">Top Sellers</span>
          <span class="chip-muted">This week</span>
        </div>
        <div v-if="!data.top_sellers?.length" class="b-empty">
          <TrendingUp :size="28" /><span>No sales this week</span>
        </div>
        <div v-else class="seller-list">
          <div v-for="(item, i) in data.top_sellers" :key="i" class="seller-row">
            <span class="seller-rank">{{ i + 1 }}</span>
            <span class="seller-name">{{ item.name }}</span>
            <span class="seller-qty">×{{ fmtQty(item.qty) }}</span>
          </div>
        </div>
      </div>

      <!-- Sales by Category -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[540ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">Sales by Category</span>
          <span class="chip-muted">This week</span>
        </div>
        <div v-if="!data.sales_by_category?.length" class="b-empty">
          <PieChart :size="28" /><span>No sales this week</span>
        </div>
        <template v-else>
          <apexchart
            type="bar"
            :options="catChartOptions"
            :series="catChartSeries"
            height="155"
          />
        </template>
      </div>

      <!-- Best of the Month -->
      <div class="dash-card intersect:motion-preset-slide-left intersect:motion-delay-[600ms] intersect:motion-ease-spring-bouncier intersect-once">
        <BestOfMonth
          :attribute="data.best_of_month?.attribute"
          :category="data.best_of_month?.category"
          :day="data.best_of_month?.day"
          :hours="data.best_of_month?.hours"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, ShoppingBag, CheckCircle, Briefcase, BarChart3, Clock, Users, TrendingUp, PieChart } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import WeekRevenueChart from '@/components/dashboard/WeekRevenueChart.vue'
import BestOfMonth from '@/components/dashboard/BestOfMonth.vue'
import { formatQty } from '@/utils/format'

const { t } = useI18n()
const loading = ref(false)

const CAT_COLORS = ['#f78f1e', '#3772ff', '#ba2d0b', '#0e4749', '#2b193d']

const data = ref({
  today_sales_total:        0,
  today_invoices_count:     0,
  today_items_sold:         0,
  open_shift:               null,
  low_stock_count:          0,
  low_stock_items:          [],
  inventory_value_total:    0,
  inventory_value_storage:  0,
  weekly_revenue:           [],
  recent_sales:             [],
  upcoming_services:        [],
  top_sellers:              [],
  customer_debt:            [],
  sales_by_category:        [],
  best_of_month:            { attribute: null, category: null, day: null, hours: null },
})

// ── Ticker ──────────────────────────────────────────────────
const tickerIdx = ref(0)
let tickerTimer = null

const insights = computed(() => {
  const d = data.value
  const list = []
  const amt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.today_sales_total)
  if (d.today_invoices_count > 0) list.push(t('core.dash.ins_today', { n: d.today_invoices_count, amt }))
  if (d.today_items_sold > 0)     list.push(t('core.dash.ins_units', { n: d.today_items_sold }))
  if (d.open_shift)               list.push(t('core.dash.ins_shift', { t: fmtTime(d.open_shift.start_time), user: d.open_shift.user }))
  if (d.low_stock_count > 0)      list.push(t('core.dash.ins_restock', { n: d.low_stock_count }))
  if (d.upcoming_services?.length)list.push(t('core.dash.ins_services', { n: d.upcoming_services.length }))
  if (list.length === 0)          list.push(t('core.dash.ins_caught_up'))
  return list
})

function startTicker() {
  tickerTimer = setInterval(() => {
    tickerIdx.value = (tickerIdx.value + 1) % insights.value.length
  }, 6000)
}

// ── Computed ─────────────────────────────────────────────────
const avgTicket = computed(() => {
  const cnt = data.value.today_invoices_count
  const tot = parseFloat(data.value.today_sales_total) || 0
  return cnt > 0 ? (tot / cnt).toFixed(2) : 0
})

const shiftInitials = computed(() => {
  const name = data.value.open_shift?.user || ''
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

const catChartSeries = computed(() => [{
  name: 'Revenue',
  data: (data.value.sales_by_category || []).map(c => ({
    x: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
    y: parseFloat(c.total),
  })),
}])

const catChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    background: 'transparent',
    toolbar: { show: false },
    animations: { enabled: false },
    parentHeightOffset: 0,
  },
  plotOptions: {
    bar: { horizontal: true, barHeight: '52%', borderRadius: 4, distributed: true },
  },
  colors: CAT_COLORS,
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: {
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '11px', colors: ['var(--text-muted)'] },
      maxWidth: 90,
    },
  },
  grid: { show: false, padding: { left: 0, right: 8, top: -10, bottom: -10 } },
  tooltip: { y: { formatter: (v) => `$${Number(v).toLocaleString()}` } },
}))

// ── Data ────────────────────────────────────────────────────
async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/core/dashboard/')
    data.value = res.data
    tickerIdx.value = 0
  } catch {} finally {
    loading.value = false
  }
}

function fmtQty(v) { return formatQty ? formatQty(v) : Number(v).toFixed(0) }

function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'
}

function fmtETA(d) {
  if (!d) return '—'
  const eta  = new Date(d)
  const now  = new Date()
  const today    = new Date(now.getFullYear(),  now.getMonth(),  now.getDate())
  const etaDay   = new Date(eta.getFullYear(),  eta.getMonth(),  eta.getDate())
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (etaDay.getTime() === today.getTime())    return t('core.dash.today')
  if (etaDay.getTime() === tomorrow.getTime()) return t('core.dash.tomorrow')
  return eta.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

onMounted(() => { fetchData(); startTicker() })
onUnmounted(() => clearInterval(tickerTimer))
</script>

<style scoped>
/* ── Page ───────────────────────────────────────────────────── */
.dash-page { padding-top: 20px; }

/* ── AI Advice Strip ────────────────────────────────────────── */
.ai-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  height: 52px;
  background: var(--bg-card);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  margin-bottom: 14px;
  position: relative;
  overflow: hidden;
}
.dark .ai-strip {
  border-color: rgba(255,255,255,.07);
}
.ai-label         { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--text-muted); flex-shrink: 0; }
.ai-ticker-wrap   { flex: 1; overflow: hidden; position: relative; height: 24px; }
.ai-text          { position: absolute; inset: 0; display: flex; align-items: center; font-size: 15px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ai-dots          { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.ai-dot           { width: 5px; height: 5px; border-radius: 50%; background: var(--border); border: none; cursor: pointer; padding: 0; transition: background 200ms, transform 200ms; }
.ai-dot.active    { background: var(--accent); transform: scale(1.3); }
.ai-refresh       { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-app); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: color 120ms; }
.ai-refresh:hover { color: var(--text-primary); }
.ai-refresh.spinning svg { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Ticker transition */
.ticker-enter-active { transition: opacity .4s ease, transform .4s ease; }
.ticker-leave-active { transition: opacity .3s ease, transform .3s ease; position: absolute; }
.ticker-enter-from   { opacity: 0; transform: translateY(8px); }
.ticker-leave-to     { opacity: 0; transform: translateY(-8px); }

/* ── Grid ───────────────────────────────────────────────────── */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  grid-auto-rows: 220px;
  gap: 14px;
}

/* ── Card shell ─────────────────────────────────────────────── */
.dash-card {
  background: var(--bg-card);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 3px 14px rgba(0,0,0,.06);
  transition: box-shadow 220ms ease, transform 220ms ease;
}
.dash-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,.10);
  transform: translateY(-1px);
}
.dark .dash-card {
  border-color: rgba(255,255,255,.07);
  box-shadow: 0 3px 14px rgba(0,0,0,.25);
}
.dark .dash-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,.38);
}

/* ── Skeleton ───────────────────────────────────────────────── */
.skel { background: var(--border); animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }

/* ── Chips ──────────────────────────────────────────────────── */
.chip       { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 600; }
.chip-amber { background: rgba(245,158,11,.15); color: #92400e; }
.chip-red   { background: rgba(239,68,68,.12);  color: var(--danger); }
.chip-muted { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.dark .chip-amber { background: rgba(245,158,11,.20); color: #fbbf24; }
.dark .chip-red   { background: rgba(239,68,68,.18);  color: #f87171; }
.chip-link        { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }
.chip-link:hover  { text-decoration: underline; }

/* ── Panel header ───────────────────────────────────────────── */
.b-head  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-shrink: 0; }
.b-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }

/* ── Empty state ────────────────────────────────────────────── */
.b-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; padding: 20px; text-align: center; color: var(--text-muted); }
.b-empty span { font-size: 13px; font-weight: 500; }

/* ── Recent Sales list ──────────────────────────────────────── */
.sales-list     { display: flex; flex-direction: column; flex: 1; overflow: auto; margin: 0 -20px -18px; }
.sales-row      { display: flex; align-items: center; justify-content: space-between; padding: 9px 20px; border-bottom: 1px solid var(--border); transition: background 100ms; }
.sales-row:last-child { border-bottom: none; }
.sales-row:hover { background: var(--bg-app); }
.sales-info     { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; margin-right: 12px; }
.sales-num      { font-size: 10px; font-family: monospace; color: var(--text-muted); letter-spacing: .03em; }
.sales-customer { font-size: 13px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sales-right    { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.sales-amount   { font-size: 13px; font-weight: 700; color: var(--success); font-variant-numeric: tabular-nums; }
.sales-time     { font-size: 10px; color: var(--text-muted); }

/* ── Services list ──────────────────────────────────────────── */
.svc-list { display: flex; flex-direction: column; flex: 1; overflow: auto; margin: 0 -20px -18px; }
.svc-row  { display: flex; align-items: center; justify-content: space-between; padding: 9px 20px; border-bottom: 1px solid var(--border); transition: background 100ms; }
.svc-row:last-child { border-bottom: none; }
.svc-row:hover { background: var(--bg-app); }
.svc-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.svc-name { font-size: 13px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.svc-type { font-size: 11px; color: var(--text-muted); text-transform: capitalize; }
.svc-eta  { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; margin-left: 10px; }
.eta-day  { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.eta-time { font-size: 11px; color: var(--text-muted); }

/* ── Stock list ─────────────────────────────────────────────── */
.stock-list { display: flex; flex-direction: column; flex: 1; overflow: auto; margin: 0 -20px -18px; }
.stock-row  { display: flex; align-items: center; justify-content: space-between; padding: 9px 20px; border-bottom: 1px solid var(--border); transition: background 100ms; }
.stock-row:last-child { border-bottom: none; }
.stock-row:hover { background: var(--bg-app); }
.stock-name { font-size: 13px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; margin-right: 10px; }

/* ── Today's KPIs ───────────────────────────────────────────── */
.kpi-grid    { display: flex; align-items: center; justify-content: space-around; flex: 1; gap: 0; }
.kpi-item    { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
.kpi-val     { font-size: 17px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.kpi-lbl     { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--text-muted); }
.kpi-divider { width: 1px; height: 40px; background: var(--border); flex-shrink: 0; }

/* ── Shift Summary ──────────────────────────────────────────── */
.shift-body    { display: flex; flex-direction: column; flex: 1; gap: 12px; padding-top: 4px; }
.shift-avatar  { width: 40px; height: 40px; border-radius: 12px; background: var(--accent); color: #fff; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.shift-info    { display: flex; flex-direction: row; align-items: center; gap: 12px; }
.shift-cashier { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.shift-since   { font-size: 11px; color: var(--text-muted); margin-left: auto; }
.shift-stats   { display: flex; align-items: center; justify-content: space-around; background: var(--bg-app); border-radius: 12px; padding: 12px 16px; margin-top: auto; }
.shift-stat    { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.shift-stat-val { font-size: 16px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.shift-stat-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
.shift-stat-sep { width: 1px; height: 32px; background: var(--border); }

/* ── Customer Debt ──────────────────────────────────────────── */
.debt-amt { font-variant-numeric: tabular-nums; }

/* ── Top Sellers ────────────────────────────────────────────── */
.seller-list { display: flex; flex-direction: column; flex: 1; overflow: auto; margin: 0 -20px -18px; }
.seller-row  { display: flex; align-items: center; padding: 9px 20px; border-bottom: 1px solid var(--border); gap: 10px; transition: background 100ms; }
.seller-row:last-child { border-bottom: none; }
.seller-row:hover { background: var(--bg-app); }
.seller-rank { font-size: 11px; font-weight: 800; color: var(--text-muted); width: 16px; flex-shrink: 0; }
.seller-name { font-size: 13px; font-weight: 500; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.seller-qty  { font-size: 12px; font-weight: 700; color: var(--accent); flex-shrink: 0; }

/* ── Narrow screens ─────────────────────────────────────────── */
@media (max-width: 580px) {
  .dash-grid { grid-template-columns: 1fr; grid-auto-rows: auto; }
  .dash-card { min-height: 200px; }
}
</style>
