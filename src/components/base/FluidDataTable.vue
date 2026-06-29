<template>
  <!-- drag ghost -->
  <Teleport to="body">
    <div v-if="colDragMoved && colDragKey" class="col-drag-ghost"
         :style="{ left: colGhostX + 'px', top: colGhostY + 'px' }">
      {{ colByKey[colDragKey]?.label }}
    </div>
  </Teleport>

  <div>
    <!-- ── Toolbar ── -->
    <div class="dt-toolbar">
      <slot name="toolbar-start" />

      <button v-if="hasAdhoc && !editing" class="dt-filter" :title="t('inventory.products.toolbar.reset_layout')" @click="resetLayout">
        <RotateCcw :size="14" />
      </button>

      <slot name="toolbar-filter-btn" />

      <button v-if="canEdit && !editing" class="dt-filter" @click="enterEdit">
        <Columns3 :size="14" /> {{ t('inventory.products.toolbar.customize') }}
      </button>

      <button v-if="showBulk && canEdit && !editing" class="dt-filter" :class="{ on: bulkActive }" @click="$emit('toggle-bulk')">
        <CheckSquare :size="14" /> {{ t('inventory.products.toolbar.bulk') }}
      </button>

      <button v-if="canEdit && !editing" class="dt-filter" :title="t('inventory.products.toolbar.assign_layouts')" @click="openAssign">
        <UserCog :size="14" />
      </button>

      <slot name="toolbar-end" />
    </div>

    <!-- ── Customize panel ── -->
    <Transition name="edit-slide">
      <div v-if="editing" class="edit-panel">
        <div class="edit-head">
          <span class="edit-title"><Columns3 :size="15" /> {{ t('inventory.products.customize.title') }}</span>
          <div class="edit-actions">
            <select v-if="presets.length" class="edit-select"
                    @change="e => { const p = presets.find(x => x.id === e.target.value); if (p) loadPreset(p); e.target.value = '' }">
              <option value="">{{ t('inventory.products.customize.load_preset') }}</option>
              <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button class="btn-ghost" @click="resetWorking">{{ t('inventory.products.customize.reset') }}</button>
            <button class="btn-ghost" @click="cancelEdit">{{ t('common.cancel') }}</button>
            <button class="btn-ghost" @click="saveModal.open = true">{{ t('inventory.products.customize.save_preset') }}</button>
            <button class="btn-primary" @click="doneEdit">{{ t('inventory.products.customize.done') }}</button>
          </div>
        </div>
        <p class="edit-hint">{{ t('inventory.products.customize.hint') }}</p>
        <div class="chooser">
          <div
            v-for="key in chooserOrder" :key="key" class="chooser-row"
            :class="{ disabled: !permittedKeys.includes(key), 'drag-over': dragOver === key && dragKey !== key }"
            @pointerenter="dragOver = key"
          >
            <GripVertical :size="13" class="chooser-grip" @pointerdown.prevent="startDrag(key)" />
            <input type="checkbox" class="chooser-cb"
              :checked="!working.hidden.includes(key)"
              :disabled="locked.includes(key) || !permittedKeys.includes(key)"
              @change="toggleHidden(key)"
            />
            <span class="chooser-label">{{ colByKey[key]?.label ?? key }}</span>
            <Lock v-if="locked.includes(key)" :size="11" class="chooser-tag" />
            <span v-else-if="!permittedKeys.includes(key)" class="chooser-na">{{ t('inventory.products.customize.role_na') }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Filters slot ── -->
    <slot name="filters" />

    <!-- ── Table ── -->
    <div class="dt-card" :class="{ editing }">
      <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th v-if="showBulk && bulkActive" class="dt-th dt-selcol">
                <slot name="select-all-header" />
              </th>
              <th
                v-for="col in displayColumns" :key="col.key"
                class="dt-th"
                :class="[
                  col.align === 'right' ? 'ta-right' : '',
                  col.sort ? 'sortable' : '',
                  colDragKey === col.key ? 'col-dragging' : '',
                  colDragOver === col.key && colDragKey !== col.key && colDragMoved ? 'col-drag-over' : '',
                ]"
                :style="col.key === firstCol
                  ? { minWidth: colWidths[col.key] + 'px', position: 'sticky', left: '0', zIndex: 22, background: 'var(--bg-app)' }
                  : { width: colWidths[col.key] + 'px' }"
                @click="col.sort && handleSort(col)"
                @pointerdown="startColDrag(col.key, $event)"
                @pointerenter="colDragKey && (colDragOver = col.key)"
              >
                <span class="dt-th-inner" :class="{ jend: col.align === 'right' }">
                  {{ col.label }}
                  <component v-if="col.sort" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                </span>
                <span class="dt-resize" @mousedown.stop.prevent="startResize(col.key, $event)" @click.stop></span>
              </th>
              <th v-if="$slots.actions" class="dt-th ta-right dt-actcol">{{ t('inventory.products.table.actions') }}</th>
            </tr>
          </thead>

          <Transition :name="rowTransition" mode="out-in">
            <tbody :key="page">
              <tr v-if="loading">
                <td :colspan="displayColumns.length + ($slots.actions ? 1 : 0) + (showBulk && bulkActive ? 1 : 0)" class="dt-loading">
                  {{ t('common.loading') }}
                </td>
              </tr>
              <template v-else-if="rows.length">
                <tr
                  v-for="row in rows" :key="row.id"
                  class="dt-row" :class="{ clickable: !!$slots.actions || rowClickable }"
                  @click="$emit('row-click', row)"
                >
                  <td v-if="showBulk && bulkActive" class="dt-selcol" @click.stop>
                    <slot name="select-cell" :row="row" />
                  </td>
                  <td
                    v-for="col in displayColumns" :key="col.key"
                    :class="[col.cls, col.align === 'right' ? 'ta-right' : '', col.key === firstCol ? 'col-frozen' : '']"
                  >
                    <slot :name="`cell-${col.key}`" :row="row" :col="col">
                      <Money v-if="col.money && cellVal(col, row) !== '—'" :value="cellVal(col, row)" />
                      <template v-else>{{ cellVal(col, row) }}</template>
                    </slot>
                  </td>
                  <td v-if="$slots.actions" class="ta-right dt-actcol">
                    <slot name="actions" :row="row" />
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td :colspan="displayColumns.length + ($slots.actions ? 1 : 0) + (showBulk && bulkActive ? 1 : 0)" class="dt-empty">
                  <slot name="empty">
                    <div class="dt-empty-title">{{ t('common.no_data') }}</div>
                  </slot>
                </td>
              </tr>
            </tbody>
          </Transition>
        </table>
      </div>

      <!-- Pagination -->
      <div class="dt-foot">
        <div class="dt-perpage">
          <span>{{ t('inventory.products.table.per_page') }}</span>
          <select :value="pageSize" @change="onPageSizeChange(+$event.target.value)">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="75">75</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="dt-showing">
          {{ t('inventory.products.table.showing', { from: total === 0 ? 0 : (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), total }) }}
        </div>
        <div class="dt-pages">
          <button class="dt-pg" :disabled="page === 1" @click="$emit('page-change', page - 1)"><ChevronLeft :size="18" /></button>
          <span class="dt-pgnum">{{ page }} / {{ totalPages }}</span>
          <button class="dt-pg" :disabled="page >= totalPages" @click="$emit('page-change', page + 1)"><ChevronRight :size="18" /></button>
        </div>
      </div>
    </div>

    <!-- ── Save preset modal ── -->
    <AppModal :open="saveModal.open" :title="t('inventory.products.save_preset_modal.title')" @close="saveModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('inventory.products.save_preset_modal.name_label') }}</label>
          <input v-model="saveModal.name" class="form-input" :placeholder="t('inventory.products.save_preset_modal.name_placeholder')" />
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary);cursor:pointer;">
          <input type="checkbox" v-model="saveModal.is_default" />
          {{ t('inventory.products.save_preset_modal.is_default_label') }}
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="saveModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!saveModal.name.trim()" @click="savePreset">{{ t('common.save') }}</button>
      </template>
    </AppModal>

    <!-- ── Assign layout modal ── -->
    <AppModal :open="assignModal.open" :title="t('inventory.products.assign_modal.title')" @close="assignModal.open = false; assignConflict = null">
      <div class="assign-list">
        <div v-for="row in assignModal.rows" :key="row.user_id" class="assign-row">
          <div class="assign-user">
            <span class="assign-name">{{ row.full_name }}</span>
            <span class="assign-role">{{ row.role }}</span>
          </div>
          <select v-model="row.preset_id" class="form-input assign-sel" @change="assignTo(row)">
            <option :value="null">{{ t('inventory.products.assign_modal.default_option') }}</option>
            <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div v-if="!assignModal.rows.length" style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">
          {{ t('inventory.products.assign_modal.no_staff') }}
        </div>
      </div>
      <div v-if="assignConflict" class="assign-conflict-banner">
        <span style="font-size:13px;">⚠</span>
        <span><strong>{{ assignConflict.user }}</strong> {{ t('inventory.products.assign_modal.conflict_cant_see') }}
          <em>{{ assignConflict.cols }}</em> {{ t('inventory.products.assign_modal.conflict_suffix') }}</span>
        <button style="background:none;border:none;cursor:pointer;color:inherit;font-size:14px;line-height:1;padding:0 2px;" @click="assignConflict = null">✕</button>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Columns3, GripVertical, Lock, UserCog, RotateCcw, CheckSquare,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'
