<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.storage.title') }}</h1>
        <p class="page-sub">{{ t('inventory.storage.sub') }}</p>
      </div>
      <button v-if="canManage && tab === 'locations'" class="btn-primary" @click="openLocation()">
        <Plus :size="15" /> {{ t('inventory.storage.add_location') }}
      </button>
    </div>

    <!-- Sub-tabs -->
    <div class="tab-bar">
      <button
        v-for="tb in tabs" :key="tb.id"
        class="tab-btn" :class="{ active: tab === tb.id }"
        @click="tab = tb.id"
      >
        <component :is="tb.icon" :size="15" /> {{ tb.label }}
      </button>
    </div>

    <!-- ── LOCATIONS ─────────────────────────────────────────── -->
    <div v-if="tab === 'locations'" class="table-wrap">
      <div v-if="locLoading" class="table-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>{{ t('inventory.storage.loc_name') }}</th>
            <th>{{ t('inventory.storage.loc_description') }}</th>
            <th>{{ t('inventory.storage.loc_status') }}</th>
            <th v-if="canManage" style="text-align:right;">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="locations.length === 0">
            <td :colspan="canManage ? 4 : 3" class="table-empty">
              <Archive :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>{{ t('inventory.storage.no_locations') }}</div>
            </td>
          </tr>
          <tr v-for="l in locations" :key="l.id" class="table-row">
            <td class="col-name">{{ l.name }}</td>
            <td class="col-muted">{{ l.description || '—' }}</td>
            <td>
              <span class="status-pill" :class="l.is_active ? 'status-on' : 'status-off'">
                {{ l.is_active ? t('inventory.storage.active') : t('inventory.storage.inactive') }}
              </span>
            </td>
            <td v-if="canManage" style="text-align:right;white-space:nowrap;">
              <button class="row-btn" :title="t('common.edit')" @click="openLocation(l)"><Pencil :size="14" /></button>
              <button class="row-btn row-btn-danger" :title="t('common.delete')" @click="deleteLocation(l)"><Trash2 :size="14" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── CONTENTS ──────────────────────────────────────────── -->
    <div v-else-if="tab === 'contents'">
      <div class="contents-bar">
        <label class="form-label" style="margin:0;">{{ t('inventory.storage.location') }}</label>
        <select v-model="contentsLoc" class="form-input" style="max-width:280px;" @change="fetchContents">
          <option value="">{{ t('inventory.storage.select_location') }}</option>
          <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
      </div>

      <div class="table-wrap">
        <div v-if="contentsLoading" class="table-skeleton">
          <div v-for="i in 4" :key="i" class="skeleton-row" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>{{ t('inventory.storage.col_product') }}</th>
              <th>{{ t('inventory.storage.col_sku') }}</th>
              <th style="text-align:right;">{{ t('inventory.storage.col_qty') }}</th>
              <th style="text-align:right;">{{ t('inventory.storage.col_cost') }}</th>
              <th style="text-align:right;">{{ t('inventory.storage.col_value') }}</th>
              <th style="text-align:right;">{{ t('inventory.storage.col_days') }}</th>
              <th v-if="canManage" style="text-align:right;">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!contentsLoc">
              <td :colspan="canManage ? 7 : 6" class="table-empty">
                <Boxes :size="32" style="opacity:.3;margin-bottom:8px;" />
                <div>{{ t('inventory.storage.pick_location') }}</div>
              </td>
            </tr>
            <tr v-else-if="contents.length === 0">
              <td :colspan="canManage ? 7 : 6" class="table-empty">
                <Boxes :size="32" style="opacity:.3;margin-bottom:8px;" />
                <div>{{ t('inventory.storage.empty_location') }}</div>
              </td>
            </tr>
            <tr v-for="s in contents" :key="s.id" class="table-row">
              <td class="col-name">{{ s.product_name }}</td>
              <td class="col-ref">{{ s.variant_sku }}</td>
              <td style="text-align:right;font-variant-numeric:tabular-nums;">{{ formatQty(s.quantity_remaining) }}</td>
              <td style="text-align:right;"><Money :value="s.cost_at_move" /></td>
              <td style="text-align:right;"><Money :value="layerValue(s)" /></td>
              <td style="text-align:right;">
                <span class="days-pill" :class="{ 'days-old': s.days_in_storage >= 180 }">{{ s.days_in_storage }}</span>
              </td>
              <td v-if="canManage" style="text-align:right;white-space:nowrap;">
                <button class="row-btn" @click="openRetrieve(s)">{{ t('inventory.storage.retrieve') }}</button>
                <button v-if="canWriteOff" class="row-btn row-btn-danger" @click="openWriteOff(s)">{{ t('inventory.storage.write_off') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── MOVE TO STORAGE ───────────────────────────────────── -->
    <div v-else-if="tab === 'move'" class="move-panel">
      <div class="move-card">
        <div class="field">
          <label class="form-label">{{ t('inventory.storage.move_product') }}</label>
          <input
            v-model="move.search" class="form-input"
            :placeholder="t('inventory.storage.move_product_placeholder')"
            @input="searchVariants"
          />
          <div v-if="variantResults.length" class="search-dropdown">
            <div v-for="v in variantResults" :key="v.id" class="search-item" @click="selectVariant(v)">
              <span class="search-item-name">{{ v.product_name }}</span>
              <span class="search-item-sku">{{ v.sku }}</span>
            </div>
          </div>
          <div v-if="move.variantId" class="selected-chip">
            <CheckCircle :size="13" /> {{ move.search }}
          </div>
        </div>

        <div class="field-grid">
          <div class="field">
            <label class="form-label">{{ t('inventory.storage.move_qty') }}</label>
            <input v-model="move.quantity" type="number" step="0.001" min="0" class="form-input" :placeholder="t('inventory.storage.move_qty_placeholder')" />
          </div>
          <div class="field">
            <label class="form-label">{{ t('inventory.storage.move_from_branch') }}</label>
            <select v-model="move.fromBranch" class="form-input">
              <option value="">{{ t('inventory.storage.select_branch') }}</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label class="form-label">{{ t('inventory.storage.move_to_location') }}</label>
          <select v-model="move.location" class="form-input">
            <option value="">{{ t('inventory.storage.select_location') }}</option>
            <option v-for="l in activeLocations" :key="l.id" :value="l.id">{{ l.name }}</option>
          </select>
        </div>

        <div class="field">
          <label class="form-label">{{ t('inventory.storage.reason') }} <span class="optional">{{ t('common.optional') }}</span></label>
          <textarea v-model="move.reason" class="form-input" rows="2" :placeholder="t('inventory.storage.reason_placeholder')" />
        </div>

        <div class="move-actions">
          <button class="btn-primary" :disabled="!canMove || moving" @click="submitMove">
            <Archive :size="15" />
            {{ moving ? t('common.saving') : t('inventory.storage.move_submit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Location create/edit modal -->
    <AppModal :open="locModal.open" :title="locModal.id ? t('inventory.storage.edit_location') : t('inventory.storage.add_location')" @close="locModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('inventory.storage.loc_name') }}</label>
          <input v-model="locModal.name" class="form-input" :placeholder="t('inventory.storage.loc_name_placeholder')" />
        </div>
        <div>
          <label class="form-label">{{ t('inventory.storage.loc_description') }} <span class="optional">{{ t('common.optional') }}</span></label>
          <textarea v-model="locModal.description" class="form-input" rows="2" />
        </div>
        <label class="check-row">
          <input type="checkbox" v-model="locModal.is_active" />
          <span>{{ t('inventory.storage.loc_is_active') }}</span>
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="locModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!locModal.name.trim() || savingLoc" @click="saveLocation">
          {{ savingLoc ? t('common.saving') : t('common.save') }}
        </button>
      </template>
    </AppModal>

    <!-- Retrieve modal -->
    <AppModal :open="retr.open" :title="t('inventory.storage.retrieve_title')" @close="retr.open = false">
      <div v-if="retr.layer" style="display:flex;flex-direction:column;gap:14px;">
        <p class="modal-line">{{ retr.layer.product_name }} <span class="col-ref">{{ retr.layer.variant_sku }}</span></p>
        <p class="form-hint">{{ t('inventory.storage.in_storage', { qty: formatQty(retr.layer.quantity_remaining) }) }}</p>
        <div class="field-grid">
          <div class="field">
            <label class="form-label">{{ t('inventory.storage.qty_to_retrieve') }}</label>
            <input v-model="retr.quantity" type="number" step="0.001" min="0" :max="retr.layer.quantity_remaining" class="form-input" />
          </div>
          <div class="field">
            <label class="form-label">{{ t('inventory.storage.to_branch') }}</label>
            <select v-model="retr.toBranch" class="form-input">
              <option value="">{{ t('inventory.storage.select_branch') }}</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="form-label">{{ t('inventory.storage.reason') }} <span class="optional">{{ t('common.optional') }}</span></label>
          <textarea v-model="retr.reason" class="form-input" rows="2" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="retr.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!canRetrieve || retrieving" @click="submitRetrieve">
          {{ retrieving ? t('common.saving') : t('inventory.storage.retrieve') }}
        </button>
      </template>
    </AppModal>

    <!-- Write-off modal -->
    <AppModal :open="wo.open" :title="t('inventory.storage.write_off_title')" @close="wo.open = false">
      <div v-if="wo.layer" style="display:flex;flex-direction:column;gap:14px;">
        <p class="modal-line">{{ wo.layer.product_name }} <span class="col-ref">{{ wo.layer.variant_sku }}</span></p>
        <div class="wo-warning">{{ t('inventory.storage.write_off_warning') }}</div>
        <div class="field">
          <label class="form-label">{{ t('inventory.storage.qty_to_write_off') }}</label>
          <input v-model="wo.quantity" type="number" step="0.001" min="0" :max="wo.layer.quantity_remaining" class="form-input" />
          <p class="form-hint">{{ t('inventory.storage.in_storage', { qty: formatQty(wo.layer.quantity_remaining) }) }}</p>
        </div>
        <div class="field">
          <label class="form-label">{{ t('inventory.storage.reason') }}</label>
          <textarea v-model="wo.reason" class="form-input" rows="2" :placeholder="t('inventory.storage.write_off_reason_placeholder')" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="wo.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-danger" :disabled="!canWO || writingOff" @click="submitWriteOff">
          {{ writingOff ? t('common.saving') : t('inventory.storage.write_off') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, Archive, Boxes, CheckCircle, ArrowDownToLine } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'
import Money from '@/components/ui/Money.vue'
import { formatQty } from '@/utils/format'

const { t } = useI18n()
const auth = useAuthStore()

const ROLE_RANK = { CASHIER: 1, MANAGER: 2, ADMIN: 3, OWNER: 4 }
const myRank = computed(() => auth.isSuperadmin ? 4 : (ROLE_RANK[auth.userRole] || 0))
const canManage   = computed(() => myRank.value >= 2)   // MANAGER+
const canWriteOff = computed(() => myRank.value >= 3)   // ADMIN+

const tab = ref('locations')
const tabs = computed(() => [
  { id: 'locations', label: t('inventory.storage.tab_locations'), icon: Archive },
  { id: 'contents',  label: t('inventory.storage.tab_contents'),  icon: Boxes },
  { id: 'move',      label: t('inventory.storage.tab_move'),      icon: ArrowDownToLine },
])

const locations = ref([])
const branches  = ref([])
const activeLocations = computed(() => locations.value.filter(l => l.is_active))

/* ── Locations ─────────────────────────────────────────────── */
const locLoading = ref(false)
async function fetchLocations() {
  locLoading.value = true
  try {
    const res = await api.get('/api/inventory/storage-locations/')
    locations.value = res.data.results ?? res.data
  } finally { locLoading.value = false }
}

const locModal = reactive({ open: false, id: '', name: '', description: '', is_active: true })
const savingLoc = ref(false)
function openLocation(l = null) {
  Object.assign(locModal, l
    ? { open: true, id: l.id, name: l.name, description: l.description || '', is_active: l.is_active }
    : { open: true, id: '', name: '', description: '', is_active: true })
}
async function saveLocation() {
  savingLoc.value = true
  try {
    const body = { name: locModal.name.trim(), description: locModal.description, is_active: locModal.is_active }
    if (locModal.id) await api.patch(`/api/inventory/storage-locations/${locModal.id}/`, body)
    else await api.post('/api/inventory/storage-locations/', body)
    locModal.open = false
    fetchLocations()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : t('inventory.storage.err_save'))
  } finally { savingLoc.value = false }
}
async function deleteLocation(l) {
  if (!confirm(t('inventory.storage.confirm_delete_location', { name: l.name }))) return
  try {
    await api.delete(`/api/inventory/storage-locations/${l.id}/`)
    fetchLocations()
    if (contentsLoc.value === l.id) { contentsLoc.value = ''; contents.value = [] }
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : t('inventory.storage.err_save'))
  }
}

/* ── Contents ──────────────────────────────────────────────── */
const contentsLoc = ref('')
const contents = ref([])
const contentsLoading = ref(false)
async function fetchContents() {
  if (!contentsLoc.value) { contents.value = []; return }
  contentsLoading.value = true
  try {
    const res = await api.get(`/api/inventory/storage-locations/${contentsLoc.value}/contents/`)
    contents.value = res.data.results ?? res.data
  } finally { contentsLoading.value = false }
}
function layerValue(s) {
  return (Number(s.quantity_remaining) || 0) * (Number(s.cost_at_move) || 0)
}

/* ── Retrieve ──────────────────────────────────────────────── */
const retr = reactive({ open: false, layer: null, quantity: '', toBranch: '', reason: '' })
const retrieving = ref(false)
const canRetrieve = computed(() =>
  retr.layer && Number(retr.quantity) > 0 &&
  Number(retr.quantity) <= Number(retr.layer.quantity_remaining) && retr.toBranch)
function openRetrieve(layer) {
  Object.assign(retr, { open: true, layer, quantity: '', toBranch: '', reason: '' })
}
async function submitRetrieve() {
  retrieving.value = true
  try {
    await api.post('/api/inventory/storage/retrieve/', {
      variant: retr.layer.variant,
      quantity: retr.quantity,
      to_branch: retr.toBranch,
      storage_location: contentsLoc.value,
      reason: retr.reason,
    })
    retr.open = false
    fetchContents()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : t('inventory.storage.err_save'))
  } finally { retrieving.value = false }
}

/* ── Write-off ─────────────────────────────────────────────── */
const wo = reactive({ open: false, layer: null, quantity: '', reason: '' })
const writingOff = ref(false)
const canWO = computed(() =>
  wo.layer && Number(wo.quantity) > 0 &&
  Number(wo.quantity) <= Number(wo.layer.quantity_remaining) && wo.reason.trim())
function openWriteOff(layer) {
  Object.assign(wo, { open: true, layer, quantity: '', reason: '' })
}
async function submitWriteOff() {
  writingOff.value = true
  try {
    await api.post('/api/inventory/storage/write-off/', {
      variant: wo.layer.variant,
      quantity: wo.quantity,
      storage_location: contentsLoc.value,
      reason: wo.reason,
    })
    wo.open = false
    fetchContents()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : t('inventory.storage.err_save'))
  } finally { writingOff.value = false }
}

/* ── Move to storage ───────────────────────────────────────── */
const move = reactive({ search: '', variantId: '', quantity: '', fromBranch: '', location: '', reason: '' })
const moving = ref(false)
const variantResults = ref([])
let searchTimer = null
const canMove = computed(() =>
  move.variantId && Number(move.quantity) > 0 && move.fromBranch && move.location)

function searchVariants() {
  clearTimeout(searchTimer)
  move.variantId = ''
  if (!move.search.trim()) { variantResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const res = await api.get('/api/inventory/products/', { params: { search: move.search, page_size: 8 } })
    const products = res.data.results ?? res.data
    variantResults.value = products
      .filter(p => p.default_variant_id)
      .map(p => ({ id: p.default_variant_id, sku: p.sku_display || '', product_name: p.name }))
      .slice(0, 8)
  }, 280)
}
async function selectVariant(v) {
  move.variantId = v.id
  move.search = `${v.product_name} — ${v.sku}`
  variantResults.value = []
}
async function submitMove() {
  moving.value = true
  try {
    await api.post('/api/inventory/storage/move-to/', {
      variant: move.variantId,
      quantity: move.quantity,
      from_branch: move.fromBranch,
      storage_location: move.location,
      reason: move.reason,
    })
    Object.assign(move, { search: '', variantId: '', quantity: '', fromBranch: '', location: '', reason: '' })
    alert(t('inventory.storage.move_done'))
    if (contentsLoc.value) fetchContents()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : t('inventory.storage.err_save'))
  } finally { moving.value = false }
}

