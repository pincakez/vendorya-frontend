<template>
  <Teleport to="body">
    <div v-if="colDragMoved && colDragKey" class="col-drag-ghost" :style="{ left: colGhostX + 'px', top: colGhostY + 'px' }">
      {{ colByKey[colDragKey]?.label }}
    </div>
  </Teleport>
  <div class="sup">
    <div class="sup-head">
      <h1 class="sup-title">Suppliers</h1>
      <p class="sup-sub">Manage suppliers and track outstanding purchase balances</p>
    </div>

    <!-- STICKY TOOLBAR -->
    <div class="dt-toolbar">
      <div class="dt-search">
        <Search :size="15" class="dt-search-icon" />
        <input v-model="search" class="dt-search-input" placeholder="Search supplier…" @input="debouncedFetch" />
        <button v-show="search" class="dt-x" @click="clearSearch"><X :size="13" /></button>
      </div>

      <button v-if="hasAdhoc && !editing" class="dt-filter" title="Reset to assigned layout" @click="resetLayout">
        <RotateCcw :size="14" />
      </button>
      <button v-if="canEdit && !editing" class="dt-filter" @click="enterEdit">
        <Columns3 :size="14" /> Customize
      </button>
      <button v-if="canEdit && !editing" class="dt-filter" title="Assign layouts to staff" @click="openAssign">
        <UserCog :size="14" />
      </button>
      <button class="dt-add" @click="openNew">
        <Plus :size="15" /> Add Supplier
      </button>
    </div>

    <!-- CUSTOMIZE PANEL -->
    <Transition name="edit-slide">
      <div v-if="editing" class="edit-panel">
        <div class="edit-head">
          <span class="edit-title"><Columns3 :size="15" /> Customize columns</span>
          <div class="edit-actions">
            <select v-if="presets.length" class="edit-select" @change="(e) => { const p = presets.find(x => x.id === e.target.value); if (p) loadPreset(p); e.target.value = '' }">
              <option value="">Load preset…</option>
              <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button class="btn-ghost" @click="resetWorking">Reset</button>
            <button class="btn-ghost" @click="cancelEdit">Cancel</button>
            <button class="btn-ghost" @click="saveModal.open = true">Save preset</button>
            <button class="btn-primary" @click="doneEdit">Done</button>
          </div>
        </div>
        <p class="edit-hint">Drag to reorder · uncheck to hide · Name is locked.</p>
        <div class="chooser">
          <div
            v-for="key in working.order" :key="key" class="chooser-row"
            :class="{ 'drag-over': dragOver === key && dragKey !== key }"
            @pointerenter="dragOver = key"
          >
            <GripVertical :size="13" class="chooser-grip" @pointerdown.prevent="startDrag(key, $event)" />
            <input type="checkbox" class="chooser-cb" :checked="!working.hidden.includes(key)" :disabled="LOCKED.includes(key)" @change="toggleHidden(key)" />
            <span class="chooser-label">{{ colByKey[key]?.label ?? key }}</span>
            <Lock v-if="LOCKED.includes(key)" :size="11" class="chooser-tag" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- TABLE -->
    <div class="dt-card" :class="{ editing }">
      <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th
                v-for="col in displayColumns" :key="col.key"
                class="dt-th"
                :class="[col.align === 'right' ? 'ta-right' : '', col.sort ? 'sortable' : '',
                  colDragKey === col.key ? 'col-dragging' : '',
                  colDragOver === col.key && colDragKey !== col.key && colDragMoved ? 'col-drag-over' : '']"
                :style="{ width: colWidths[col.key] + 'px' }"
                @click="col.sort && handleSort(col)"
                @pointerdown="startColDrag(col.key, $event)"
                @pointerenter="colDragKey && (colDragOver = col.key)"
              >
                <span class="dt-th-inner" :class="{ jend: col.align === 'right' }">
                  <component v-if="col.align === 'right'" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                  {{ col.label }}
                  <component v-if="col.align !== 'right'" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                </span>
                <span class="dt-resize" @mousedown.stop.prevent="startResize(col.key, $event)" @click.stop></span>
              </th>
              <th class="dt-th ta-right dt-actcol">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!loading && !suppliers.length">
              <td :colspan="displayColumns.length + 1" class="dt-empty">
                <div class="dt-empty-inner">
                  <Building2 :size="40" class="dt-empty-icon" />
                  <div class="dt-empty-title">No suppliers found</div>
                  <div class="dt-empty-sub">Add suppliers to link them to purchase invoices.</div>
                </div>
              </td>
            </tr>
            <tr v-for="s in suppliers" :key="s.id" class="dt-row clickable" @click="router.push('/people/suppliers/' + s.id)">
              <td v-for="col in displayColumns" :key="col.key" :class="[col.cls, col.align === 'right' ? 'ta-right' : '']">
                <template v-if="col.key === 'name'">{{ s.name }}</template>
                <template v-else-if="col.key === 'prefix'">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span class="prefix-badge">{{ s.code_prefix }}</span>
                    <Lock v-if="s.prefix_locked" :size="11" class="lock-icon" title="Prefix is locked" />
                  </div>
                </template>
                <template v-else-if="col.key === 'contact'">{{ s.contact_info || '—' }}</template>
                <template v-else-if="col.key === 'balance'">
                  <span v-if="Number(s.balance) > 0" class="balance-owe"><Money :value="s.balance" /></span>
                  <span v-else class="balance-zero">—</span>
                </template>
              </td>
              <td class="ta-right dt-actcol" @click.stop>
                <button class="row-action" title="Edit supplier" @click="openEdit(s)"><Pencil :size="14" /></button>
                <button class="row-action danger" title="Delete supplier" @click="deleteSupplier(s.id)"><Trash2 :size="14" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="dt-foot">
        <div class="dt-perpage">
          <span>PER PAGE</span>
          <select v-model.number="pageSize" @change="fetchSuppliers(1); saveAdhoc()">
            <option :value="20">20</option><option :value="50">50</option><option :value="100">100</option>
          </select>
        </div>
        <div class="dt-showing">SHOWING {{ total === 0 ? 0 : from }}-{{ to }} OF {{ total }}</div>
        <div class="dt-pages">
          <button class="dt-pg" :disabled="page === 1" @click="goPage(page - 1)"><ChevronLeft :size="18" /></button>
          <span class="dt-pgnum">{{ page }} / {{ totalPages }}</span>
          <button class="dt-pg" :disabled="page >= totalPages" @click="goPage(page + 1)"><ChevronRight :size="18" /></button>
        </div>
      </div>
    </div>

    <!-- SAVE PRESET MODAL -->
    <AppModal :open="saveModal.open" title="Save preset" @close="saveModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">Preset name</label><input v-model="saveModal.name" class="form-input" placeholder="e.g. Manager view" /></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary);cursor:pointer;">
          <input type="checkbox" v-model="saveModal.is_default" /> Make this the store default
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="saveModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="!saveModal.name.trim()" @click="savePreset">Save</button>
      </template>
    </AppModal>

    <!-- ASSIGN MODAL -->
    <AppModal :open="assignModal.open" title="Assign layouts to staff" @close="assignModal.open = false">
      <div class="assign-list">
        <div v-for="row in assignModal.rows" :key="row.user_id" class="assign-row">
          <div class="assign-user"><span class="assign-name">{{ row.full_name }}</span><span class="assign-role">{{ row.role }}</span></div>
          <select v-model="row.preset_id" class="form-input assign-sel" @change="assignTo(row)">
            <option :value="null">— Default —</option>
            <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div v-if="!assignModal.rows.length" style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">No staff yet.</div>
      </div>
    </AppModal>

    <!-- NEW SUPPLIER MODAL -->
    <AppModal :open="newModal.open" title="New Supplier" @close="closeNew">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Supplier Name <span class="req">*</span></label>
          <input v-model="newModal.name" class="form-input" placeholder="e.g. Al-Nour Textiles" />
        </div>
        <div>
          <label class="form-label">Supplier Code Prefix <span class="req">*</span> <span class="label-hint">— 3 digits (100–999)</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input v-model="newModal.code_prefix" class="form-input" placeholder="e.g. 101" maxlength="3" style="width:90px;" @input="newModal.prefixCheck = null" />
            <button class="btn-check" :disabled="!newModal.code_prefix || newModal.code_prefix.length !== 3 || newModal.checkingPrefix" @click="checkNewPrefix">
              {{ newModal.checkingPrefix ? '…' : 'Check' }}
            </button>
            <span v-if="newModal.prefixCheck === true"  class="check-ok">Available</span>
            <span v-else-if="newModal.prefixCheck === false" class="check-taken">Already taken</span>
          </div>
          <p class="field-note">Once registered, the prefix is permanent — it's embedded in every SKU of this supplier.</p>
        </div>
        <div>
          <label class="form-label">Contact Info <span class="label-hint">(optional)</span></label>
          <textarea v-model="newModal.contact_info" class="form-input" rows="2" placeholder="Phone, email, address…" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeNew">Cancel</button>
        <button class="btn-primary" :disabled="!newModal.name.trim() || newModal.prefixCheck !== true" @click="openConfirm">Register Supplier</button>
      </template>
    </AppModal>

    <!-- CONFIRM PREFIX LOCK MODAL -->
    <AppModal :open="confirmModal.open" title="Confirm Prefix Registration" @close="confirmModal.open = false">
      <div class="confirm-body">
        <div class="confirm-icon"><Lock :size="22" /></div>
        <p class="confirm-text">Register prefix <strong>{{ newModal.code_prefix }}</strong> for <strong>{{ newModal.name }}</strong>?</p>
        <p class="confirm-warn">This cannot be changed after confirmation. The prefix will be embedded in all SKUs generated for this supplier.</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="confirmModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="submitNew">{{ saving ? 'Creating…' : 'Confirm & Register' }}</button>
      </template>
    </AppModal>

    <!-- EDIT SUPPLIER MODAL -->
    <AppModal :open="editModal.open" title="Edit Supplier" @close="closeEdit">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">Supplier Name</label><input v-model="editModal.name" class="form-input" /></div>
        <div>
          <label class="form-label">Supplier Code Prefix</label>
          <div style="display:flex;align-items:center;gap:8px;">
            <input :value="editModal.code_prefix" class="form-input locked-input" style="width:90px;" disabled />
            <Lock :size="13" class="lock-icon" />
            <span style="font-size:12px;color:var(--text-muted);">Locked — embedded in all SKUs</span>
          </div>
        </div>
        <div><label class="form-label">Contact Info <span class="label-hint">(optional)</span></label><textarea v-model="editModal.contact_info" class="form-input" rows="2" /></div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeEdit">Cancel</button>
        <button class="btn-primary" :disabled="!editModal.name.trim() || saving" @click="saveEdit">{{ saving ? 'Saving…' : 'Save Changes' }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, X, Building2, Pencil, Trash2, Plus, Lock,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown,
  Columns3, GripVertical, UserCog, RotateCcw,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'

const auth   = useAuthStore()
const router = useRouter()

/* ── columns ── */
const BASE_COLUMNS = [
  { key: 'name',    label: 'NAME',                sort: 'name',    align: 'left',  field: 'name',         cls: 'c-name' },
  { key: 'prefix',  label: 'PREFIX',              sort: null,      align: 'left',  field: 'code_prefix',  cls: 'c-prefix' },
  { key: 'contact', label: 'CONTACT',             sort: null,      align: 'left',  field: 'contact_info', cls: 'c-contact' },
  { key: 'balance', label: 'OUTSTANDING BALANCE', sort: 'balance', align: 'right', field: 'balance',      cls: 'c-mono' },
]

const DEFAULT_WIDTHS = { name: 240, prefix: 120, contact: 260, balance: 200 }
const colWidths = reactive({ ...DEFAULT_WIDTHS })

const TABLE_ID  = 'people_suppliers'
const ADHOC_KEY = 'dt_people_suppliers_adhoc'
const LOCKED    = ['name']
const colByKey  = computed(() => Object.fromEntries(BASE_COLUMNS.map(c => [c.key, c])))

const colOrder  = ref(BASE_COLUMNS.map(c => c.key))
const colHidden = ref([])

const editing = ref(false)
const working = reactive({ order: [], hidden: [] })
const activeOrder  = computed(() => editing.value ? working.order  : colOrder.value)
const activeHidden = computed(() => editing.value ? working.hidden : colHidden.value)

const displayColumns = computed(() =>
  activeOrder.value.filter(k => !activeHidden.value.includes(k)).map(k => colByKey.value[k]).filter(Boolean)
)
const tableMin = computed(() => displayColumns.value.reduce((a, c) => a + colWidths[c.key], 0) + 80)
const canEdit  = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole) || auth.isSuperadmin)

