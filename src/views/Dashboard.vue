<template>
  <div class="dash-page">

    <!-- Skeleton -->
    <div v-if="loading" class="dash-grid">
      <div class="dash-b0 skel" />
      <div class="dash-b1 skel" />
      <div class="dash-b2 skel" />
      <div class="dash-b3 skel" />
      <div class="dash-b4 skel" />
      <div class="dash-b5 skel" />
      <div class="dash-b6 skel" />
      <div class="dash-b7 skel" />

    </div>

    <!-- Live grid -->
    <div v-else class="dash-grid">

      <!-- B0: At a Glance ticker ─ full width, short strip -->
      <div class="dash-b0 b0-strip intersect:motion-preset-fade intersect-once">
        <span class="b0-label">{{ t('core.dash.at_glance') }}</span>
        <div class="b0-ticker-wrap">
          <Transition name="ticker">
            <p :key="tickerIdx" class="b0-text">{{ insights[tickerIdx] }}</p>
          </Transition>
        </div>
        <div class="b0-dots">
          <button v-for="(_, i) in insights" :key="i"
            class="b0-dot" :class="{ active: i === tickerIdx }"
            @click="tickerIdx = i" />
        </div>
        <button class="b0-refresh" @click="fetchData" :class="{ spinning: loading }">
          <RefreshCw :size="13" />
        </button>
      </div>

      <!-- B1: Today's Sales ─ 5 cols -->
      <div class="dash-b1 b-card intersect:motion-preset-slide-left intersect:motion-delay-[100ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="kpi-tag">{{ t('core.dash.today_sales') }}</div>
        <div class="kpi-num"><Money :value="data.today_sales_total" /></div>
        <div class="kpi-sub">{{ t('core.dash.invoices', { n: data.today_invoices_count }, data.today_invoices_count) }}</div>
        <div class="kpi-progress">
          <div class="kpi-bar kpi-bar-green" />
        </div>
      </div>

      <!-- B2: Items Sold + Shift ─ 10 cols -->
      <div class="dash-b2 b-card intersect:motion-preset-slide-left intersect:motion-delay-[200ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b2-split">
          <div class="b2-half">
            <div class="kpi-tag">{{ t('core.dash.items_sold') }}</div>
            <div class="kpi-num kpi-num--md">{{ formatQty(data.today_items_sold) }}</div>
            <div class="kpi-sub">{{ t('core.dash.units_today') }}</div>
          </div>
          <div class="b2-rule" />
          <div class="b2-half">
            <div class="kpi-tag">{{ t('core.dash.shift') }}</div>
            <div class="shift-badge" :class="data.open_shift ? 'shift-open' : 'shift-closed'">
              <span v-if="data.open_shift" class="shift-pulse" />
              {{ data.open_shift ? t('core.dash.open') : t('core.dash.closed') }}
            </div>
            <div class="kpi-sub" v-if="data.open_shift">{{ t('core.dash.since', { t: fmtTime(data.open_shift.start_time) }) }}</div>
            <div class="kpi-sub" v-else>{{ t('core.dash.no_shift') }}</div>
          </div>
        </div>
      </div>

      <!-- B3: Stock Health ─ 15 cols -->
      <div class="dash-b3 b-card intersect:motion-preset-slide-left intersect:motion-delay-[300ms] intersect:motion-ease-spring-bouncier intersect-once"
           :class="data.low_stock_count > 0 ? 'b-card--warn' : 'b-card--ok'">
        <div class="b3-head">
          <div class="kpi-tag">{{ t('core.dash.stock_health') }}</div>
          <router-link to="/inventory/products" class="chip-link">{{ t('core.dash.view') }}</router-link>
        </div>
        <div class="b3-inv">
          <div class="b3-inv-tag">{{ t('core.dash.inv_value') }}</div>
          <div class="b3-inv-num"><Money :value="data.inventory_value_total" /></div>
          <div v-if="Number(data.inventory_value_storage) > 0" class="b3-inv-sub">
            {{ t('core.dash.incl_storage') }} <Money :value="data.inventory_value_storage" />
          </div>
        </div>
        <div v-if="data.low_stock_count === 0" class="b3-ok">
          <CheckCircle :size="16" /> {{ t('core.dash.all_healthy') }}
        </div>
        <div v-else>
          <div class="b3-count">{{ data.low_stock_count }} <span class="b3-count-sub">{{ t('core.dash.items_low') }}</span></div>
          <div class="chip-row">
            <span v-for="item in data.low_stock_items.slice(0, 5)" :key="item.sku"
              class="chip" :class="Number(item.quantity) === 0 ? 'chip-red' : 'chip-amber'">
              {{ item.product_name }} &middot; {{ item.quantity }}
            </span>
          </div>
        </div>
      </div>

      <!-- B4: Recent Sales ─ full width -->
      <div class="dash-b4 b-card intersect:motion-preset-fade intersect:motion-delay-[200ms] intersect-once">
        <div class="b-head">
          <span class="b-title">{{ t('core.dash.recent_sales') }}</span>
          <router-link to="/finance/invoices" class="chip-link">{{ t('core.dash.view_all') }}</router-link>
        </div>
        <div class="b-table-wrap">
          <table class="b-table">
            <thead>
              <tr>
                <th>#</th><th>{{ t('core.dash.col_customer') }}</th><th>{{ t('core.dash.col_total') }}</th><th>{{ t('core.dash.col_time') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!data.recent_sales?.length">
                <td colspan="4">
                  <div class="b-empty">
                    <ShoppingBag :size="28" /><span>{{ t('core.dash.no_sales') }}</span>
                  </div>
                </td>
              </tr>
              <tr v-for="inv in data.recent_sales" :key="inv.id" class="b-row">
                <td class="c-mono">{{ inv.invoice_number }}</td>
                <td>{{ inv.customer }}</td>
                <td class="c-green"><Money :value="inv.grand_total" /></td>
                <td class="c-muted">{{ fmtTime(inv.date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- B5: Upcoming Services ─ 10 cols -->
      <div class="dash-b5 b-card intersect:motion-preset-slide-left intersect:motion-delay-[100ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">{{ t('core.dash.upcoming_services') }}</span>
          <router-link v-if="data.upcoming_services?.length" to="/services" class="chip-link">{{ t('core.dash.view') }}</router-link>
        </div>
        <div v-if="!data.upcoming_services?.length" class="b-empty">
          <Briefcase :size="28" /><span>{{ t('core.dash.no_services') }}</span>
        </div>
        <div v-else class="svc-list">
          <div v-for="svc in data.upcoming_services.slice(0, 5)" :key="svc.id" class="svc-row">
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

      <!-- B6: Low Stock Detail ─ 10 cols -->
      <div class="dash-b6 b-card intersect:motion-preset-slide-left intersect:motion-delay-[200ms] intersect:motion-ease-spring-bouncier intersect-once">
        <div class="b-head">
          <span class="b-title">{{ t('core.dash.low_stock_items') }}</span>
          <router-link to="/inventory/products" class="chip-link">{{ t('core.dash.view') }}</router-link>
        </div>
        <div v-if="!data.low_stock_items?.length" class="b-empty">
          <CheckCircle :size="28" /><span>{{ t('core.dash.all_healthy') }}</span>
        </div>
        <div v-else class="stock-list">
          <div v-for="(item, i) in data.low_stock_items.slice(0, 6)" :key="i" class="stock-row">
            <span class="stock-name">{{ item.product_name }}</span>
            <span class="chip" :class="Number(item.quantity) === 0 ? 'chip-red' : 'chip-amber'">
              {{ item.quantity }}
            </span>
          </div>
        </div>
      </div>

      <!-- B7: V-Agent AI Insights ─ 10 cols -->
      <div class="dash-b7 b-card intersect:motion-preset-slide-left intersect:motion-delay-[300ms] intersect:motion-ease-spring-bouncier intersect-once" style="padding:0;overflow:hidden;">
        <VAInsights />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, ShoppingBag, CheckCircle, Briefcase } from 'lucide-vue-next'
import api from '@/api/axios'
import { formatQty } from '@/utils/format'
import Money from '@/components/ui/Money.vue'
import VAInsights from '@/components/dashboard/VAInsights.vue'

const { t } = useI18n()
const loading = ref(false)

const data = ref({
  today_sales_total:    0,
  today_invoices_count: 0,
  today_items_sold:     0,
  open_shift:           null,
  low_stock_count:      0,
  low_stock_items:      [],
  inventory_value_active:  0,
  inventory_value_storage: 0,
  inventory_value_total:   0,
  recent_sales:         [],
  upcoming_services:    [],
})

// ── At a Glance ticker ──────────────────────────────────────
const tickerIdx = ref(0)
let tickerTimer = null

const insights = computed(() => {
  const d = data.value
  const list = []
  const amt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.today_sales_total)
  if (d.today_invoices_count > 0)
    list.push(t('core.dash.ins_today', { n: d.today_invoices_count, amt }))
  if (d.today_items_sold > 0)
    list.push(t('core.dash.ins_units', { n: d.today_items_sold }))
  if (d.open_shift)
    list.push(t('core.dash.ins_shift', { t: fmtTime(d.open_shift.start_time), user: d.open_shift.user }))
  if (d.low_stock_count > 0)
    list.push(t('core.dash.ins_restock', { n: d.low_stock_count }))
  if (d.upcoming_services?.length)
    list.push(t('core.dash.ins_services', { n: d.upcoming_services.length }))
  if (list.length === 0)
    list.push(t('core.dash.ins_caught_up'))
  return list
})

function startTicker() {
  tickerTimer = setInterval(() => {
    tickerIdx.value = (tickerIdx.value + 1) % insights.value.length
  }, 5000)
}

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

function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'
}

