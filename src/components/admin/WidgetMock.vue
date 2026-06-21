<script setup>
/**
 * WidgetMock — static, hardcoded preview of each dashboard widget for the
 * Widget Gallery. No API, no store data — pure sample props so the widget
 * can be seen working at a glance. Selected by :id (matches WidgetGallery ids).
 */
defineProps({ id: { type: String, required: true } })

const ring = 'conic-gradient(var(--accent) 0% 68%, var(--border) 68% 100%)'
// non-reactive sample heat pattern (0–3 intensity)
const heatCells = [0,1,2,1,3,2,0, 1,2,3,2,1,0,1, 2,1,0,3,2,1,2, 0,2,1,2,3,1,0]
</script>

<template>
  <!-- At a Glance — animated sentence ticker -->
  <div v-if="id === 'at-a-glance'" class="wm wm-glance">
    <span class="wm-glance-label">V-Agent</span>
    <span class="wm-glance-text">You sold 18 items today — revenue is up 12% on yesterday.</span>
    <span class="wm-dots"><i class="on" /><i /><i /><i /></span>
  </div>

  <!-- Sales Chart — full-width bars -->
  <div v-else-if="id === 'sales-chart'" class="wm wm-bars">
    <span v-for="(h, i) in [40, 62, 48, 80, 55, 92, 70]" :key="i" class="wm-bar" :style="{ height: h + '%' }" />
  </div>

  <!-- Stock Health — color-coded chips -->
  <div v-else-if="id === 'stock-health'" class="wm wm-health">
    <span class="wm-chip wm-chip--ok">Healthy · 142</span>
    <span class="wm-chip wm-chip--warn">Low · 8</span>
    <span class="wm-chip wm-chip--bad">Out · 3</span>
    <span class="wm-chip wm-chip--warn">USB-C Cable</span>
    <span class="wm-chip wm-chip--bad">Mouse Pad</span>
  </div>

  <!-- Top Products — mini product cards -->
  <div v-else-if="id === 'top-products'" class="wm wm-products">
    <div v-for="(p, i) in [['Laptop Stand', 24], ['USB-C Hub', 19], ['Webcam', 15]]" :key="i" class="wm-prod">
      <div class="wm-prod-img">{{ i + 1 }}</div>
      <span class="wm-prod-name">{{ p[0] }}</span>
      <span class="wm-prod-qty">×{{ p[1] }}</span>
    </div>
  </div>

  <!-- Today's Sales — big KPI -->
  <div v-else-if="id === 'today-sales'" class="wm wm-kpi">
    <span class="wm-kpi-val">12,480 <small>EGP</small></span>
    <span class="wm-kpi-lbl">Revenue today</span>
    <span class="wm-kpi-sub">18 sales · avg 693</span>
  </div>

  <!-- Items & Shift — split panel -->
  <div v-else-if="id === 'items-shift'" class="wm wm-split">
    <div class="wm-split-half">
      <span class="wm-split-val">47</span>
      <span class="wm-split-lbl">Items sold</span>
    </div>
    <div class="wm-split-sep" />
    <div class="wm-split-half">
      <span class="wm-split-dot"><i /> Open</span>
      <span class="wm-split-lbl">Ahmed · 09:14</span>
    </div>
  </div>

  <!-- Recent Sales — mini table -->
  <div v-else-if="id === 'recent-sales'" class="wm wm-table">
    <div v-for="(r, i) in [['#1042', 'Walk-in', '480'], ['#1041', 'Mona S.', '1,250'], ['#1040', 'Walk-in', '95']]"
         :key="i" class="wm-tr">
      <span class="wm-td-num">{{ r[0] }}</span>
      <span class="wm-td-name">{{ r[1] }}</span>
      <span class="wm-td-amt">{{ r[2] }}</span>
    </div>
  </div>

  <!-- Upcoming Services — list -->
  <div v-else-if="id === 'services'" class="wm wm-list">
    <div v-for="(s, i) in [['Khaled M.', 'Screen repair', 'Today'], ['Sara A.', 'Battery swap', 'Tomorrow'], ['Omar T.', 'Diagnostics', 'Thu']]"
         :key="i" class="wm-li">
      <div class="wm-li-info"><span class="wm-li-name">{{ s[0] }}</span><span class="wm-li-sub">{{ s[1] }}</span></div>
      <span class="wm-li-eta">{{ s[2] }}</span>
    </div>
  </div>

  <!-- Low Stock — list with chips -->
  <div v-else-if="id === 'low-stock-list'" class="wm wm-list">
    <div v-for="(s, i) in [['USB-C Cable', 3, 'warn'], ['Mouse Pad', 0, 'bad'], ['HDMI Adapter', 2, 'warn']]"
         :key="i" class="wm-li">
      <span class="wm-li-name">{{ s[0] }}</span>
      <span class="wm-chip" :class="s[2] === 'bad' ? 'wm-chip--bad' : 'wm-chip--warn'">{{ s[1] }}</span>
    </div>
  </div>

  <!-- AI Insights — rotating recommendation -->
  <div v-else-if="id === 'ai-insights'" class="wm wm-ai">
    <span class="wm-ai-spark">✦</span>
    <p class="wm-ai-text">Restock <b>USB-C Cable</b> — it sold out twice this week and trends up.</p>
    <span class="wm-dots"><i class="on" /><i /><i /></span>
  </div>

  <!-- Activity Feed — event ticker -->
  <div v-else-if="id === 'activity-feed'" class="wm wm-feed">
    <div v-for="(f, i) in [['Sale #1042 posted', '2m'], ['Stock adjusted: +12', '9m'], ['Ahmed opened shift', '1h']]"
         :key="i" class="wm-feed-row">
      <span class="wm-feed-dot" />
      <span class="wm-feed-txt">{{ f[0] }}</span>
      <span class="wm-feed-time">{{ f[1] }}</span>
    </div>
  </div>

  <!-- Revenue Ring — circular gauge -->
  <div v-else-if="id === 'revenue-ring'" class="wm wm-ring">
    <div class="wm-ring-gauge" :style="{ background: ring }">
      <div class="wm-ring-hole"><span class="wm-ring-pct">68%</span></div>
    </div>
    <span class="wm-ring-lbl">vs daily average</span>
  </div>

  <!-- KPI Tile — single metric -->
  <div v-else-if="id === 'kpi-tile'" class="wm wm-tile">
    <span class="wm-tile-val">142</span>
    <span class="wm-tile-lbl">Active products</span>
  </div>

  <!-- Heat Calendar — sales heatmap -->
  <div v-else-if="id === 'heat-calendar'" class="wm wm-heat">
    <span v-for="(lvl, i) in heatCells" :key="i" class="wm-heat-cell" :data-lvl="lvl" />
  </div>

  <!-- fallback -->
  <div v-else class="wm wm-fallback">{{ id }}</div>