import Money from '@/components/ui/Money.vue'

const props = defineProps({
  tableId:      { type: String,  required: true },
  columns:      { type: Array,   required: true },
  locked:       { type: Array,   default: () => [] },
  rows:         { type: Array,   required: true },
  total:        { type: Number,  default: 0 },
  loading:      { type: Boolean, default: false },
  page:         { type: Number,  default: 1 },
  pageSize:     { type: Number,  default: 50 },
  sortKey:      { type: String,  default: null },
  sortDir:      { type: String,  default: 'asc' },
  showBulk:     { type: Boolean, default: false },
  bulkActive:   { type: Boolean, default: false },
  rowClickable: { type: Boolean, default: false },
  defaultHidden:{ type: Array,   default: () => [] },
  defaultWidths:{ type: Object,  default: () => ({}) },
})

const emit = defineEmits([
  'page-change', 'page-size-change', 'sort-change',
  'row-click', 'toggle-bulk', 'layout-ready',
])

const { t } = useI18n()
const auth = useAuthStore()
const canEdit = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole) || auth.isSuperadmin)
const firstCol = computed(() => props.columns[0]?.key ?? '')

const ADHOC_KEY = computed(() => `dt_${props.tableId}_adhoc`)
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const rowTransition = ref('slide-left')