/* ── layout / presets ── */
const baseConfig = ref(null)
const hasAdhoc   = ref(!!localStorage.getItem(ADHOC_KEY))

function applyLayout(cfg) {
  if (!cfg) return
  const known = BASE_COLUMNS.map(c => c.key)
  if (Array.isArray(cfg.order) && cfg.order.length) {
    const ordered = cfg.order.filter(k => known.includes(k))
    for (const k of known) if (!ordered.includes(k)) ordered.push(k)
    colOrder.value = ordered
  }
  colHidden.value = (cfg.hidden || []).filter(k => !LOCKED.includes(k))
  if (cfg.widths) Object.assign(colWidths, cfg.widths)
  if (cfg.sort?.key) { sortKey.value = cfg.sort.key; sortDir.value = cfg.sort.dir || 'asc' }
  if (cfg.page_size) pageSize.value = cfg.page_size
}
function currentConfig() {
  return { order: colOrder.value, hidden: colHidden.value, widths: { ...colWidths },
    sort: sortKey.value ? { key: sortKey.value, dir: sortDir.value } : null, page_size: pageSize.value }
}
function saveAdhoc() { if (!editing.value) { localStorage.setItem(ADHOC_KEY, JSON.stringify(currentConfig())); hasAdhoc.value = true } }

