<template>
  <div class="rt-wrap">
    <div class="rt-header">
      <span class="rt-title">{{ title }}</span>
      <ExportMenu :rows="sortedRows" :columns="exportColumns" :filename="filename"
                  :title="title" :meta="meta" />
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="c in columns" :key="c.key" :style="alignStyle(c)"
                :class="[{ sortable: isSortable(c), 'th-active': sortKey === c.key }]"
                @click="isSortable(c) && toggleSort(c)">
              <span class="rt-th-inner" :style="thInnerStyle(c)">
                {{ c.label }}
                <component v-if="isSortable(c)" :is="arrowFor(c)" :size="13"
                           class="rt-arrow" :class="{ on: sortKey === c.key }" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="rt-skeleton">{{ t('reports.table.loading') }}</td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="table-empty">{{ emptyText || t('reports.table.no_data') }}</td>
          </tr>
          <tr v-for="(row, i) in sortedRows" :key="i" class="table-row">
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-vue-next'
import ExportMenu from './ExportMenu.vue'
import { displayValue } from '@/composables/useExport'

const { t } = useI18n()

const props = defineProps({
  // columns: [{ key, label, type: 'text'|'number'|'currency'|'qty'|'date', align?, accent?, sortable? }]
  columns:  { type: Array,  required: true },
  rows:     { type: Array,  default: () => [] },
  totals:   { type: Object, default: null },
  totalsLabel: { type: String, default: '' },
  loading:  { type: Boolean, default: false },
  title:    { type: String, default: 'Report' },
  filename: { type: String, default: 'report' },
  meta:     { type: String, default: '' },
  emptyText:{ type: String, default: '' },
  // sortable: master switch for clickable column-header sorting (per-column opt-out via column.sortable === false)
  sortable: { type: Boolean, default: true },
})

const exportColumns = computed(() => props.columns.map(c => ({ key: c.key, label: c.label, type: c.type })))

/* ── client-side sort (cycle asc → desc → off) ── */
const NUMERIC = ['number', 'currency', 'qty']
const sortKey = ref(null)
const sortDir = ref('asc')   // asc | desc

function isSortable(c) { return props.sortable && c.sortable !== false }
function toggleSort(c) {
  if (sortKey.value === c.key) {
    if (sortDir.value === 'asc') sortDir.value = 'desc'
    else { sortKey.value = null; sortDir.value = 'asc' }
  } else { sortKey.value = c.key; sortDir.value = 'asc' }
}
function arrowFor(c) {
  if (sortKey.value !== c.key) return ArrowUpDown
  return sortDir.value === 'asc' ? ArrowUp : ArrowDown
}
function thInnerStyle(c) {
  const numeric = NUMERIC.includes(c.type)
  const align = c.align || (numeric ? 'right' : 'left')
  return { justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows
  const col = props.columns.find(c => c.key === sortKey.value)
  const numeric = col && NUMERIC.includes(col.type)
  const isDate = col && col.type === 'date'
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const av = a[sortKey.value], bv = b[sortKey.value]
    const aEmpty = av === null || av === undefined || av === ''
    const bEmpty = bv === null || bv === undefined || bv === ''
    if (aEmpty && bEmpty) return 0
    if (aEmpty) return 1   // blanks always sink to the bottom
    if (bEmpty) return -1
    if (numeric) return (Number(av) - Number(bv)) * dir
    if (isDate)  return (new Date(av) - new Date(bv)) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
})

function cell(v, type) { return displayValue(v, type) }
function alignStyle(c) {
  const numeric = NUMERIC.includes(c.type)
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
.data-table thead th.sortable { cursor: pointer; user-select: none; transition: color 120ms; }
.data-table thead th.sortable:hover { color: var(--text-secondary); }
.data-table thead th.th-active { color: var(--text-primary); }
.rt-th-inner { display: flex; align-items: center; gap: 5px; }
.rt-arrow { opacity: 0; color: var(--text-muted); transition: opacity 120ms; flex-shrink: 0; }
.data-table thead th.sortable:hover .rt-arrow { opacity: .45; }
.rt-arrow.on { opacity: 1; color: var(--accent); }
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