function fmtETA(d) {
  if (!d) return '—'
  const eta = new Date(d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const etaDay = new Date(eta.getFullYear(), eta.getMonth(), eta.getDate())
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (etaDay.getTime() === today.getTime()) return t('core.dash.today')
  if (etaDay.getTime() === tomorrow.getTime()) return t('core.dash.tomorrow')
  return eta.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

onMounted(() => { fetchData(); startTicker() })
onUnmounted(() => clearInterval(tickerTimer))
</script>

<style scoped>
/* ── Page ───────────────────────────────────────────────────── */
.dash-page { padding-top: 20px; }

/* ── Grid ───────────────────────────────────────────────────── */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  grid-auto-rows: 20px;
  gap: 10px;
  container-type: inline-size;
}

.dash-b0 { grid-column: span 30; grid-row: span 4;  }
.dash-b1 { grid-column: span 5;  grid-row: span 9;  }
.dash-b2 { grid-column: span 10; grid-row: span 9;  }
.dash-b3 { grid-column: span 15; grid-row: span 9;  }
.dash-b4 { grid-column: span 30; grid-row: span 18; }
.dash-b5 { grid-column: span 10; grid-row: span 16; }
.dash-b6 { grid-column: span 10; grid-row: span 16; }
.dash-b7 { grid-column: span 10; grid-row: span 16; }

@container (max-width: 1100px) {
  .dash-b1, .dash-b2, .dash-b3,
  .dash-b5, .dash-b6, .dash-b7 { grid-column: span 30; }
}

/* ── Skeleton ───────────────────────────────────────────────── */
.skel {
  background: var(--border);
  border-radius: 16px;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }

/* ── Base card ──────────────────────────────────────────────── */
.b-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.b-card--warn { border-color: rgba(245,158,11,.35); background: linear-gradient(135deg, rgba(245,158,11,.05), transparent 60%); }
.b-card--ok   { border-color: rgba(34,197,94,.25); }
.b-card--dim  { border-style: dashed; opacity: .65; }

/* ── KPI atoms ──────────────────────────────────────────────── */
.kpi-tag  { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-muted); margin-bottom: 6px; }
.kpi-num  { font-size: 30px; font-weight: 800; color: var(--text-primary); line-height: 1.1; font-variant-numeric: tabular-nums; }
.kpi-num--md { font-size: 22px; }
.kpi-sub  { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-weight: 500; }
.kpi-progress { margin-top: auto; padding-top: 12px; }
.kpi-bar  { height: 3px; border-radius: 99px; width: 100%; }
.kpi-bar-green { background: linear-gradient(90deg, var(--success) 0%, var(--accent) 100%); animation: bar-in .8s ease forwards; transform-origin: left; }
@keyframes bar-in { from { transform: scaleX(0) } to { transform: scaleX(1) } }

