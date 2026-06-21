<template>
  <div class="base-table">
    <!-- Skeleton -->
    <div v-if="loading" class="bt-skeleton">
      <div v-for="i in skeletonRows" :key="i" class="bt-skel-row" />
    </div>

    <!-- Table -->
    <div v-else class="bt-xscroll">
      <table class="bt-table" :style="minWidth ? `min-width:${minWidth}px` : undefined">
        <thead>
          <tr>
            <th
              v-for="c in columns"
              :key="c.key"
              :style="alignStyle(c)"
              :class="[c.thClass, { sortable: isSortable(c), 'th-active': sortKey === c.key }]"
              @click="isSortable(c) && toggleSort(c)"
            >
              <span class="bt-th-inner" :style="thInnerStyle(c)">
                {{ c.label }}
                <component
                  v-if="isSortable(c)"
                  :is="arrowFor(c)"
                  :size="13"
                  class="bt-arrow"
                  :class="{ on: sortKey === c.key }"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td :colspan="columns.length" class="bt-empty">
              <slot name="empty">{{ emptyText }}</slot>
            </td>
          </tr>
          <tr
            v-for="(row, i) in sortedRows"
            :key="row[rowKey] ?? i"
            class="bt-row"
            :class="{ clickable: rowClickable }"
            @click="rowClickable && $emit('row-click', row)"
          >
            <td v-for="c in columns" :key="c.key" :style="alignStyle(c)" :class="c.cellClass">
              <slot :name="`cell-${c.key}`" :row="row" :value="row[c.key]">
                {{ formatCell(row[c.key], c.type) }}
              </slot>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="$slots.foot"><slot name="foot" /></tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
/*
 * BaseTable — the "Fixed" (data-driven) table of the design system.
 * Hand it `columns` + `rows`; it draws the header, skeleton, empty state,
 * and built-in column sorting. Custom cell rendering via `#cell-<key>` slots.
 *
 * columns: [{ key, label, type?, align?, sortable?, cellClass?, thClass? }]
 *   type: 'text' | 'number' | 'currency' | 'qty' | 'date'  (drives sort + default format/align)
 *
 * Sorting: client-side by default (sorts the loaded rows). For server-paginated
 * lists, set :serverSort and listen to @sort="{ key, dir }" to refetch with ordering.
 */
import { ref, computed, useAttrs } from 'vue'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-vue-next'
import { displayValue } from '@/composables/useExport'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  columns:      { type: Array,   required: true },
  rows:         { type: Array,   default: () => [] },
  rowKey:       { type: String,  default: 'id' },
  loading:      { type: Boolean, default: false },
  skeletonRows: { type: Number,  default: 6 },
  emptyText:    { type: String,  default: 'No items yet' },
  minWidth:     { type: Number,  default: null },
  sortable:     { type: Boolean, default: true },   // master switch
  serverSort:   { type: Boolean, default: false },  // emit @sort instead of sorting locally
  // Persist the chosen sort in localStorage (survives refresh, 0 bytes to server).
  storageKey:   { type: String,  default: '' },
  // Initial sort when nothing is stored yet, e.g. { key: 'created_at', dir: 'desc' }.
  defaultSort:  { type: Object,  default: null },
})

const emit = defineEmits(['sort', 'row-click'])

const attrs = useAttrs()
const rowClickable = computed(() => !!attrs.onRowClick)

const NUMERIC = ['number', 'currency', 'qty']
const sortKey = ref(null)
const sortDir = ref('asc')   // asc | desc

const _lsKey = () => props.storageKey ? `vya_sort_${props.storageKey}` : null
const _validKey = (k) => props.columns.some(c => c.key === k)

function _persist() {
  const k = _lsKey()
  if (!k) return
  // store the explicit "off" state too, so a cleared sort survives a refresh
  localStorage.setItem(k, sortKey.value ? JSON.stringify({ key: sortKey.value, dir: sortDir.value }) : 'null')
}
function _restore() {
  const k = _lsKey()
  if (k) {
    try {
      const raw = localStorage.getItem(k)
      if (raw !== null) {
        const s = JSON.parse(raw)
        if (s && s.key && _validKey(s.key)) { sortKey.value = s.key; sortDir.value = s.dir === 'desc' ? 'desc' : 'asc'; return }
        if (s === null) { sortKey.value = null; return }   // remembered "off"
      }
    } catch { /* corrupt entry → fall through to default */ }
  }
  if (props.defaultSort && _validKey(props.defaultSort.key)) {
    sortKey.value = props.defaultSort.key
    sortDir.value = props.defaultSort.dir === 'desc' ? 'desc' : 'asc'
  }
}
_restore()

function isSortable(c) { return props.sortable && c.sortable !== false }
function toggleSort(c) {
  if (sortKey.value === c.key) {
    if (sortDir.value === 'asc') sortDir.value = 'desc'
    else { sortKey.value = null; sortDir.value = 'asc' }
  } else { sortKey.value = c.key; sortDir.value = 'asc' }
  _persist()
  emit('sort', sortKey.value ? { key: sortKey.value, dir: sortDir.value } : null)
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
function alignStyle(c) {
  const numeric = NUMERIC.includes(c.type)
  return { textAlign: c.align || (numeric ? 'right' : 'left') }
}

const sortedRows = computed(() => {
  if (props.serverSort || !sortKey.value) return props.rows
  const col = props.columns.find(c => c.key === sortKey.value)
  const numeric = col && NUMERIC.includes(col.type)
  const isDate = col && col.type === 'date'
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const av = a[sortKey.value], bv = b[sortKey.value]
    const aEmpty = av === null || av === undefined || av === ''
    const bEmpty = bv === null || bv === undefined || bv === ''
    if (aEmpty && bEmpty) return 0
    if (aEmpty) return 1   // blanks sink to the bottom
    if (bEmpty) return -1
    if (numeric) return (Number(av) - Number(bv)) * dir
    if (isDate)  return (new Date(av) - new Date(bv)) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
})

function formatCell(v, type) { return type ? displayValue(v, type) : (v ?? '') }
</script>

<style scoped>
.base-table { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.bt-xscroll { overflow-x: auto; }
.bt-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.bt-table thead th { padding: 10px 14px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); background: var(--bg-app); border-bottom: 1px solid var(--border); white-space: nowrap; }
.bt-table thead th.sortable { cursor: pointer; user-select: none; transition: color 120ms; }
.bt-table thead th.sortable:hover { color: var(--text-secondary); }
.bt-table thead th.th-active { color: var(--text-primary); }
.bt-th-inner { display: flex; align-items: center; gap: 5px; }
.bt-arrow { opacity: 0; color: var(--text-muted); transition: opacity 120ms; flex-shrink: 0; }
.bt-table thead th.sortable:hover .bt-arrow { opacity: .45; }
.bt-arrow.on { opacity: 1; color: var(--accent); }

.bt-table tbody tr.bt-row { border-bottom: 1px solid var(--border); transition: background 100ms; }
.bt-table tbody tr.bt-row:last-child { border-bottom: none; }
.bt-table tbody tr.bt-row:hover { background: var(--bg-app); }
.bt-table tbody tr.bt-row.clickable { cursor: pointer; }
.bt-table tbody td { padding: 10px 14px; color: var(--text-primary); }

.bt-empty { text-align: center; padding: 44px; color: var(--text-muted); }

.bt-skeleton { padding: 8px 0; }
.bt-skel-row { height: 40px; margin: 4px 16px; border-radius: 6px; background: var(--border); animation: bt-shimmer 1.4s ease-in-out infinite; }
@keyframes bt-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
</style>
