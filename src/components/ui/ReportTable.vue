<template>
  <div class="rt-wrap">
    <div class="rt-header">
      <span class="rt-title">{{ title }}</span>
      <ExportMenu :rows="rows" :columns="exportColumns" :filename="filename"
                  :title="title" :meta="meta" />
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="c in columns" :key="c.key" :style="alignStyle(c)">{{ c.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="rt-skeleton">{{ t('reports.table.loading') }}</td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="table-empty">{{ emptyText || t('reports.table.no_data') }}</td>
          </tr>
          <tr v-for="(row, i) in rows" :key="i" class="table-row">
            <td v-for="c in columns" :key="c.key" :style="alignStyle(c)" :class="cellClass(c, row)">
              {{ cell(row[c.key], c.type) }}
            </td>
          </tr>
        </tbody>
        <tfoot v-if="totals && rows.length">
          <tr class="rt-total-row">
            <td v-for="(c, idx) in columns" :key="c.key" :style="alignStyle(c)">
              <template v-if="idx === 0">{{ totalsLabel || t('reports.table.total') }}</template>
              <template v-else-if="totals[c.key] !== undefined">{{ cell(totals[c.key], c.type) }}</template>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ExportMenu from './ExportMenu.vue'
import { displayValue } from '@/composables/useExport'

const { t } = useI18n()

const props = defineProps({
  // columns: [{ key, label, type: 'text'|'number'|'currency'|'qty'|'date', align?, accent? }]
  columns:  { type: Array,  required: true },
  rows:     { type: Array,  default: () => [] },
  totals:   { type: Object, default: null },
  totalsLabel: { type: String, default: '' },
  loading:  { type: Boolean, default: false },
  title:    { type: String, default: 'Report' },
  filename: { type: String, default: 'report' },
  meta:     { type: String, default: '' },
  emptyText:{ type: String, default: '' },
})

const exportColumns = computed(() => props.columns.map(c => ({ key: c.key, label: c.label, type: c.type })))

function cell(v, type) { return displayValue(v, type) }
function alignStyle(c) {
  const numeric = ['number', 'currency', 'qty'].includes(c.type)
  return { textAlign: c.align || (numeric ? 'right' : 'left') }
}
function cellClass(c, row) {
  const cls = []
  if (['number', 'currency', 'qty'].includes(c.type)) cls.push('rt-num')
  if (c.accent === 'money') cls.push('col-value')
  if (c.accent === 'good') cls.push('col-revenue')
  if (c.accent === 'sign') cls.push(Number(row[c.key]) < 0 ? 'rt-neg' : 'rt-pos')
  return cls
}
</script>

<style scoped>
.rt-wrap { margin-bottom: 26px; }
.rt-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.rt-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }

.table-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead th { padding: 10px 14px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); background: var(--bg-app); border-bottom: 1px solid var(--border); white-space: nowrap; }
.data-table tbody tr.table-row { border-bottom: 1px solid var(--border); transition: background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom: none; }
.data-table tbody tr.table-row:hover { background: var(--bg-app); }
.data-table tbody td { padding: 10px 14px; color: var(--text-primary); white-space: nowrap; }
.table-empty, .rt-skeleton { text-align: center; padding: 40px; color: var(--text-muted); }

.rt-num { font-variant-numeric: tabular-nums; }
.col-value { font-weight: 600; }
.col-revenue { color: var(--success); font-weight: 600; }
.rt-neg { color: var(--danger); font-weight: 600; }
.rt-pos { color: var(--success); font-weight: 600; }

.rt-total-row td { padding: 11px 14px; font-weight: 700; color: var(--text-primary); background: var(--bg-app); border-top: 2px solid var(--border); font-variant-numeric: tabular-nums; }
</style>