/* ── B0: Ticker strip ───────────────────────────────────────── */
.b0-strip {
  background: linear-gradient(135deg, rgba(247,143,30,.12) 0%, rgba(247,143,30,.04) 50%, transparent 100%);
  border: 1px solid rgba(247,143,30,.22);
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  overflow: hidden;
  position: relative;
}
.dark .b0-strip { background: linear-gradient(135deg, rgba(247,143,30,.10) 0%, rgba(247,143,30,.03) 60%, transparent 100%); }
.b0-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--accent); flex-shrink: 0; }
.b0-ticker-wrap { flex: 1; overflow: hidden; position: relative; height: 24px; }
.b0-text { position: absolute; inset: 0; display: flex; align-items: center; font-size: 13.5px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.b0-dots { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.b0-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border); border: none; cursor: pointer; padding: 0; transition: background 200ms, transform 200ms; }
.b0-dot.active { background: var(--accent); transform: scale(1.3); }
.b0-refresh { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: color 120ms; }
.b0-refresh:hover { color: var(--text-primary); }
.b0-refresh.spinning svg { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Ticker transition */
.ticker-enter-active { transition: opacity .4s ease, transform .4s ease; }
.ticker-leave-active { transition: opacity .3s ease, transform .3s ease; position: absolute; }
.ticker-enter-from   { opacity: 0; transform: translateY(8px); }
.ticker-leave-to     { opacity: 0; transform: translateY(-8px); }

/* ── B2: Split ──────────────────────────────────────────────── */
.b2-split { display: flex; align-items: stretch; height: 100%; gap: 0; }
.b2-half  { flex: 1; display: flex; flex-direction: column; }
.b2-rule  { width: 1px; background: var(--border); margin: 0 18px; flex-shrink: 0; }

.shift-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; margin-top: 6px; margin-bottom: 4px; }
.shift-open   { color: var(--success); }
.shift-closed { color: var(--text-muted); }
.shift-pulse  { width: 8px; height: 8px; border-radius: 50%; background: var(--success); animation: pulse 1.8s ease-out infinite; flex-shrink: 0; }
@keyframes pulse {
  0%  { box-shadow: 0 0 0 0 rgba(22,163,74,.5); }
  70% { box-shadow: 0 0 0 7px rgba(22,163,74,0); }
  100%{ box-shadow: 0 0 0 0 rgba(22,163,74,0); }
}

