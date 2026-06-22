<script setup>
/**
 * DashboardWidget — renders one live dashboard widget by id, fed the full
 * dashboard payload. One uniform tile size; long content scrolls inside.
 * The selectable catalog lives in core/dashboard_widgets.py + WidgetGallery.vue.
 */
import { computed } from 'vue'
import { ShoppingBag, Briefcase, CheckCircle, Activity } from 'lucide-vue-next'
import Money from '@/components/ui/Money.vue'
import WeekRevenueChart from '@/components/dashboard/WeekRevenueChart.vue'
import { formatQty } from '@/utils/format'

const props = defineProps({
  id:   { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const d = computed(() => props.data || {})

/* today-sales */
const avgTicket = computed(() => {
  const cnt = d.value.today_invoices_count || 0
  const tot = parseFloat(d.value.today_sales_total) || 0
  return cnt > 0 ? (tot / cnt) : 0
})

/* stock-health */
const stockOut = computed(() => (d.value.low_stock_items || []).filter(i => Number(i.quantity) === 0).length)
const stockLow = computed(() => Math.max((d.value.low_stock_count || 0) - stockOut.value, 0))

/* revenue-ring */
const ringPct = computed(() => {
  const avg = parseFloat(d.value.daily_avg_revenue) || 0
  const today = parseFloat(d.value.today_sales_total) || 0
  if (avg <= 0) return 0
  return Math.round((today / avg) * 100)
})
const ringStyle = computed(() => {
  const deg = Math.min(ringPct.value, 100) * 3.6
  return { background: `conic-gradient(var(--accent) 0deg ${deg}deg, var(--border) ${deg}deg 360deg)` }
})

/* heat-calendar */
const heatMax = computed(() => Math.max(1, ...(d.value.monthly_sales || []).map(x => parseFloat(x.total) || 0)))
function heatLevel(total) {
  const v = parseFloat(total) || 0
  if (v <= 0) return 0
  const r = v / heatMax.value
  return r > 0.66 ? 3 : r > 0.33 ? 2 : 1
}

/* time helpers */
function fmtTime(x) {
  return x ? new Date(x).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'
}
function fmtETA(x) {
  if (!x) return '—'
  const eta = new Date(x), now = new Date()
  const day = (z) => new Date(z.getFullYear(), z.getMonth(), z.getDate())
  const t = day(now), e = day(eta), tm = new Date(t); tm.setDate(tm.getDate() + 1)
  if (e.getTime() === t.getTime())  return 'Today'
  if (e.getTime() === tm.getTime()) return 'Tomorrow'
  return eta.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
function fmtAgo(x) {
  if (!x) return ''
  const s = Math.max(0, (Date.now() - new Date(x).getTime()) / 1000)
  if (s < 60)    return `${Math.floor(s)}s`
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}
function fmtQty(v) { return formatQty ? formatQty(v) : Number(v).toFixed(0) }
</script>

<template>
  <!-- Today's Sales -->
  <template v-if="id === 'today-sales'">
    <div class="w-head"><span class="w-title">Today</span></div>
    <div class="kpi-grid">
      <div class="kpi-item"><span class="kpi-val"><Money :value="d.today_sales_total" /></span><span class="kpi-lbl">Revenue</span></div>
      <div class="kpi-divider" />
      <div class="kpi-item"><span class="kpi-val">{{ d.today_invoices_count || 0 }}</span><span class="kpi-lbl">Sales</span></div>
      <div class="kpi-divider" />
      <div class="kpi-item"><span class="kpi-val"><Money :value="avgTicket" /></span><span class="kpi-lbl">Avg Ticket</span></div>
    </div>
  </template>

  <!-- Weekly Revenue (self-headed) -->
  <WeekRevenueChart v-else-if="id === 'weekly-revenue'" :data="d.weekly_revenue" />

  <!-- Recent Sales -->
  <template v-else-if="id === 'recent-sales'">
    <div class="w-head"><span class="w-title">Recent Sales</span><router-link to="/finance/invoices" class="w-link">View all</router-link></div>
    <div v-if="!d.recent_sales?.length" class="w-empty"><ShoppingBag :size="26" /><span>No sales yet</span></div>
    <div v-else class="w-scroll">
      <div v-for="inv in d.recent_sales.slice(0,6)" :key="inv.id" class="row-line">
        <div class="rl-info"><span class="rl-sub">{{ inv.invoice_number }}</span><span class="rl-name">{{ inv.customer }}</span></div>
        <div class="rl-right"><span class="rl-amt"><Money :value="inv.grand_total" /></span><span class="rl-time">{{ fmtTime(inv.date) }}</span></div>
      </div>
    </div>
  </template>

  <!-- Low Stock -->
  <template v-else-if="id === 'low-stock-list'">
    <div class="w-head"><span class="w-title">Low Stock Items</span><router-link to="/inventory/products" class="w-link">View</router-link></div>
    <div v-if="!d.low_stock_items?.length" class="w-empty"><CheckCircle :size="26" /><span>All healthy</span></div>
    <div v-else class="w-scroll">
      <div v-for="(it,i) in d.low_stock_items.slice(0,6)" :key="i" class="row-line">
        <span class="rl-name">{{ it.product_name }}</span>
        <span class="chip" :class="Number(it.quantity)===0 ? 'chip-red' : 'chip-amber'">{{ it.quantity }}</span>
      </div>
    </div>
  </template>

  <!-- Upcoming Services -->
  <template v-else-if="id === 'services'">
    <div class="w-head"><span class="w-title">Upcoming Services</span><router-link v-if="d.upcoming_services?.length" to="/services" class="w-link">View</router-link></div>
    <div v-if="!d.upcoming_services?.length" class="w-empty"><Briefcase :size="26" /><span>No upcoming services</span></div>
    <div v-else class="w-scroll">
      <div v-for="svc in d.upcoming_services.slice(0,5)" :key="svc.id" class="row-line">
        <div class="rl-info"><span class="rl-name">{{ svc.client_name }}</span><span class="rl-sub">{{ svc.service_type }}</span></div>
        <div class="rl-right"><span class="rl-eta">{{ fmtETA(svc.eta_datetime) }}</span><span class="rl-time">{{ fmtTime(svc.eta_datetime) }}</span></div>
      </div>
    </div>
  </template>

  <!-- Stock Health -->
  <template v-else-if="id === 'stock-health'">
    <div class="w-head"><span class="w-title">Stock Health</span></div>
    <div class="health-summary">
      <span class="chip chip-amber">Low · {{ stockLow }}</span>
      <span class="chip chip-red">Out · {{ stockOut }}</span>
    </div>
    <div v-if="!d.low_stock_items?.length" class="w-empty"><CheckCircle :size="26" /><span>Everything in stock</span></div>
    <div v-else class="health-chips">
      <span v-for="(it,i) in d.low_stock_items.slice(0,8)" :key="i"
        class="chip" :class="Number(it.quantity)===0 ? 'chip-red' : 'chip-amber'">{{ it.product_name }}</span>
    </div>
  </template>

  <!-- Revenue Ring -->
  <template v-else-if="id === 'revenue-ring'">
    <div class="w-head"><span class="w-title">Revenue Ring</span></div>
    <div class="ring-wrap">
      <div class="ring-gauge" :style="ringStyle"><div class="ring-hole"><span class="ring-pct">{{ ringPct }}%</span></div></div>
      <span class="ring-lbl">today vs daily average</span>
    </div>
  </template>

  <!-- Activity Feed -->
  <template v-else-if="id === 'activity-feed'">
    <div class="w-head"><span class="w-title">Activity Feed</span></div>
    <div v-if="!d.activity_feed?.length" class="w-empty"><Activity :size="26" /><span>No recent activity</span></div>
    <div v-else class="w-scroll">
      <div v-for="(a,i) in d.activity_feed" :key="i" class="feed-row">
        <span class="feed-dot" />
        <span class="feed-txt">{{ a.action }}</span>
        <span class="feed-time">{{ fmtAgo(a.time) }}</span>
      </div>
    </div>
  </template>

  <!-- Heat Calendar -->
  <template v-else-if="id === 'heat-calendar'">
    <div class="w-head"><span class="w-title">Sales this month</span></div>
    <div class="heat-grid">
      <span v-for="(c,i) in d.monthly_sales" :key="i" class="heat-cell" :data-lvl="heatLevel(c.total)" :title="`${c.date}: ${c.total}`" />
    </div>
  </template>

  <div v-else class="w-empty"><span>{{ id }}</span></div>
</template>

<style scoped>
/* header */
.w-head  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-shrink: 0; }
.w-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.w-link  { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }
.w-link:hover { text-decoration: underline; }

/* empty */
.w-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-muted); text-align: center; }
.w-empty span { font-size: 13px; font-weight: 500; }

/* scroll list */
.w-scroll { display: flex; flex-direction: column; flex: 1; overflow: auto; margin: 0 -18px -16px; }
.row-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 18px; border-bottom: 1px solid var(--border); }
.row-line:last-child { border-bottom: none; }
.rl-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.rl-name { font-size: 13px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rl-sub  { font-size: 10px; font-family: monospace; color: var(--text-muted); }
.rl-right{ display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0; }
.rl-amt  { font-size: 13px; font-weight: 700; color: var(--success); }
.rl-time { font-size: 10px; color: var(--text-muted); }
.rl-eta  { font-size: 12px; font-weight: 600; color: var(--accent); }

/* KPI */
.kpi-grid { display: flex; align-items: center; justify-content: space-around; flex: 1; }
.kpi-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
.kpi-val  { font-size: 17px; font-weight: 800; color: var(--text-primary); white-space: nowrap; }
.kpi-lbl  { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--text-muted); }
.kpi-divider { width: 1px; height: 38px; background: var(--border); flex-shrink: 0; }