async function loadLayout() {
  const adhoc = JSON.parse(localStorage.getItem(ADHOC_KEY) || 'null')
  try {
    const { data } = await api.get('/api/smart/presets/effective/', { params: { table_id: TABLE_ID } })
    baseConfig.value = data?.config ? data.config : null
  } catch { baseConfig.value = null }
  applyLayout(adhoc || baseConfig.value)
  fetchSuppliers(1)
}
function resetLayout() {
  localStorage.removeItem(ADHOC_KEY); hasAdhoc.value = false
  colOrder.value = BASE_COLUMNS.map(c => c.key); colHidden.value = []
  Object.assign(colWidths, DEFAULT_WIDTHS); sortKey.value = null; sortDir.value = 'asc'
  applyLayout(baseConfig.value); fetchSuppliers(1)
}
function resetWorking() { working.order = BASE_COLUMNS.map(c => c.key); working.hidden = [] }

/* ── edit mode ── */
function enterEdit() { working.order = [...colOrder.value]; working.hidden = [...colHidden.value]; editing.value = true; fetchPresets() }
function cancelEdit() { editing.value = false }
function doneEdit()   { colOrder.value = [...working.order]; colHidden.value = [...working.hidden]; editing.value = false; saveAdhoc() }
function toggleHidden(key) {
  if (LOCKED.includes(key)) return
  const i = working.hidden.indexOf(key)
  if (i >= 0) working.hidden.splice(i, 1); else working.hidden.push(key)
}
const dragKey  = ref(null)
const dragOver = ref(null)
function startDrag(key) { dragKey.value = key; dragOver.value = key; document.addEventListener('pointerup', endDrag, { once: true }) }
function endDrag() {
  if (dragKey.value && dragOver.value && dragKey.value !== dragOver.value) reorder(dragKey.value, dragOver.value)
  dragKey.value = null; dragOver.value = null
}
function reorder(fromKey, toKey) {
  const arr = [...working.order]; arr.splice(arr.indexOf(fromKey), 1); arr.splice(arr.indexOf(toKey), 0, fromKey); working.order = arr
}

