<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h1 class="page-title">Widget Gallery</h1>
        <p class="page-sub">Every dashboard widget, shown live with sample data. The catalog for what can go on a store dashboard.</p>
      </div>
    </div>

    <!-- Full Width (30 cols) -->
    <section class="wg-section">
      <div class="wg-section-label">
        <span class="wg-size-badge">30 columns · Full Width</span>
      </div>
      <div class="wg-row">
        <div v-for="w in bySize('full')" :key="w.id" class="wg-card wg-card--full">
          <div class="wg-preview wg-preview--full"><WidgetMock :id="w.id" /></div>
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
          <div class="wg-preview wg-preview--wide"><WidgetMock :id="w.id" /></div>
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
          <div class="wg-preview wg-preview--medium"><WidgetMock :id="w.id" /></div>
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
          <div class="wg-preview wg-preview--small"><WidgetMock :id="w.id" /></div>
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

  </div>
</template>

<script setup>
import WidgetMock from '@/components/admin/WidgetMock.vue'

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
.wg-card--medium { width: 280px; }
.wg-card--small  { width: 200px; }

/* Preview area */
.wg-preview {
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}
.wg-preview--full   { height: 120px; }
.wg-preview--wide   { height: 150px; }
.wg-preview--medium { height: 160px; }
.wg-preview--small  { height: 120px; }

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
</style>