watch(() => props.page, (newP, oldP) => {
  rowTransition.value = newP > oldP ? 'slide-left' : 'slide-right'
})

/* ── Column state ── */
const colWidths  = reactive({})
const colOrder   = ref([])
const colHidden  = ref([])

const colByKey = computed(() => Object.fromEntries(props.columns.map(c => [c.key, c])))

const permittedKeys = computed(() => props.columns.map(c => c.key))

const editing = ref(false)
const working = reactive({ order: [], hidden: [] })
const activeOrder  = computed(() => editing.value ? working.order  : colOrder.value)
const activeHidden = computed(() => editing.value ? working.hidden : colHidden.value)

const displayColumns = computed(() =>
  activeOrder.value
    .filter(k => permittedKeys.value.includes(k) && !activeHidden.value.includes(k))
    .map(k => colByKey.value[k])
    .filter(Boolean)
)
const chooserOrder = computed(() => working.order.filter(k => colByKey.value[k]))

function cellVal(col, row) {
  if (col.isAttr) {
    const vals = row.attributes_summary?.[col.attrKey]
    return vals?.length ? vals.join(', ') : '—'
  }
  const v = row[col.field ?? col.key]
  return (v === undefined || v === null || v === '') ? '—' : v
}

/* ── Layout persistence ── */
const baseConfig = ref(null)
const hasAdhoc   = ref(false)