/* ── presets ── */
const presets     = ref([])
const saveModal   = reactive({ open: false, name: '', is_default: false })
const assignModal = reactive({ open: false, rows: [] })

async function fetchPresets() { try { const { data } = await api.get('/api/smart/presets/', { params: { table_id: TABLE_ID } }); presets.value = data.results ?? data } catch { /* noop */ } }
function loadPreset(p) {
  const known = BASE_COLUMNS.map(c => c.key)
  const ordered = (p.config.order || known).filter(k => known.includes(k))
  for (const k of known) if (!ordered.includes(k)) ordered.push(k)
  working.order = ordered; working.hidden = (p.config.hidden || []).filter(k => !LOCKED.includes(k))
  if (p.config.widths) Object.assign(colWidths, p.config.widths)
}
async function savePreset() {
  if (!saveModal.name.trim()) return
  await api.post('/api/smart/presets/', { table_id: TABLE_ID, name: saveModal.name.trim(), config: currentConfig(), is_default: saveModal.is_default })
  saveModal.open = false; saveModal.name = ''; saveModal.is_default = false
  await fetchPresets(); doneEdit()
}
async function openAssign() {
  if (!presets.value.length) await fetchPresets()
  const { data } = await api.get('/api/smart/presets/assignments/', { params: { table_id: TABLE_ID } })
  assignModal.rows = data; assignModal.open = true
}
async function assignTo(row) {
  await api.post('/api/smart/presets/assignments/', { user_id: row.user_id, table_id: TABLE_ID, preset_id: row.preset_id || null })
}