/* ── B3: Stock ──────────────────────────────────────────────── */
.b3-head  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.b3-ok    { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--success); margin-top: 6px; }
.b3-count { font-size: 26px; font-weight: 800; color: var(--warning); margin: 2px 0 6px; line-height: 1; }
.b3-count-sub { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.b3-inv { padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid var(--border); }
.b3-inv-tag { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-muted); margin-bottom: 3px; }
.b3-inv-num { font-size: 24px; font-weight: 800; color: var(--text-primary); line-height: 1.1; font-variant-numeric: tabular-nums; }
.b3-inv-sub { font-size: 11.5px; color: var(--text-muted); margin-top: 3px; font-weight: 500; }
.chip-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }

/* ── Chips ──────────────────────────────────────────────────── */
.chip       { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 600; }
.chip-amber { background: rgba(245,158,11,.15); color: #92400e; }
.chip-red   { background: rgba(239,68,68,.12);  color: var(--danger); }
.dark .chip-amber { background: rgba(245,158,11,.20); color: #fbbf24; }
.dark .chip-red   { background: rgba(239,68,68,.18);  color: #f87171; }
.chip-link  { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }
.chip-link:hover { text-decoration: underline; }

/* ── Shared panel header ────────────────────────────────────── */
.b-head  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-shrink: 0; }
.b-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }

/* ── Table ──────────────────────────────────────────────────── */
.b-table-wrap { overflow: auto; flex: 1; margin: 0 -20px -18px; }
.b-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.b-table thead th { padding: 8px 16px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--text-secondary); background: var(--bg-app); border-bottom: 1px solid var(--border); white-space: nowrap; }
.b-row { border-bottom: 1px solid var(--border); transition: background 100ms; }
.b-row:last-child { border-bottom: none; }
.b-row:hover { background: var(--bg-app); }
.b-table td { padding: 10px 16px; color: var(--text-primary); }
.c-mono  { font-family: monospace; font-size: 12px; color: var(--text-muted); }
.c-muted { color: var(--text-muted); font-size: 12px; }
.c-green { color: var(--success); font-weight: 600; font-variant-numeric: tabular-nums; }

/* ── Empty state ────────────────────────────────────────────── */
.b-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; padding: 24px; text-align: center; color: var(--text-muted); }
.b-empty span { font-size: 13px; font-weight: 500; }

/* ── Services list ──────────────────────────────────────────── */
.svc-list { display: flex; flex-direction: column; gap: 0; flex: 1; overflow: auto; margin: 0 -20px -18px; }
.svc-row  { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid var(--border); transition: background 100ms; }
.svc-row:last-child { border-bottom: none; }
.svc-row:hover { background: var(--bg-app); }
.svc-info  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.svc-name  { font-size: 13px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.svc-type  { font-size: 11px; color: var(--text-muted); text-transform: capitalize; }
.svc-eta   { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; margin-left: 10px; }
.eta-day   { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.eta-time  { font-size: 11px; color: var(--text-muted); }

/* ── Stock list ─────────────────────────────────────────────── */
.stock-list { display: flex; flex-direction: column; gap: 0; flex: 1; overflow: auto; margin: 0 -20px -18px; }
.stock-row  { display: flex; align-items: center; justify-content: space-between; padding: 9px 20px; border-bottom: 1px solid var(--border); transition: background 100ms; }
.stock-row:last-child { border-bottom: none; }
.stock-row:hover { background: var(--bg-app); }
.stock-name { font-size: 13px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; margin-right: 10px; }

/* ── Placeholder ────────────────────────────────────────────── */
.placeholder-wrap  { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; text-align: center; padding: 16px; }
.placeholder-icon  { color: var(--text-muted); opacity: .5; }
.placeholder-title { font-size: 14px; font-weight: 700; color: var(--text-muted); margin: 0; }
.placeholder-sub   { font-size: 12px; color: var(--text-muted); opacity: .7; margin: 0; }
</style>
