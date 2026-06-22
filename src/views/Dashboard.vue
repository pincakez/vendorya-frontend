<template>
  <div class="dash-page">

    <!-- ── AI Advice Strip ─────────────────────────────────── -->
    <div class="ai-strip">
      <span class="ai-label">V-Agent</span>
      <div class="ai-ticker-wrap">
        <Transition name="ticker">
          <p :key="tickerIdx" class="ai-text">{{ insights[tickerIdx] }}</p>
        </Transition>
      </div>
      <div class="ai-dots">
        <button v-for="(_, i) in insights" :key="i"
          class="ai-dot" :class="{ active: i === tickerIdx }" @click="tickerIdx = i" />
      </div>
      <button class="ai-refresh" @click="fetchData" :class="{ spinning: loading }">
        <RefreshCw :size="13" />
      </button>
    </div>

    <!-- ── Skeleton ────────────────────────────────────────── -->
    <div v-if="loading" class="dash-grid">
      <div v-for="i in 9" :key="i" class="dash-tile skel" />
    </div>

    <!-- ── Live widget grid ────────────────────────────────── -->
    <div v-else class="dash-grid">
      <div
        v-for="(id, i) in data.widgets" :key="id"
        class="dash-tile" :style="{ '--i': i }"
      >
        <DashboardWidget :id="id" :data="data" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw } from 'lucide-vue-next'
import api from '@/api/axios'
import DashboardWidget from '@/components/dashboard/DashboardWidget.vue'

const { t } = useI18n()
const loading = ref(false)

const data = ref({
  widgets:               [],
  today_sales_total:     0,
  today_invoices_count:  0,
  today_items_sold:      0,
  open_shift:            null,
  low_stock_count:       0,
  low_stock_items:       [],
  weekly_revenue:        [],
  daily_avg_revenue:     0,
  monthly_sales:         [],
  activity_feed:         [],
  recent_sales:          [],
  upcoming_services:     [],
})

// ── At-a-glance ticker ──────────────────────────────────────
const tickerIdx = ref(0)
let tickerTimer = null

const insights = computed(() => {
  const d = data.value
  const list = []
  const amt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(d.today_sales_total)
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

function fmtTime(x) {
  return x ? new Date(x).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'
}

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

onMounted(() => { fetchData(); startTicker() })
onUnmounted(() => clearInterval(tickerTimer))
</script>

<style scoped>
.dash-page { padding-top: 20px; }

/* ── AI Advice Strip ────────────────────────────────────────── */
.ai-strip {
  display: flex; align-items: center; gap: 14px;
  padding: 0 20px; height: 52px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 20px; margin-bottom: 16px; position: relative; overflow: hidden;
}
.ai-label       { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--text-muted); flex-shrink: 0; }
.ai-ticker-wrap { flex: 1; overflow: hidden; position: relative; height: 24px; }
.ai-text        { position: absolute; inset: 0; display: flex; align-items: center; font-size: 15px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ai-dots        { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.ai-dot         { width: 5px; height: 5px; border-radius: 50%; background: var(--border); border: none; cursor: pointer; padding: 0; transition: background 200ms, transform 200ms; }
.ai-dot.active  { background: var(--accent); transform: scale(1.3); }
.ai-refresh     { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-app); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: color 120ms; }
.ai-refresh:hover { color: var(--text-primary); }
.ai-refresh.spinning svg { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.ticker-enter-active { transition: opacity .4s ease, transform .4s ease; }
.ticker-leave-active { transition: opacity .3s ease, transform .3s ease; position: absolute; }
.ticker-enter-from   { opacity: 0; transform: translateY(8px); }
.ticker-leave-to     { opacity: 0; transform: translateY(-8px); }

/* ── Responsive flow grid — uniform tiles, reflow + push down ── */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 240px;
  gap: 16px;
}

/* ── Uniform tile ───────────────────────────────────────────── */
.dash-tile {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 3px 14px rgba(0,0,0,.06);
  transition: box-shadow 220ms ease, transform 220ms ease;
  /* iPhone-unlock entrance: staggered scale + fade, soft overshoot.
     `backwards` holds the hidden state during the delay, then hands back to
     normal styles so :hover still works. */
  animation: tilePop .5s cubic-bezier(.34, 1.42, .56, 1) backwards;
  animation-delay: calc(var(--i, 0) * 45ms);
}
.dash-tile:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,.10);
  transform: translateY(-2px);
}
.dark .dash-tile { box-shadow: 0 3px 14px rgba(0,0,0,.25); }
.dark .dash-tile:hover { box-shadow: 0 6px 24px rgba(0,0,0,.38); }

@keyframes tilePop {
  from { opacity: 0; transform: scale(.86) translateY(10px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .dash-tile { animation: none; }
}

/* skeleton */
.skel { animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }

@media (max-width: 560px) {
  .dash-grid { grid-template-columns: 1fr; }
}
</style>