/* ── column header drag ── */
const colDragKey   = ref(null)
const colDragOver  = ref(null)
const colDragMoved = ref(false)
const colGhostX    = ref(0)
const colGhostY    = ref(0)
let colDragStartX  = 0
let suppressNextSort = false

function startColDrag(key, e) {
  const rect = e.currentTarget.getBoundingClientRect()
  if (e.clientX > rect.right - 10) return
  colDragKey.value = key; colDragOver.value = key; colDragMoved.value = false; colDragStartX = e.clientX
  document.addEventListener('pointermove', onColDragMove)
  document.addEventListener('pointerup', onColDragEnd, { once: true })
}
function onColDragMove(e) {
  if (!colDragKey.value) return
  colGhostX.value = e.clientX + 14; colGhostY.value = e.clientY - 18
  if (!colDragMoved.value && Math.abs(e.clientX - colDragStartX) > 5) colDragMoved.value = true
}
function onColDragEnd() {
  document.removeEventListener('pointermove', onColDragMove)
  if (colDragMoved.value && colDragKey.value && colDragOver.value && colDragKey.value !== colDragOver.value) {
    const arr = [...colOrder.value]
    arr.splice(arr.indexOf(colDragKey.value), 1); arr.splice(arr.indexOf(colDragOver.value), 0, colDragKey.value)
    colOrder.value = arr; saveAdhoc(); suppressNextSort = true; setTimeout(() => { suppressNextSort = false }, 50)
  }
  colDragKey.value = null; colDragOver.value = null; colDragMoved.value = false
}

/* ── sort ── */
const sortKey = ref(null)
const sortDir = ref('asc')
function handleSort(col) {
  if (suppressNextSort) return
  if (sortKey.value === col.key) { if (sortDir.value === 'asc') sortDir.value = 'desc'; else { sortKey.value = null; sortDir.value = 'asc' } }
  else { sortKey.value = col.key; sortDir.value = 'asc' }
  fetchSuppliers(1); saveAdhoc()
}
function arrowFor(col) {
  if (sortKey.value !== col.key) return ArrowUpDown
  return sortDir.value === 'asc' ? ArrowUp : ArrowDown
}

/* ── resize ── */
let rz = null
function startResize(key, e) { rz = { key, x: e.clientX, w: colWidths[key] }; document.addEventListener('mousemove', onResize); document.addEventListener('mouseup', endResize) }
function onResize(e) { if (!rz) return; colWidths[rz.key] = Math.max(60, rz.w + (e.clientX - rz.x)) }
function endResize() { rz = null; document.removeEventListener('mousemove', onResize); document.removeEventListener('mouseup', endResize); saveAdhoc() }

/* ── data ── */
const suppliers = ref([])
const loading   = ref(false)
const total     = ref(0)
const page      = ref(1)
const pageSize  = ref(20)
const search    = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const from = computed(() => (page.value - 1) * pageSize.value + 1)
const to   = computed(() => Math.min(page.value * pageSize.value, total.value))