function _initWidths() {
  for (const c of props.columns) {
    if (colWidths[c.key] === undefined)
      colWidths[c.key] = props.defaultWidths[c.key] ?? 140
  }
}

function applyLayout(cfg) {
  if (!cfg) return
  const known = props.columns.map(c => c.key)
  if (Array.isArray(cfg.order) && cfg.order.length) {
    const ordered = cfg.order.filter(k => known.includes(k))
    for (const k of known) if (!ordered.includes(k)) ordered.push(k)
    colOrder.value = ordered
  }
  colHidden.value = (cfg.hidden || []).filter(k => !props.locked.includes(k))
  if (cfg.widths) Object.assign(colWidths, cfg.widths)
  if (cfg.sort?.key) emit('sort-change', { key: cfg.sort.key, dir: cfg.sort.dir || 'asc', init: true })
  if (cfg.page_size) emit('page-size-change', cfg.page_size)
}

function currentConfig() {
  return {
    order: colOrder.value, hidden: colHidden.value, widths: { ...colWidths },
    sort: props.sortKey ? { key: props.sortKey, dir: props.sortDir } : null,
    page_size: props.pageSize,
  }
}

let _adhocTimer = null
function saveAdhoc() {
  if (editing.value) return
  const cfg = currentConfig()
  localStorage.setItem(ADHOC_KEY.value, JSON.stringify(cfg))
  hasAdhoc.value = true
  clearTimeout(_adhocTimer)
  _adhocTimer = setTimeout(() => {
    api.post('/api/smart/presets/my-config/', { table_id: props.tableId, config: cfg }).catch(() => {})
  }, 1500)
}

async function loadLayout() {
  _initWidths()
  colOrder.value  = props.columns.map(c => c.key)
  colHidden.value = [...props.defaultHidden]

  const localAdhoc = JSON.parse(localStorage.getItem(ADHOC_KEY.value) || 'null')
  hasAdhoc.value = !!localAdhoc
  try {
    const [effRes, adhocRes] = await Promise.all([
      api.get('/api/smart/presets/effective/', { params: { table_id: props.tableId } }),
      api.get('/api/smart/presets/my-config/', { params: { table_id: props.tableId } }),
    ])
    baseConfig.value = effRes.data?.config ?? null
    const serverAdhoc = adhocRes.data && Object.keys(adhocRes.data).length ? adhocRes.data : null
    applyLayout(localAdhoc || serverAdhoc || baseConfig.value)
    if (!localAdhoc && serverAdhoc) {
      localStorage.setItem(ADHOC_KEY.value, JSON.stringify(serverAdhoc))
      hasAdhoc.value = true
    }
  } catch {
    applyLayout(localAdhoc)
  }
  emit('layout-ready')
}

function resetLayout() {
  localStorage.removeItem(ADHOC_KEY.value)
  hasAdhoc.value = false
  colOrder.value  = props.columns.map(c => c.key)
  colHidden.value = [...props.defaultHidden]
  _initWidths()
  api.post('/api/smart/presets/my-config/', { table_id: props.tableId, config: {} }).catch(() => {})
  applyLayout(baseConfig.value)
}

/* ── Edit mode ── */
function enterEdit()  { working.order = [...colOrder.value]; working.hidden = [...colHidden.value]; editing.value = true; fetchPresets() }
function cancelEdit() { editing.value = false }
function doneEdit()   { colOrder.value = [...working.order]; colHidden.value = [...working.hidden]; editing.value = false; saveAdhoc() }
function resetWorking() { working.order = props.columns.map(c => c.key); working.hidden = [...props.defaultHidden] }
function toggleHidden(key) {
  if (props.locked.includes(key)) return
  const i = working.hidden.indexOf(key)
  if (i >= 0) working.hidden.splice(i, 1); else working.hidden.push(key)
}