async function fetchBranches() {
  const res = await api.get('/api/core/branches/')
  branches.value = res.data.results ?? res.data
}

onMounted(() => { fetchLocations(); fetchBranches() })
</script>

<style scoped>
/* Sub-tabs */
.tab-bar { display:flex; gap:4px; margin:18px 0 16px; border-bottom:1px solid var(--border); }
.tab-btn {
  display:flex; align-items:center; gap:6px; padding:9px 14px; border:none; background:none;
  cursor:pointer; font-size:13px; font-weight:600; color:var(--text-muted); font-family:inherit;
  border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms, border-color 120ms;
}
.tab-btn:hover { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }

/* Table (shared look with other inventory views) */
.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:var(--border); animation:shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

.col-name  { font-weight:500; }
.col-ref   { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-muted { color:var(--text-muted); font-size:12.5px; }

.status-pill { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
.status-on  { background:var(--success-soft); color:#166534; }
.status-off { background:var(--border); color:var(--text-muted); }

.days-pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; background:var(--bg-app); color:var(--text-muted); }
.days-pill.days-old { background:var(--warning-soft); color:#92400e; }

.row-btn {
  background:var(--bg-app); border:1px solid var(--border); border-radius:7px; padding:5px 10px;
  font-size:12px; font-weight:600; color:var(--text-primary); cursor:pointer; margin-left:6px;
  font-family:inherit; transition:background 100ms, border-color 100ms;
}
.row-btn:hover { background:var(--accent-soft); border-color:var(--accent); }
.row-btn-danger { color:var(--danger); }
.row-btn-danger:hover { background:var(--danger-soft); border-color:var(--danger); }

/* Contents bar */
.contents-bar { display:flex; align-items:center; gap:12px; margin-bottom:14px; }

/* Move panel */
.move-panel { display:flex; justify-content:center; }
.move-card {
  background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:24px;
  width:100%; max-width:560px; display:flex; flex-direction:column; gap:16px;
}
.field { position:relative; display:flex; flex-direction:column; }
.field-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.move-actions { display:flex; justify-content:flex-end; margin-top:4px; }

/* Form bits */
.form-label { font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; display:block; }
.form-hint  { font-size:11.5px; color:var(--text-muted); margin:4px 0 0; }
.form-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:100%; box-sizing:border-box; transition:border-color 120ms; resize:vertical; }
.form-input:focus { border-color:var(--accent); }
.optional   { font-size:11px; color:var(--text-muted); font-weight:400; margin-left:4px; }

.check-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-primary); cursor:pointer; }

.modal-line { font-size:14px; font-weight:600; color:var(--text-primary); margin:0; }
.wo-warning { background:var(--warning-soft); color:#92400e; border-radius:8px; padding:9px 12px; font-size:12.5px; }

.search-dropdown { position:absolute; z-index:50; top:100%; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,.12); margin-top:4px; width:100%; overflow:hidden; }
.search-item { display:flex; align-items:center; justify-content:space-between; padding:9px 12px; cursor:pointer; transition:background 100ms; }
.search-item:hover { background:var(--bg-app); }
.search-item-name { font-size:13px; color:var(--text-primary); font-weight:500; }
.search-item-sku  { font-size:12px; color:var(--text-muted); font-family:monospace; }

.selected-chip { display:inline-flex; align-items:center; gap:5px; margin-top:6px; padding:4px 10px; background:var(--success-soft); color:#166534; border-radius:999px; font-size:12px; font-weight:600; align-self:flex-start; }
</style>