async function fetchSuppliers(p = 1) {
  loading.value = true; page.value = p
  try {
    const params = { page: p, page_size: pageSize.value }
    if (search.value) params.search = search.value
    if (sortKey.value) {
      const col = BASE_COLUMNS.find(c => c.key === sortKey.value)
      if (col?.sort) params.ordering = (sortDir.value === 'desc' ? '-' : '') + col.sort
    }
    const res = await api.get('/api/inventory/suppliers/', { params })
    suppliers.value = res.data.results ?? res.data
    total.value     = res.data.count ?? suppliers.value.length
  } catch { suppliers.value = [] } finally { loading.value = false }
}
function goPage(p) { if (p < 1 || p > totalPages.value) return; fetchSuppliers(p) }

let searchTimer = null
function debouncedFetch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => fetchSuppliers(1), 300) }
function clearSearch() { search.value = ''; fetchSuppliers(1) }

/* ── CRUD ── */
const saving = ref(false)
const newModal = reactive({ open: false, name: '', code_prefix: '', contact_info: '', prefixCheck: null, checkingPrefix: false })
const confirmModal = reactive({ open: false })
const editModal    = reactive({ open: false, id: null, name: '', code_prefix: '', contact_info: '' })

function suggestPrefix() { return String(Math.floor(Math.random() * 900) + 100) }
function openNew() { Object.assign(newModal, { open: true, name: '', code_prefix: suggestPrefix(), contact_info: '', prefixCheck: null, checkingPrefix: false }) }
function closeNew() { newModal.open = false }

async function checkNewPrefix() {
  newModal.checkingPrefix = true; newModal.prefixCheck = null
  try { const res = await api.get('/api/inventory/suppliers/check-prefix/', { params: { prefix: newModal.code_prefix } }); newModal.prefixCheck = res.data.available }
  catch { newModal.prefixCheck = false } finally { newModal.checkingPrefix = false }
}
function openConfirm() { confirmModal.open = true }
async function submitNew() {
  saving.value = true
  try {
    await api.post('/api/inventory/suppliers/', { name: newModal.name, code_prefix: newModal.code_prefix, contact_info: newModal.contact_info || '' })
    confirmModal.open = false; closeNew(); fetchSuppliers(1)
  } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error creating supplier') } finally { saving.value = false }
}

function openEdit(s) { Object.assign(editModal, { open: true, id: s.id, name: s.name, code_prefix: s.code_prefix, contact_info: s.contact_info || '' }) }
function closeEdit() { editModal.open = false }
async function saveEdit() {
  saving.value = true
  try { await api.patch(`/api/inventory/suppliers/${editModal.id}/`, { name: editModal.name, contact_info: editModal.contact_info || '' }); closeEdit(); fetchSuppliers(page.value) }
  catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving supplier') } finally { saving.value = false }
}

async function deleteSupplier(id) {
  if (!confirm('Delete this supplier? This cannot be undone.')) return
  try { await api.delete(`/api/inventory/suppliers/${id}/`); fetchSuppliers(page.value) }
  catch (e) { alert(e.response?.data?.detail || 'Cannot delete — supplier may have linked purchases.') }
}

onMounted(() => { loadLayout() })
</script>

<style scoped>
.sup-head  { margin-bottom: 18px; }
.sup-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin: 0 0 4px; }
.sup-sub   { font-size: 13.5px; color: var(--text-muted); margin: 0; }

/* Table + toolbar styles are global — see .dt* in src/assets/main.css */

