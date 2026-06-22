<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h1 class="page-title">Widget Gallery</h1>
        <p class="page-sub">Tick a widget to put it on every store's dashboard. Up to {{ max }} at a time.</p>
      </div>
      <div class="wg-counter" :class="{ full: atCap }">
        <LayoutGrid :size="15" />
        <span><b>{{ selected.length }}</b> / {{ max }} on the dashboard</span>
        <span v-if="saving" class="wg-saving">saving…</span>
      </div>
    </div>

    <div v-if="loading" class="wg-grid">
      <div v-for="i in 9" :key="i" class="wg-card wg-card--skel" />
    </div>

    <div v-else class="wg-grid">
      <div
        v-for="w in widgets" :key="w.id"
        class="wg-card"
        :class="{
          selected: isSelected(w.id),
          draft: w.draft,
          locked: !w.draft && atCap && !isSelected(w.id),
        }"
        @click="toggle(w)"
      >
        <!-- select control -->
        <div v-if="!w.draft" class="wg-check" :class="{ on: isSelected(w.id) }">
          <Check v-if="isSelected(w.id)" :size="13" />
        </div>
        <div v-else class="wg-lock"><Lock :size="11" /> Draft</div>

        <div class="wg-preview"><WidgetMock :id="w.id" /></div>

        <div class="wg-meta">
          <span class="wg-name">{{ w.name }}</span>
          <span class="wg-desc">{{ w.desc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { LayoutGrid, Check, Lock } from 'lucide-vue-next'
import WidgetMock from '@/components/admin/WidgetMock.vue'
import api from '@/api/axios'

// Catalog widgets (selectable) first, then drafts (catalogued, not yet selectable).
const widgets = [
  { id: 'today-sales',    name: "Today's Sales",     desc: 'Daily revenue total with invoice count.' },
  { id: 'weekly-revenue', name: 'Weekly Revenue',    desc: 'Last 7 days of revenue as a smooth area chart.' },
  { id: 'recent-sales',   name: 'Recent Sales',      desc: 'A table of the latest invoices — customer and amount.' },
  { id: 'low-stock-list', name: 'Low Stock Items',   desc: 'Items below their reorder level, colored by severity.' },
  { id: 'services',       name: 'Upcoming Services', desc: 'Next services with client name and ETA.' },
  { id: 'stock-health',   name: 'Stock Health',      desc: 'Stock status at a glance — healthy / low / out chips.' },
  { id: 'revenue-ring',   name: 'Revenue Ring',      desc: "Circular gauge — today's revenue vs daily average." },
  { id: 'activity-feed',  name: 'Activity Feed',     desc: 'Live ticker of recent store events.' },
  { id: 'heat-calendar',  name: 'Heat Calendar',     desc: 'Daily sales heatmap for the current month.' },
  // ── drafts (not selectable yet) ──
  { id: 'at-a-glance', draft: true, name: 'At a Glance',  desc: 'Animated sentence ticker of daily insights.' },
  { id: 'sales-chart', draft: true, name: 'Sales Chart',  desc: 'Full bar chart — revenue over a chosen period.' },
  { id: 'top-products',draft: true, name: 'Top Products', desc: 'Carousel of best sellers with ranks.' },
  { id: 'items-shift', draft: true, name: 'Items & Shift',desc: 'Units sold today plus live shift status.' },
  { id: 'ai-insights', draft: true, name: 'AI Insights',  desc: 'Rotating AI recommendations from your data.' },
  { id: 'kpi-tile',    draft: true, name: 'KPI Tile',     desc: 'Minimal single-metric tile.' },
]

const loading  = ref(true)
const saving   = ref(false)
const selected = ref([])
const catalog  = ref([])
const max      = ref(9)

const atCap = computed(() => selected.value.length >= max.value)
const isSelected   = (id) => selected.value.includes(id)
const isSelectable = (id) => catalog.value.includes(id)

async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/core/dashboard-widgets/')
    selected.value = res.data.selected || []
    catalog.value  = res.data.catalog  || []
    max.value      = res.data.max ?? 9
  } catch { /* sudo-only; non-sudo never reaches this page */ } finally {
    loading.value = false
  }
}

async function toggle(w) {
  if (w.draft || !isSelectable(w.id)) return
  const on = isSelected(w.id)
  if (!on && atCap.value) return                 // 9-cap: can't add a 10th

  const prev = selected.value
  selected.value = on ? prev.filter(x => x !== w.id) : [...prev, w.id]
  saving.value = true
  try {
    const res = await api.put('/api/core/dashboard-widgets/', { selected: selected.value })
    selected.value = res.data.selected           // trust the server's sanitized order
  } catch {
    selected.value = prev                         // revert on failure
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
.page-title  { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -.4px; }
.page-sub    { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; font-weight: 500; }

/* Selection counter */
.wg-counter {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  padding: 8px 14px; border-radius: 11px;
  background: var(--accent-soft); color: var(--accent);
  border: 1px solid rgba(247,143,30,.25);
  font-size: 12.5px; font-weight: 600;
}
.wg-counter b { font-size: 14px; font-weight: 800; }
.wg-counter.full { background: var(--success-soft); color: var(--success); border-color: rgba(34,197,94,.25); }
.wg-saving { font-size: 11px; opacity: .8; font-style: italic; }

/* Uniform grid — reflows on shrink, never stretches */
.wg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* Card */
.wg-card {
  position: relative;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 150ms var(--ease-out), transform 150ms var(--ease-out), border-color 150ms var(--ease-out);
}
.wg-card:hover:not(.draft) { box-shadow: 0 4px 20px rgba(0,0,0,.1); transform: translateY(-2px); }
.dark .wg-card:hover:not(.draft) { box-shadow: 0 4px 20px rgba(0,0,0,.4); }
.wg-card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.wg-card.draft   { cursor: not-allowed; opacity: .55; }
.wg-card.locked  { cursor: not-allowed; }
.wg-card.locked:hover { transform: none; box-shadow: none; }
.wg-card--skel { height: 240px; background: var(--bg-card); animation: wg-pulse 1.4s ease-in-out infinite; }
@keyframes wg-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

/* Select check (top-right) */
.wg-check {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  width: 22px; height: 22px; border-radius: 7px;
  border: 1.5px solid var(--border); background: var(--bg-card);
  display: flex; align-items: center; justify-content: center; color: #fff;
  transition: background 140ms var(--ease-out), border-color 140ms var(--ease-out);
}
.wg-check.on { background: var(--accent); border-color: var(--accent); }
.wg-card.locked .wg-check { opacity: .4; }

/* Draft lock badge */
.wg-lock {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .04em;
  padding: 3px 8px; border-radius: 999px;
  background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border);
}

/* Preview — uniform height for every widget */
.wg-preview {
  height: 160px;
  background: var(--bg-app);
  border-bottom: 1.5px solid var(--border);
  position: relative; overflow: hidden;
}

/* Meta */
.wg-meta { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px 14px; }
.wg-name { font-size: 13.5px; font-weight: 700; color: var(--text-primary); }
.wg-desc { font-size: 11.5px; color: var(--text-muted); line-height: 1.45; }
</style>
