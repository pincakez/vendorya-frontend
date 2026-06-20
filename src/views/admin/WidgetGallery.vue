<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gallery</h1>
        <p class="page-sub">The design system's source of truth — approved components and dashboard widgets.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="g-tabs">
      <button class="g-tab" :class="{ active: tab === 'components' }" @click="tab = 'components'">
        <Component :size="15" /> Components
      </button>
      <button class="g-tab" :class="{ active: tab === 'widgets' }" @click="tab = 'widgets'">
        <LayoutGrid :size="15" /> Widgets
      </button>
      <button class="g-tab" :class="{ active: tab === 'modals' }" @click="tab = 'modals'">
        <LayoutTemplate :size="15" /> Modal Layouts
      </button>
    </div>

    <!-- ── Modal Layout presets ───────────────────────────── -->
    <template v-if="tab === 'modals'">
      <section class="wg-section">
        <div class="wg-section-label">
          <span class="wg-size-badge">Form modal layouts · 900px wide</span>
        </div>
        <p class="ml-intro">
          Named layouts every form modal is built from — so each one reads like the Add Product modal:
          compact, two-column, fills the width. Reference a preset by name (e.g. “use the <b>TwoCol</b> preset here”).
          They map to shared classes in <code>main.css</code>.
        </p>
        <div class="wg-row wg-row--wrap">
          <div v-for="p in modalPresets" :key="p.id" class="wg-card wg-card--modal">
            <div class="wg-preview wg-preview--modal">
              <!-- split: two stacked columns -->
              <div v-if="p.layout === 'split'" class="ml-skel ml-skel--split">
                <div class="ml-skel-col"><span class="ml-cell" /><span class="ml-cell" /><span class="ml-cell" /></div>
                <div class="ml-skel-col"><span class="ml-cell" /><span class="ml-cell" /><span class="ml-cell" /></div>
              </div>
              <!-- rows -->
              <div v-else class="ml-skel">
                <template v-for="(row, i) in p.rows" :key="i">
                  <div v-if="row === 'hr'" class="ml-hr" />
                  <div v-else class="ml-skel-row">
                    <span v-for="(w, j) in row" :key="j" class="ml-cell" :style="{ flex: w }" />
                  </div>
                </template>
              </div>
            </div>
            <div class="wg-meta">
              <div class="wg-meta-left">
                <span class="wg-name">{{ p.name }}</span>
                <span class="wg-desc">{{ p.desc }}</span>
              </div>
              <div class="wg-meta-right">
                <span class="wg-dim">{{ p.cls }}</span>
                <span class="wg-status" :class="p.ready ? 'status-ready' : 'status-draft'">
                  {{ p.ready ? '● Live' : '○ Draft' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <ComponentGallery v-else-if="tab === 'components'" />

    <template v-else>
    <!-- Full Width (30 cols) -->
    <section class="wg-section">
      <div class="wg-section-label">
        <span class="wg-size-badge">30 columns · Full Width</span>
      </div>
      <div class="wg-row">
        <div v-for="w in bySize('full')" :key="w.id" class="wg-card wg-card--full">
          <div class="wg-preview wg-preview--full">
            <component :is="w.preview" v-if="w.preview" />
            <div v-else class="wg-mock">{{ w.name }}</div>
          </div>
          <div class="wg-meta">
            <div class="wg-meta-left">
              <span class="wg-name">{{ w.name }}</span>
              <span class="wg-desc">{{ w.desc }}</span>
            </div>
            <div class="wg-meta-right">
              <span class="wg-dim">{{ w.cols }}×{{ w.rows }}</span>
              <span class="wg-status" :class="w.ready ? 'status-ready' : 'status-draft'">
                {{ w.ready ? '● Ready' : '○ Draft' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Wide Left (15 cols) -->
    <section class="wg-section">
      <div class="wg-section-label">
        <span class="wg-size-badge">15 columns · Wide</span>
      </div>
      <div class="wg-row wg-row--wrap">
        <div v-for="w in bySize('wide')" :key="w.id" class="wg-card wg-card--wide">
          <div class="wg-preview wg-preview--wide">
            <component :is="w.preview" v-if="w.preview" />
            <div v-else class="wg-mock">{{ w.name }}</div>
          </div>
          <div class="wg-meta">
            <div class="wg-meta-left">
              <span class="wg-name">{{ w.name }}</span>
              <span class="wg-desc">{{ w.desc }}</span>
            </div>
            <div class="wg-meta-right">
              <span class="wg-dim">{{ w.cols }}×{{ w.rows }}</span>
              <span class="wg-status" :class="w.ready ? 'status-ready' : 'status-draft'">
                {{ w.ready ? '● Ready' : '○ Draft' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Medium (10 cols) -->
    <section class="wg-section">
      <div class="wg-section-label">
        <span class="wg-size-badge">10 columns · Medium</span>
      </div>
      <div class="wg-row wg-row--wrap">
        <div v-for="w in bySize('medium')" :key="w.id" class="wg-card wg-card--medium">
          <div class="wg-preview wg-preview--medium">
            <component :is="w.preview" v-if="w.preview" />
            <div v-else class="wg-mock">{{ w.name }}</div>
          </div>
          <div class="wg-meta">
            <div class="wg-meta-left">
              <span class="wg-name">{{ w.name }}</span>
              <span class="wg-desc">{{ w.desc }}</span>
            </div>
            <div class="wg-meta-right">
              <span class="wg-dim">{{ w.cols }}×{{ w.rows }}</span>
              <span class="wg-status" :class="w.ready ? 'status-ready' : 'status-draft'">
                {{ w.ready ? '● Ready' : '○ Draft' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Small (5 cols) -->
    <section class="wg-section">
      <div class="wg-section-label">
        <span class="wg-size-badge">5 columns · Small</span>
      </div>
      <div class="wg-row wg-row--wrap">
        <div v-for="w in bySize('small')" :key="w.id" class="wg-card wg-card--small">
          <div class="wg-preview wg-preview--small">
            <component :is="w.preview" v-if="w.preview" />
            <div v-else class="wg-mock">{{ w.name }}</div>
          </div>
          <div class="wg-meta">
            <div class="wg-meta-left">
              <span class="wg-name">{{ w.name }}</span>
              <span class="wg-desc">{{ w.desc }}</span>
            </div>
            <div class="wg-meta-right">
              <span class="wg-dim">{{ w.cols }}×{{ w.rows }}</span>
              <span class="wg-status" :class="w.ready ? 'status-ready' : 'status-draft'">
                {{ w.ready ? '● Ready' : '○ Draft' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
    </template>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Component, LayoutGrid, LayoutTemplate } from 'lucide-vue-next'
import ComponentGallery from './ComponentGallery.vue'

const tab = ref('components')

/* ─ Modal layout presets ─ map to shared classes in main.css ─ */
const modalPresets = [
  { id: 'twocol',  name: 'TwoCol',     cls: '.modal-2col',   ready: true, layout: 'rows',  rows: [[1,1],[1,1],[1]],
    desc: 'Two fields per row. The default for every form modal (Customer, Supplier, Staff).' },
  { id: 'threecol',name: 'ThreeCol',   cls: '.modal-3col',   ready: true, layout: 'rows',  rows: [[1,1,1]],
    desc: 'Three fields across one row — e.g. the price triplet (Base / Cost / Sell).' },
  { id: 'single',  name: 'SingleCol',  cls: '.modal-form',   ready: true, layout: 'rows',  rows: [[1],[1],[1]],
    desc: 'Stacked single column. For short, simple modals (rename, confirm, one input).' },
  { id: 'split',   name: 'Split',      cls: '.modal-split',  ready: true, layout: 'split',
    desc: 'Two independent stacked columns side by side — the Add Product shape.' },
  { id: 'section', name: 'Sectioned',  cls: '.modal-section',ready: true, layout: 'rows',  rows: [[1,1],'hr',[1,1]],
    desc: 'Grouped block under a labelled divider — like the Attributes section.' },
]

const widgets = [
  /* ─ Full Width ─────────────────────────────────────────── */
  { id: 'at-a-glance',    size: 'full',   cols: 30, rows: 4,  ready: true,  name: 'At a Glance',       desc: 'Animated sentence ticker — surfaces daily insights from live store data.' },
  { id: 'sales-chart',    size: 'full',   cols: 30, rows: 18, ready: false, name: 'Sales Chart',        desc: 'Full-width bar or line chart — revenue over time, configurable period.' },

  /* ─ Wide ───────────────────────────────────────────────── */
  { id: 'stock-health',   size: 'wide',   cols: 15, rows: 9,  ready: true,  name: 'Stock Health',       desc: 'Color-coded stock status strip — shows low-stock items as chips.' },
  { id: 'top-products',   size: 'wide',   cols: 15, rows: 9,  ready: false, name: 'Top Products',       desc: 'Horizontal carousel of best-selling products with images and ranks.' },

  /* ─ Medium ─────────────────────────────────────────────── */
  { id: 'today-sales',    size: 'medium', cols: 10, rows: 9,  ready: true,  name: "Today's Sales",      desc: 'Big KPI number — daily revenue total with invoice count.' },
  { id: 'items-shift',    size: 'medium', cols: 10, rows: 9,  ready: true,  name: 'Items & Shift',      desc: 'Split panel — units sold today plus active shift status with pulse dot.' },
  { id: 'recent-sales',   size: 'medium', cols: 30, rows: 18, ready: true,  name: 'Recent Sales',       desc: 'Full-width table of today\'s invoices — scrollable, live data.' },
  { id: 'services',       size: 'medium', cols: 10, rows: 16, ready: true,  name: 'Upcoming Services',  desc: 'List of services with client name and ETA, sorted by due date.' },
  { id: 'low-stock-list', size: 'medium', cols: 10, rows: 16, ready: true,  name: 'Low Stock Items',    desc: 'Detailed list of items below threshold — chips color-coded by severity.' },
  { id: 'ai-insights',    size: 'medium', cols: 10, rows: 16, ready: false, name: 'AI Insights',        desc: 'Rotating AI-generated recommendations based on sales and stock patterns.' },
  { id: 'activity-feed',  size: 'medium', cols: 10, rows: 16, ready: false, name: 'Activity Feed',      desc: 'Live ticker of recent store events — sales, adjustments, logins.' },
  { id: 'revenue-ring',   size: 'medium', cols: 10, rows: 16, ready: false, name: 'Revenue Ring',       desc: 'Animated circular gauge — today\'s revenue vs daily average.' },

  /* ─ Small ──────────────────────────────────────────────── */
  { id: 'kpi-tile',       size: 'small',  cols: 5,  rows: 9,  ready: true,  name: 'KPI Tile',           desc: 'Minimal single-metric tile — configurable label, value, and color.' },
  { id: 'heat-calendar',  size: 'small',  cols: 5,  rows: 9,  ready: false, name: 'Heat Calendar',      desc: 'GitHub-style daily sales heatmap for the current month.' },
]

function bySize(size) {
  return widgets.filter(w => w.size === size)
}
</script>

<style scoped>
.page-header { margin-bottom: 32px; }
.page-title  { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -.4px; }
.page-sub    { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; font-weight: 500; }

/* Tabs */
.g-tabs { display: flex; gap: 6px; margin-bottom: 28px; }
.g-tab {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px; cursor: pointer;
  font-size: 13.5px; font-weight: 700; font-family: inherit;
  border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary);
  transition: background-color 140ms var(--ease-out), color 140ms var(--ease-out),
              border-color 140ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.g-tab:hover:not(.active) { color: var(--text-primary); }
.g-tab:active { transform: scale(var(--press-scale)); transition-duration: var(--press-down); }
.g-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* Section */
.wg-section { margin-bottom: 40px; }
.wg-section-label { margin-bottom: 14px; }
.wg-size-badge {
  display: inline-flex;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  padding: 4px 12px; border-radius: 9999px;
  background: var(--accent-soft); color: var(--accent);
  border: 1px solid rgba(247,143,30,.2);
}

/* Row */
.wg-row { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
.wg-row--wrap { flex-wrap: wrap; overflow-x: visible; }

/* Card */
.wg-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  transition: box-shadow 150ms, transform 150ms;
}
.wg-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); transform: translateY(-2px); }
.dark .wg-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.4); }
.wg-card--full   { width: 100%; }
.wg-card--wide   { width: 380px; }
.wg-card--medium { width: 260px; }
.wg-card--small  { width: 180px; }

/* Preview area */
.wg-preview {
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.wg-preview--full   { height: 70px; }
.wg-preview--wide   { height: 110px; }
.wg-preview--medium { height: 130px; }
.wg-preview--small  { height: 90px; }

/* Mock placeholder inside preview */
.wg-mock {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  opacity: .5;
  text-align: center;
  padding: 8px;
}

/* Meta row */
.wg-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
}
.wg-meta-left  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wg-meta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.wg-name  { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.wg-desc  { font-size: 11.5px; color: var(--text-muted); line-height: 1.4; }
.wg-dim   { font-size: 10px; font-weight: 700; font-family: monospace; color: var(--text-muted); background: var(--bg-app); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }
.wg-status { font-size: 10.5px; font-weight: 700; white-space: nowrap; }
.status-ready { color: var(--success); }
.status-draft { color: var(--text-muted); }

/* ── Modal layout presets ── */
.ml-intro { font-size: 12.5px; color: var(--text-muted); line-height: 1.6; max-width: 720px; margin: 0 0 18px; }
.ml-intro code { font-family: monospace; font-size: 11.5px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; }
.wg-card--modal { width: 240px; }
.wg-preview--modal { height: 130px; padding: 16px; }
.ml-skel { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.ml-skel-row { display: flex; gap: 8px; }
.ml-cell { height: 16px; border-radius: 5px; background: var(--accent-soft); border: 1px solid rgba(247,143,30,.25); }
.ml-skel-row .ml-cell { flex: 1; }
.ml-hr { height: 1px; background: var(--border); margin: 2px 0; }
.ml-skel--split { flex-direction: row; gap: 10px; }
.ml-skel-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
</style>