.edit-slide-enter-active { animation: editSlideDown 220ms cubic-bezier(0.25,0.8,0.25,1) both; }
.edit-slide-leave-active { animation: editSlideUp   160ms cubic-bezier(0.4,0,1,1)       both; }
@keyframes editSlideDown { from { opacity: 0; transform: translateY(-10px) scaleY(0.96); } to { opacity: 1; transform: translateY(0) scaleY(1); } }
@keyframes editSlideUp   { from { opacity: 1; transform: translateY(0) scaleY(1); } to { opacity: 0; transform: translateY(-8px) scaleY(0.97); } }
.edit-panel { background: var(--bg-card); border: 1px solid var(--accent); border-radius: 14px; padding: 14px 16px; margin-bottom: 14px; box-shadow: 0 4px 20px var(--accent-soft); transform-origin: top center; }
.edit-head  { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.edit-title { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.edit-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.edit-select { background: var(--bg-app); border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 13px; color: var(--text-primary); cursor: pointer; outline: none; }
.edit-hint { font-size: 12px; color: var(--text-muted); margin: 8px 0 10px; }
.chooser { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.chooser-row { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-app); cursor: grab; transition: border-color 120ms; }
.chooser-row:hover, .chooser-row.drag-over { border-color: var(--accent); background: var(--accent-soft); }
.chooser-grip { color: var(--text-muted); flex-shrink: 0; }
.chooser-cb   { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.chooser-label { flex: 1; font-size: 12px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chooser-tag   { color: var(--text-muted); flex-shrink: 0; }

.dt-actcol { width: 80px; white-space: nowrap; }   /* page-specific action-column width */

.assign-list { display: flex; flex-direction: column; gap: 8px; }
.assign-row  { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.assign-row:last-child { border-bottom: none; }
.assign-user { display: flex; flex-direction: column; }
.assign-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.assign-role { font-size: 11px; color: var(--text-muted); text-transform: capitalize; }
.assign-sel  { max-width: 180px; }

.c-name    { font-weight: 600; }
.c-prefix  { }
.c-contact { color: var(--text-muted); font-size: 12.5px; }
.c-mono    { font-family: ui-monospace, monospace; font-size: 13.5px; font-variant-numeric: tabular-nums; }
.balance-owe  { font-weight: 600; color: #dc2626; font-variant-numeric: tabular-nums; font-size: 12.5px; }
.balance-zero { color: var(--text-muted); }
.prefix-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; background: var(--bg-app); border: 1px solid var(--border); font-family: monospace; font-size: 12px; font-weight: 700; color: var(--text-secondary); }
.lock-icon    { color: var(--text-muted); flex-shrink: 0; }
.locked-input { opacity: .6; cursor: not-allowed; background: var(--border); }

.row-action { width: 28px; height: 28px; border: none; background: none; border-radius: 6px; cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; transition: background 100ms, color 100ms; }
.row-action:hover { background: var(--border); color: var(--text-primary); }
.row-action.danger:hover { background: #fee2e2; color: #dc2626; }
.form-label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }
.label-hint { font-weight: 400; color: var(--text-muted); }
.req { color: #dc2626; font-weight: 700; }
.form-input { width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-app); color: var(--text-primary); font-size: 13px; outline: none; box-sizing: border-box; transition: border-color 120ms; resize: vertical; }
.form-input:focus { border-color: var(--accent); }
.field-note  { margin: 4px 0 0; font-size: 11.5px; color: var(--text-muted); line-height: 1.4; }
.btn-check { padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-app); color: var(--text-primary); font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 100ms, border-color 100ms; flex-shrink: 0; }
.btn-check:hover:not(:disabled) { background: rgba(247,143,30,0.08); border-color: var(--accent); color: var(--accent); }
.btn-check:disabled { opacity: .5; cursor: default; }
.check-ok    { font-size: 12px; font-weight: 600; color: #16a34a; white-space: nowrap; }
.check-taken { font-size: 12px; font-weight: 600; color: #dc2626; white-space: nowrap; }
.confirm-body { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0 4px; text-align: center; }
.confirm-icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(247,143,30,0.1); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.confirm-text { font-size: 15px; font-weight: 500; color: var(--text-primary); margin: 0; line-height: 1.5; }
.confirm-warn { font-size: 12.5px; color: var(--text-muted); margin: 0; max-width: 320px; line-height: 1.5; }
</style>

<style>
.col-drag-ghost {
  position: fixed; pointer-events: none; z-index: 9999;
  background: var(--bg-card, #fff); border: 1.5px solid var(--accent, #f78f1e);
  border-radius: 8px; padding: 6px 14px; font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .08em; color: var(--accent, #f78f1e);
  box-shadow: 0 8px 28px rgba(0,0,0,.18); white-space: nowrap;
  transform: rotate(-2deg) scale(1.04); transition: none;
}
</style>