</template>

<style scoped>
.wm { width: 100%; height: 100%; display: flex; box-sizing: border-box; padding: 12px 14px; }

/* At a Glance */
.wm-glance { flex-direction: column; justify-content: center; gap: 8px; }
.wm-glance-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--text-muted); }
.wm-glance-text { font-size: 13px; font-weight: 500; color: var(--text-primary); line-height: 1.4; }
.wm-dots { display: flex; gap: 5px; }
.wm-dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--border); }
.wm-dots i.on { background: var(--accent); }

/* Sales Chart bars */
.wm-bars { align-items: flex-end; justify-content: space-between; gap: 8px; padding: 14px; }
.wm-bar { flex: 1; border-radius: 4px 4px 0 0; background: var(--accent); opacity: .85; min-height: 6px; }
.wm-bar:nth-child(even) { opacity: .55; }

/* Stock Health chips */
.wm-health { flex-wrap: wrap; align-content: center; gap: 7px; }
.wm-chip { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 7px; }
.wm-chip--ok   { background: var(--success-soft); color: var(--success); }
.wm-chip--warn { background: var(--warning-soft); color: var(--warning); }
.wm-chip--bad  { background: var(--danger-soft);  color: var(--danger); }

/* Top Products */
.wm-products { gap: 10px; align-items: stretch; }
.wm-prod { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 8px 4px; }
.wm-prod-img { width: 26px; height: 26px; border-radius: 8px; background: var(--accent-soft); color: var(--accent); font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.wm-prod-name { font-size: 10px; font-weight: 600; color: var(--text-primary); text-align: center; line-height: 1.2; }
.wm-prod-qty { font-size: 10px; font-weight: 700; color: var(--accent); }

/* KPI big */
.wm-kpi { flex-direction: column; justify-content: center; gap: 3px; }
.wm-kpi-val { font-size: 30px; font-weight: 800; color: var(--text-primary); line-height: 1; font-variant-numeric: tabular-nums; }
.wm-kpi-val small { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.wm-kpi-lbl { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
.wm-kpi-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

/* Items & Shift split */
.wm-split { align-items: center; gap: 0; }
.wm-split-half { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.wm-split-sep { width: 1px; align-self: stretch; background: var(--border); margin: 8px 0; }
.wm-split-val { font-size: 24px; font-weight: 800; color: var(--text-primary); }
.wm-split-lbl { font-size: 10px; color: var(--text-muted); font-weight: 600; }
.wm-split-dot { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--success); }
.wm-split-dot i { width: 7px; height: 7px; border-radius: 50%; background: var(--success); }

/* Recent Sales table */
.wm-table { flex-direction: column; justify-content: center; gap: 0; padding: 6px 0; }
.wm-tr { display: flex; align-items: center; gap: 10px; padding: 7px 14px; border-bottom: 1px solid var(--border); }
.wm-tr:last-child { border-bottom: none; }
.wm-td-num { font-size: 10px; font-family: monospace; color: var(--text-muted); }
.wm-td-name { flex: 1; font-size: 12px; color: var(--text-primary); }
.wm-td-amt { font-size: 12px; font-weight: 700; color: var(--success); }

/* List (services / low stock) */
.wm-list { flex-direction: column; justify-content: center; gap: 0; padding: 6px 0; }
.wm-li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 14px; border-bottom: 1px solid var(--border); }
.wm-li:last-child { border-bottom: none; }
.wm-li-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.wm-li-name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
.wm-li-sub { font-size: 10px; color: var(--text-muted); }
.wm-li-eta { font-size: 11px; font-weight: 600; color: var(--accent); }

/* AI Insights */
.wm-ai { flex-direction: column; justify-content: center; gap: 8px; }
.wm-ai-spark { font-size: 14px; color: var(--accent); }
.wm-ai-text { font-size: 12.5px; color: var(--text-primary); line-height: 1.45; margin: 0; }
.wm-ai-text b { color: var(--accent); }

/* Activity Feed */
.wm-feed { flex-direction: column; justify-content: center; gap: 0; padding: 6px 0; }
.wm-feed-row { display: flex; align-items: center; gap: 9px; padding: 7px 14px; }
.wm-feed-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.wm-feed-txt { flex: 1; font-size: 12px; color: var(--text-primary); }
.wm-feed-time { font-size: 10px; color: var(--text-muted); }

/* Revenue Ring */
.wm-ring { flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.wm-ring-gauge { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.wm-ring-hole { width: 52px; height: 52px; border-radius: 50%; background: var(--bg-app); display: flex; align-items: center; justify-content: center; }
.wm-ring-pct { font-size: 15px; font-weight: 800; color: var(--text-primary); }
.wm-ring-lbl { font-size: 10px; color: var(--text-muted); font-weight: 600; }

/* KPI tile small */
.wm-tile { flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.wm-tile-val { font-size: 28px; font-weight: 800; color: var(--accent); line-height: 1; }
.wm-tile-lbl { font-size: 10px; color: var(--text-muted); font-weight: 600; text-align: center; }

/* Heat Calendar */
.wm-heat { align-items: center; justify-content: center; }
.wm-heat { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 12px; }
.wm-heat-cell { aspect-ratio: 1; border-radius: 3px; background: var(--border); }
.wm-heat-cell[data-lvl="1"] { background: rgba(247,143,30,.30); }
.wm-heat-cell[data-lvl="2"] { background: rgba(247,143,30,.60); }
.wm-heat-cell[data-lvl="3"] { background: var(--accent); }

/* fallback */
.wm-fallback { align-items: center; justify-content: center; font-size: 12px; color: var(--text-muted); opacity: .5; }
</style>