/* chips */
.chip { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 600; }
.chip-amber { background: var(--warning-soft); color: var(--warning); }
.chip-red   { background: var(--danger-soft);  color: var(--danger); }

/* stock health */
.health-summary { display: flex; gap: 8px; margin-bottom: 10px; flex-shrink: 0; }
.health-chips { display: flex; flex-wrap: wrap; gap: 7px; align-content: flex-start; overflow: auto; flex: 1; }

/* revenue ring */
.ring-wrap  { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
.ring-gauge { width: 96px; height: 96px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.ring-hole  { width: 70px; height: 70px; border-radius: 50%; background: var(--bg-card); display: flex; align-items: center; justify-content: center; }
.ring-pct   { font-size: 19px; font-weight: 800; color: var(--text-primary); }
.ring-lbl   { font-size: 11px; color: var(--text-muted); font-weight: 600; }

/* activity feed */
.feed-row  { display: flex; align-items: center; gap: 9px; padding: 8px 18px; }
.feed-dot  { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.feed-txt  { flex: 1; font-size: 12.5px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feed-time { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }

/* heat calendar */
.heat-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; flex: 1; align-content: center; }
.heat-cell { aspect-ratio: 1; border-radius: 4px; background: var(--border); }
.heat-cell[data-lvl="1"] { background: color-mix(in srgb, var(--accent) 30%, transparent); }
.heat-cell[data-lvl="2"] { background: color-mix(in srgb, var(--accent) 60%, transparent); }
.heat-cell[data-lvl="3"] { background: var(--accent); }
</style>