/* ── Chooser drag ── */
const dragKey  = ref(null)
const dragOver = ref(null)
function startDrag(key) {
  dragKey.value  = key
  dragOver.value = key
  document.addEventListener('pointerup', endDrag, { once: true })
}
function endDrag() {
  if (dragKey.value && dragOver.value && dragKey.value !== dragOver.value)
    reorderChooser(dragKey.value, dragOver.value)
  dragKey.value = null; dragOver.value = null
}
function reorderChooser(from, to) {
  const arr = [...working.order]
  arr.splice(arr.indexOf(from), 1)
  arr.splice(arr.indexOf(to), 0, from)
  working.order = arr
}

/* ── Presets ── */
const presets     = ref([])
const saveModal   = reactive({ open: false, name: '', is_default: false })
const assignModal = reactive({ open: false, rows: [] })
const assignConflict = ref(null)

async function fetchPresets() {
  try { const { data } = await api.get('/api/smart/presets/', { params: { table_id: props.tableId } }); presets.value = data.results ?? data } catch { /* noop */ }
}
function loadPreset(p) {
  const known = props.columns.map(c => c.key)
  const ordered = (p.config.order || known).filter(k => known.includes(k))
  for (const k of known) if (!ordered.includes(k)) ordered.push(k)
  working.order  = ordered
  working.hidden = (p.config.hidden || []).filter(k => !props.locked.includes(k))
  if (p.config.widths) Object.assign(colWidths, p.config.widths)
}
async function savePreset() {
  if (!saveModal.name.trim()) return
  const cfg = currentConfig()
  await api.post('/api/smart/presets/', { table_id: props.tableId, name: saveModal.name.trim(), config: cfg, is_default: saveModal.is_default })
  saveModal.open = false; saveModal.name = ''; saveModal.is_default = false
  await fetchPresets(); doneEdit()
}
async function openAssign() {
  if (!presets.value.length) await fetchPresets()
  const { data } = await api.get('/api/smart/presets/assignments/', { params: { table_id: props.tableId } })
  assignModal.rows = data; assignModal.open = true
}
async function assignTo(row) {
  assignConflict.value = null
  await api.post('/api/smart/presets/assignments/', { user_id: row.user_id, table_id: props.tableId, preset_id: row.preset_id || null })
}

/* ── Column header drag ── */
const colDragKey   = ref(null)
const colDragOver  = ref(null)
const colDragMoved = ref(false)
const colGhostX    = ref(0)
const colGhostY    = ref(0)
let colDragStartX  = 0
let suppressSort   = false

function startColDrag(key, e) {
  const rect = e.currentTarget.getBoundingClientRect()
  if (e.clientX > rect.right - 10) return
  colDragKey.value   = key
  colDragOver.value  = key
  colDragMoved.value = false
  colDragStartX      = e.clientX
  document.addEventListener('pointermove', onColMove)
  document.addEventListener('pointerup', onColEnd, { once: true })
}
function onColMove(e) {
  if (!colDragKey.value) return
  colGhostX.value = e.clientX + 14
  colGhostY.value = e.clientY - 18
  if (!colDragMoved.value && Math.abs(e.clientX - colDragStartX) > 5) colDragMoved.value = true
}
function onColEnd() {
  document.removeEventListener('pointermove', onColMove)
  if (colDragMoved.value && colDragKey.value && colDragOver.value && colDragKey.value !== colDragOver.value) {
    const arr = [...colOrder.value]
    arr.splice(arr.indexOf(colDragKey.value), 1)
    arr.splice(arr.indexOf(colDragOver.value), 0, colDragKey.value)
    colOrder.value = arr
    saveAdhoc()
    suppressSort = true
    setTimeout(() => { suppressSort = false }, 50)
  }
  colDragKey.value = null; colDragOver.value = null; colDragMoved.value = false
}

/* ── Sort ── */
function handleSort(col) {
  if (suppressSort) return
  let newKey = col.key, newDir = 'asc'
  if (props.sortKey === col.key) {
    if (props.sortDir === 'asc') newDir = 'desc'
    else { newKey = null; newDir = 'asc' }
  }
  emit('sort-change', { key: newKey, dir: newDir })
  saveAdhoc()
}
function arrowFor(col) {
  if (props.sortKey !== col.key) return ArrowUpDown
  return props.sortDir === 'asc' ? ArrowUp : ArrowDown
}

/* ── Resize ── */
let rz = null
function startResize(key, e) {
  rz = { key, x: e.clientX, w: colWidths[key] }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', endResize)
}
function onResize(e) {
  if (!rz) return
  colWidths[rz.key] = Math.max(60, rz.w + (e.clientX - rz.x))
}
function endResize() {
  rz = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', endResize)
  saveAdhoc()
}

function onPageSizeChange(size) {
  emit('page-size-change', size)
  saveAdhoc()
}

onMounted(loadLayout)
onUnmounted(() => {
  document.removeEventListener('pointermove', onColMove)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', endResize)
})
</script>

<style scoped>
/* edit panel */
.edit-slide-enter-active { animation: editSlideDown 220ms cubic-bezier(0.25,0.8,0.25,1) both; }
.edit-slide-leave-active { animation: editSlideUp   160ms cubic-bezier(0.4,0,1,1)       both; }
@keyframes editSlideDown { from { opacity:0; transform:translateY(-10px) scaleY(0.96); } to { opacity:1; transform:translateY(0) scaleY(1); } }
@keyframes editSlideUp   { from { opacity:1; transform:translateY(0) scaleY(1); } to { opacity:0; transform:translateY(-8px) scaleY(0.97); } }

.edit-panel { background:var(--bg-card); border:1px solid var(--accent); border-radius:14px; padding:14px 16px; margin-bottom:14px; box-shadow:0 4px 20px var(--accent-soft); transform-origin:top center; }
.edit-head { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.edit-title { display:flex; align-items:center; gap:7px; font-size:14px; font-weight:700; color:var(--text-primary); }
.edit-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.edit-select { background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:7px 10px; font-size:13px; color:var(--text-primary); cursor:pointer; outline:none; }
.edit-hint { font-size:12px; color:var(--text-muted); margin:8px 0 10px; }
.chooser { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
.chooser-row { display:flex; align-items:center; gap:6px; padding:5px 8px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); cursor:grab; transition:border-color 120ms; }
.chooser-row:hover { border-color:var(--accent); }
.chooser-row.drag-over { border-color:var(--accent); background:var(--accent-soft); }
.chooser-row.disabled { opacity:0.5; }
.chooser-grip { color:var(--text-muted); flex-shrink:0; }
.chooser-cb { width:15px; height:15px; accent-color:var(--accent); cursor:pointer; }
.chooser-label { flex:1; font-size:12px; font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.chooser-tag { color:var(--text-muted); flex-shrink:0; }
.chooser-na { font-size:10px; color:var(--text-muted); flex-shrink:0; }

/* assign modal */
.assign-list { display:flex; flex-direction:column; gap:8px; }
.assign-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid var(--border); }
.assign-row:last-child { border-bottom:none; }
.assign-user { display:flex; flex-direction:column; }
.assign-name { font-size:13.5px; font-weight:600; color:var(--text-primary); }
.assign-role { font-size:11px; color:var(--text-muted); text-transform:capitalize; }
.assign-sel { max-width:180px; }
.assign-conflict-banner { display:flex; align-items:flex-start; gap:8px; margin-top:12px; padding:10px 12px; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.35); border-radius:8px; font-size:12.5px; color:var(--text-primary); }

/* frozen first column */
:deep(.col-frozen) { position:sticky; left:0; background:var(--bg-card); z-index:1; }
:deep(.dt-row:hover .col-frozen) { background:var(--bg-app); }

/* row actions */
:deep(.row-action) { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms, color 100ms; }
:deep(.row-action:hover) { background:var(--border); color:var(--text-primary); }
.dt-actcol { width:96px; white-space:nowrap; }

/* page transitions */
.slide-left-enter-active, .slide-left-leave-active, .slide-right-enter-active, .slide-right-leave-active { transition:all 0.35s cubic-bezier(0.25,0.8,0.25,1); }
.slide-left-enter-from { opacity:0; transform:translateX(30px); }
.slide-left-leave-to   { opacity:0; transform:translateX(-30px); }
.slide-right-enter-from { opacity:0; transform:translateX(-30px); }
.slide-right-leave-to   { opacity:0; transform:translateX(30px); }
</style>
