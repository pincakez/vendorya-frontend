<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.purchases.title') }}</h1>
        <p class="page-sub">{{ t('inventory.purchases.sub') }}</p>
      </div>
      <button class="btn-primary" @click="openNew">
        <Plus :size="15" /> {{ t('inventory.purchases.modal_new_title') }}
      </button>
    </div>

    <div class="toolbar">
      <div class="toolbar-search">
        <Search :size="14" class="search-icon" />
        <input v-model="searchQ" class="form-input search-input" :placeholder="t('inventory.purchases.search_placeholder')" @input="debouncedFetch" />
      </div>
      <select v-model="statusFilter" class="form-input filter-select" @change="fetchPurchases(1)">
        <option value="">{{ t('inventory.purchases.status_all') }}</option>
        <option value="DRAFT">{{ t('inventory.purchases.status_draft') }}</option>
        <option value="RECEIVED">{{ t('inventory.purchases.status_received') }}</option>
      </select>
      <select v-model="supplierFilter" class="form-input filter-select" @change="fetchPurchases(1)">
        <option value="">{{ t('inventory.purchases.filter_all_suppliers') }}</option>
        <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <input v-model="dateFrom" type="date" class="form-input filter-date" :title="t('inventory.purchases.filter_date_from')" @change="fetchPurchases(1)" />
      <input v-model="dateTo" type="date" class="form-input filter-date" :title="t('inventory.purchases.filter_date_to')" @change="fetchPurchases(1)" />
      <button v-if="searchQ || statusFilter || supplierFilter || dateFrom || dateTo" class="btn-ghost btn-sm" @click="clearFilters">
        <X :size="13" /> {{ t('inventory.purchases.clear_filters') }}
      </button>
    </div>

    <div class="dt-card">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 8" :key="i" class="skeleton-row" />
      </div>
      <div v-else class="dt-xscroll">
        <table class="dt">
        <thead>
          <tr>
            <th class="dt-th">{{ t('inventory.purchases.table_number') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_supplier') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_ref') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_date') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_status') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_total') }}</th>
            <th class="dt-th" style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="purchases.length === 0">
            <td colspan="7" class="dt-empty">
              <ShoppingCart :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>{{ t('inventory.purchases.empty') }}</div>
            </td>
          </tr>
          <tr v-for="p in purchases" :key="p.id" class="dt-row" @click="openView(p)" style="cursor:pointer;">
            <td class="col-ref">{{ p.purchase_number || '—' }}</td>
            <td class="col-name">{{ p.supplier_name || t('inventory.purchases.no_supplier') }}</td>
            <td class="col-ref">{{ p.vendor_reference || '—' }}</td>
            <td>{{ fmtDate(p.date) }}</td>
            <td><span class="status-badge" :class="`status-${p.status.toLowerCase()}`">{{ statusLabel(p.status) }}</span></td>
            <td class="col-amount"><Money :value="p.total_amount" /></td>
            <td @click.stop>
              <button v-if="p.status === 'DRAFT'" class="row-action success" :disabled="!p.supplier" :title="p.supplier ? t('inventory.purchases.receive_hint') : t('inventory.purchases.receive_needs_supplier')" @click="receivePurchase(p)">
                <PackageCheck :size="13" />
              </button>
              <button v-if="p.status === 'DRAFT'" class="row-action danger" :title="t('common.delete')" @click="deletePurchase(p)">
                <Trash2 :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div><!-- dt-xscroll -->
    </div>
    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchPurchases" />

    <!-- MODAL: New / View Purchase -->
    <AppModal :open="modal.open" :title="modalTitle" width="860px" :no-backdrop-close="true" @close="tryClose">
      <div class="form-grid">
        <div>
          <label class="form-label">
            {{ t('inventory.purchases.form_supplier') }}
            <span v-if="!modal.supplier" class="draft-hint">{{ t('inventory.purchases.draft_only_hint') }}</span>
          </label>
          <select v-model="modal.supplier" class="form-input" :disabled="!supplierEditable">
            <option value="">{{ t('inventory.purchases.select_supplier') }}</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ t('inventory.purchases.form_number') }}</label>
          <input v-model="modal.purchase_number" class="form-input" :placeholder="t('inventory.purchases.form_number_placeholder')" :disabled="readOnly" />
        </div>
        <div>
          <label class="form-label">{{ t('inventory.purchases.form_date') }}</label>
          <input v-model="modal.date" type="datetime-local" class="form-input" :disabled="readOnly" />
        </div>
        <div>
          <label class="form-label">{{ t('inventory.purchases.form_vendor_ref') }}</label>
          <input v-model="modal.vendor_reference" class="form-input" :placeholder="t('inventory.purchases.form_vendor_ref_placeholder')" :disabled="readOnly" />
        </div>
        <div style="grid-column:1 / -1;">
          <label class="form-label">{{ t('inventory.purchases.form_notes') }}</label>
          <input v-model="modal.notes" class="form-input" :placeholder="t('inventory.purchases.form_notes_placeholder')" :disabled="readOnly" />
        </div>
      </div>

      <div style="margin-top:18px;">
        <div class="section-label">{{ t('inventory.purchases.items_section') }}</div>

        <div class="items-head">
          <span class="ih-sku">{{ t('inventory.purchases.col_sku') }}</span>
          <span class="ih-name">{{ t('inventory.purchases.col_item') }}</span>
          <span class="ih-qty">{{ t('inventory.purchases.col_qty') }}</span>
          <span class="ih-num">{{ t('inventory.purchases.col_base') }}</span>
          <span class="ih-num">{{ t('inventory.purchases.col_retail') }}</span>
          <span class="ih-del"></span>
        </div>

        <div v-for="(row, i) in modal.rows" :key="i" class="item-card" :class="{ 'is-new': row.kind === 'new' && (row.name || '').trim() }">
          <div class="item-main">
            <!-- SKU cell -->
            <div class="cell-sku" :title="skuHint(row)">
              <span v-if="row.sku" class="sku-val">{{ row.sku }}</span>
              <Lock v-else-if="row.kind === 'new' && (row.name||'').trim() && !modal.supplier" :size="12" class="sku-lock" />
              <span v-else class="sku-dash">—</span>
            </div>

            <!-- Name autocomplete -->
            <div class="cell-name">
              <input
                v-model="row.name"
                class="form-input"
                :placeholder="t('inventory.purchases.item_search_placeholder')"
                :disabled="readOnly"
                autocomplete="off"
                @input="onNameInput(row)"
                @focus="row._open = (row._results && row._results.length > 0)"
                @blur="closeRowSoon(row)"
              />
              <div v-if="row._open && row._results && row._results.length" class="ac-dropdown">
                <button
                  v-for="r in row._results" :key="r.id"
                  class="ac-item"
                  @mousedown.prevent="pickProduct(row, r)"
                >
                  <span class="ac-name">{{ r.name }}</span>
                  <span v-if="getActiveIng(r)" class="ac-meta">{{ getActiveIng(r) }}</span>
                </button>
              </div>
            </div>

            <input v-model="row.quantity" type="number" min="1" step="1" class="form-input cell-qty" :disabled="readOnly" />
            <input v-model="row.base_price" type="number" min="0" step="0.01" class="form-input cell-num" :placeholder="t('inventory.purchases.col_base')" :disabled="readOnly" />
            <input v-model="row.retail_price" type="number" min="0" step="0.01" class="form-input cell-num" :placeholder="t('inventory.purchases.col_retail')" :disabled="readOnly" />

            <button v-if="!readOnly" class="row-action danger cell-del" @click="modal.rows.splice(i, 1)"><Trash2 :size="13" /></button>
          </div>

          <!-- NEW product extra fields -->
          <div v-if="row.kind === 'new' && (row.name||'').trim() && !readOnly" class="item-extra">
            <div class="ie-field">
              <label class="ie-label">{{ t('inventory.purchases.col_category') }}</label>
              <select v-model="row.category" class="form-input" @change="row.subcategory = ''">
                <option value="">{{ t('inventory.purchases.category_none') }}</option>
                <option v-for="c in topCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="ie-field" v-if="row.category && subCategories(row.category).length">
              <label class="ie-label">{{ t('inventory.purchases.col_subcategory') }}</label>
              <select v-model="row.subcategory" class="form-input">
                <option value="">{{ t('inventory.purchases.category_none') }}</option>
                <option v-for="c in subCategories(row.category)" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="ie-field" v-for="def in attrDefs" :key="def.id">
              <label class="ie-label">{{ def.name }}</label>
              <select v-if="def.input_type === 'SELECT'" v-model="row._attrs[def.id]" class="form-input">
                <option value="">—</option>
                <option v-for="opt in (def.options || [])" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <input v-else v-model="row._attrs[def.id]" class="form-input" :placeholder="def.name" />
            </div>
            <!-- Onboard a brand-new product as expiry/batch-tracked on first receipt -->
            <div v-if="expiryEnabled" class="ie-field ie-track-expiry">
              <label class="ie-check">
                <input type="checkbox" v-model="row.track_expiry" />
                <span>{{ t('inventory.purchases.track_expiry_new') }}</span>
              </label>
            </div>
          </div>

          <!-- Buy-by-unit — pick a pack/strip; stock converts to base on receive -->
          <div v-if="row.kind === 'existing' && (row._units || []).length > 1 && !readOnly"
               class="item-extra item-unit">
            <div class="ie-field">
              <label class="ie-label">{{ t('inventory.purchases.unit_hint') }}</label>
              <select v-model="row.unit" class="form-input">
                <option v-for="u in row._units" :key="u.id || 'base'" :value="u.id || ''">
                  {{ u.name }}{{ u.is_base ? '' : ` (×${u.factor})` }}
                </option>
              </select>
            </div>
          </div>

          <!-- Expiry / batch capture — only for expiry-tracked products -->
          <div v-if="row.track_expiry && !readOnly" class="item-extra item-expiry">
            <div class="ie-field">
              <label class="ie-label">{{ t('inventory.purchases.expiry_date') }}</label>
              <input v-model="row.expiry_date" type="date" class="form-input" />
            </div>
            <div class="ie-field">
              <label class="ie-label">{{ t('inventory.purchases.batch_number') }}</label>
              <input v-model="row.batch_number" class="form-input" :placeholder="t('common.optional')" />
            </div>
          </div>
        </div>

        <button v-if="!readOnly" class="btn-ghost" style="margin-top:10px;" @click="addRow">
          <Plus :size="13" /> {{ t('inventory.purchases.add_item') }}
        </button>
      </div>

      <div class="invoice-totals">
        <div class="totals-row total-line">
          <span>{{ t('inventory.purchases.total_cost') }}</span>
          <span><Money :value="modalTotal" /></span>
        </div>
      </div>

      <!-- Print option -->
      <div v-if="!readOnly" class="print-opt" :class="{ disabled: !modal.supplier }">
        <label class="print-check" :title="!modal.supplier ? t('inventory.purchases.print_needs_supplier') : ''">
          <input type="checkbox" v-model="printNow" :disabled="!modal.supplier" />
          <Tag :size="14" /> {{ t('inventory.purchases.print_now') }}
        </label>
        <template v-if="printNow && modal.supplier">
          <span class="print-x">×</span>
          <input v-model.number="labelCopies" type="number" min="1" max="99" class="form-input print-copies" />
          <span class="print-hint">{{ t('inventory.purchases.print_copies_hint') }}</span>
        </template>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="tryClose">{{ t('common.cancel') }}</button>
        <button v-if="modal.id && readOnly" class="btn-ghost" @click="openLabelPicker"><Tag :size="14" /> {{ t('inventory.purchases.print_labels') }}</button>
        <template v-if="!readOnly">
          <button class="btn-secondary" :disabled="saving || !hasRows" @click="saveDraft">
            {{ saving ? t('common.saving') : t('inventory.purchases.save_draft') }}
          </button>
          <button class="btn-primary" :disabled="saving || !hasRows || !modal.supplier" :title="!modal.supplier ? t('inventory.purchases.save_needs_supplier') : ''" @click="savePurchase">
            {{ saving ? t('common.saving') : t('inventory.purchases.save_purchase') }}
          </button>
        </template>
      </template>
    </AppModal>

    <!-- Label preset picker -->
    <AppModal :open="labelPicker.open" :title="t('inventory.purchases.label_picker_title')" width="400px" @close="labelPicker.open = false">
      <div v-if="labelPicker.loading" style="text-align:center;padding:24px;color:var(--text-muted);">{{ t('inventory.purchases.loading') }}</div>
      <div v-else-if="labelPicker.presets.length === 0" style="text-align:center;padding:24px;color:var(--text-muted);">
        {{ t('inventory.purchases.label_picker_no_presets') }}
      </div>
      <div v-else>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px;">{{ t('inventory.purchases.label_picker_hint', { n: labelPicker.totalQty }, labelPicker.totalQty) }}</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label v-for="p in labelPicker.presets" :key="p.id" class="preset-option" :class="{ selected: labelPicker.selectedId === p.id }">
            <input type="radio" :value="p.id" v-model="labelPicker.selectedId" style="display:none;" />
            <div class="preset-info">
              <div class="preset-name">{{ p.name }}</div>
              <div class="preset-size">{{ p.width_mm }} × {{ p.height_mm }} mm</div>
            </div>
            <div v-if="p.is_default" class="badge-cash" style="font-size:10px;">{{ t('inventory.purchases.label_default_badge') }}</div>
          </label>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="labelPicker.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!labelPicker.selectedId || labelPicker.loading" @click="printLabels"><Tag :size="14" /> {{ t('inventory.purchases.print_btn') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ShoppingCart, PackageCheck, Trash2, Plus, Tag, Search, X, Lock } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { useCtrlN } from '@/composables/useCtrlN'
useCtrlN(openNew)
import { useLabelsStore } from '@/stores/labels'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const { t }       = useI18n()
const labelsStore = useLabelsStore()
const router      = useRouter()

const purchases      = ref([])
const loading        = ref(false)
const total          = ref(0)
const page           = ref(1)
const pageSize       = 20
const statusFilter   = ref('')
const supplierFilter = ref('')
const searchQ        = ref('')
const dateFrom       = ref('')
const dateTo         = ref('')
const suppliers      = ref([])
const categories     = ref([])
const attrDefs       = ref([])
const expiryEnabled  = ref(false)   // store master switch → gates new-product expiry toggle

let searchTimer = null
function debouncedFetch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchPurchases(1), 300)
}

function clearFilters() {
  searchQ.value = ''; statusFilter.value = ''; supplierFilter.value = ''
  dateFrom.value = ''; dateTo.value = ''
  fetchPurchases(1)
}

async function fetchPurchases(p = 1) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, page_size: pageSize }
    if (statusFilter.value)   params.status    = statusFilter.value
    if (supplierFilter.value) params.supplier  = supplierFilter.value
    if (searchQ.value)        params.q         = searchQ.value
    if (dateFrom.value)       params.date_from = dateFrom.value
    if (dateTo.value)         params.date_to   = dateTo.value
    const res = await api.get('/api/finance/purchases/', { params })
    purchases.value = res.data.results ?? res.data
    total.value     = res.data.count ?? purchases.value.length
  } catch { purchases.value = [] } finally { loading.value = false }
}

async function fetchSuppliers() {
  try {
    const res = await api.get('/api/inventory/suppliers/')
    suppliers.value = res.data.results ?? res.data
  } catch {}
}

async function fetchCategories() {
  try {
    const res = await api.get('/api/inventory/categories/', { params: { page_size: 500 } })
    categories.value = res.data.results ?? res.data
  } catch {}
}

async function fetchAttrDefs() {
  try {
    const res = await api.get('/api/inventory/attributes/', { params: { page_size: 200 } })
    attrDefs.value = res.data.results ?? res.data
  } catch {}
}

const topCategories = computed(() => categories.value.filter(c => !c.parent))
function subCategories(parentId) {
  return categories.value.filter(c => c.parent === parentId)
}

function statusLabel(s) {
  if (s === 'DRAFT') return t('inventory.purchases.status_badge_draft')
  if (s === 'RECEIVED') return t('inventory.purchases.status_badge_received')
  return s
}

async function receivePurchase(p) {
  if (!confirm(t('inventory.purchases.confirm_receive', { supplier: p.supplier_name || p.supplier }))) return
  await api.post(`/api/finance/purchases/${p.id}/receive/`)
  fetchPurchases(page.value)
}

async function deletePurchase(p) {
  if (!confirm(t('inventory.purchases.confirm_delete_draft'))) return
  await api.delete(`/api/finance/purchases/${p.id}/`)
  fetchPurchases(page.value)
}

// ── Modal ──────────────────────────────────────────────────────────────────
const saving = ref(false)
const printNow = ref(false)
const labelCopies = ref(1)
const modal  = reactive({
  open: false, id: null, status: 'DRAFT', supplier: '', origSupplier: '',
  purchase_number: '', date: '', vendor_reference: '', notes: '', rows: [],
})

const readOnly        = computed(() => modal.status === 'RECEIVED')
const supplierEditable = computed(() => !readOnly.value && !modal.origSupplier)
const modalTitle = computed(() => {
  if (!modal.id) return t('inventory.purchases.modal_new_title')
  return readOnly.value ? t('inventory.purchases.modal_view_title') : t('inventory.purchases.modal_edit_title')
})
const hasRows = computed(() => modal.rows.some(r => r.variant || (r.name || '').trim()))
const modalTotal = computed(() =>
  modal.rows.reduce((sum, r) => sum + (Number(r.quantity) * Number(r.base_price) || 0), 0)
)

function blankRow() {
  return { kind: 'new', variant: '', sku: '', name: '', quantity: 1, base_price: '', retail_price: '',
           track_expiry: false, expiry_date: '', batch_number: '',
           unit: '', _units: [],
           category: '', subcategory: '', _attrs: {}, _results: [], _open: false, _timer: null, _ac: null }
}

function openNew() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  printNow.value = false; labelCopies.value = 1
  Object.assign(modal, {
    open: true, id: null, status: 'DRAFT', supplier: '', origSupplier: '',
    purchase_number: '', date: now.toISOString().slice(0, 16),
    vendor_reference: '', notes: '', rows: [blankRow()],
  })
}

function loadModal(p) {
  printNow.value = false; labelCopies.value = 1
  const rows = []
  for (const it of (p.items || [])) {
    rows.push({ kind: 'existing', variant: it.variant, sku: it.sku, name: it.product_name,
                quantity: Number(it.quantity), base_price: it.unit_cost, retail_price: it.retail_price,
                track_expiry: !!it.track_expiry, expiry_date: it.expiry_date || '', batch_number: it.batch_number || '',
                unit: it.unit || '', _units: it.selling_units || [],
                category: '', subcategory: '', _attrs: {}, _results: [], _open: false, _timer: null, _ac: null })
  }
  for (const d of (p.draft_items || [])) {
    const _attrs = {}
    for (const a of (d.attributes || [])) _attrs[a.definition] = a.value
    rows.push({ kind: 'new', variant: '', sku: '', name: d.name, quantity: Number(d.quantity),
                base_price: d.base_price, retail_price: d.retail_price,
                category: d.category || '', subcategory: d.subcategory || '',
                _attrs, _results: [], _open: false, _timer: null, _ac: null })
  }
  if (rows.length === 0 || p.status === 'DRAFT') rows.push(blankRow())
  Object.assign(modal, {
    open: true, id: p.id, status: p.status, supplier: p.supplier || '', origSupplier: p.supplier || '',
    purchase_number: p.purchase_number || '', date: p.date?.slice(0, 16) || '',
    vendor_reference: p.vendor_reference || '', notes: p.notes || '', rows,
  })
}

async function openView(p) {
  // fetch fresh single record (list payload already carries items/draft_items, but be safe)
  try {
    const res = await api.get(`/api/finance/purchases/${p.id}/`)
    loadModal(res.data)
  } catch { loadModal(p) }
}

function isDirty() {
  return hasRows.value || modal.vendor_reference || modal.notes
}
function tryClose() {
  if (!readOnly.value && !modal.id && isDirty()) {
    if (!confirm(t('inventory.purchases.confirm_cancel'))) return
  }
  modal.open = false
}

function addRow() { modal.rows.push(blankRow()) }

// ── Autocomplete ─────────────────────────────────────────────────────────
// Each row keeps its own AbortController so a stale response from a previous
// keystroke can never overwrite results from the latest one.
function onNameInput(row) {
  // typing past a selected product turns it back into a new-product line
  if (row.kind === 'existing') { row.kind = 'new'; row.variant = ''; row.sku = ''; row.unit = ''; row._units = [] }
  clearTimeout(row._timer)
  const q = (row.name || '').trim()
  if (q.length < 3) { row._results = []; row._open = false; return }
  row._timer = setTimeout(async () => {
    // Cancel any in-flight request for this row before issuing a new one.
    if (row._ac) row._ac.abort()
    row._ac = new AbortController()
    try {
      const res = await api.get('/api/inventory/products/autocomplete/', {
        params: { q },
        signal: row._ac.signal,
      })
      row._results = (res.data.results ?? res.data).filter(r => r.default_variant_id)
      row._open = row._results.length > 0
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') { row._results = []; row._open = false }
    }
  }, 250)
}

function getActiveIng(r) {
  const s = r.attributes_summary || {}
  return (s.active_ing || [])[0] || ''
}
function pickProduct(row, r) {
  // Memory Base entries are reference-only (supplier-less, SKU-less, hidden from
  // POS). Picking one must NOT stock the MB variant — route it through the
  // NEW-product path so receiving materializes a real STORE product, with the
  // entry's attributes carried over (superfix §2.4 / Step 4b).
  if (r.source === 'MEMORY_BASE') {
    row.kind = 'new'
    row.name = r.name
    row.variant = ''; row.sku = ''; row.unit = ''; row._units = []
    const summary = r.attributes_summary || {}
    for (const def of attrDefs.value) {
      const v = summary[def.key]
      if (Array.isArray(v) && v.length) row._attrs[def.id] = v[0]
    }
    row._open = false
    row._results = []
    return
  }
  row.kind = 'existing'
  row.variant = r.default_variant_id
  row.sku = r.sku_display
  row.name = r.name
  row.track_expiry = !!r.track_expiry   // drives the expiry capture row below
  row._units = r.selling_units || []    // base + any pack/strip units → unit picker
  row.unit = ''                         // default to base unit (factor 1)
  if (row.retail_price === '' || row.retail_price == null) row.retail_price = r.default_variant_price
  row._open = false
  row._results = []
}
function closeRowSoon(row) { setTimeout(() => { row._open = false }, 150) }

function skuHint(row) {
  if (row.sku) return row.sku
  if (row.kind === 'new' && (row.name || '').trim() && !modal.supplier) return t('inventory.purchases.sku_needs_supplier')
  return ''
}

// ── Save ─────────────────────────────────────────────────────────────────
function rowsToLines() {
  return modal.rows
    .filter(r => r.variant || (r.name || '').trim())
    .map(r => {
      const base = { quantity: Number(r.quantity) || 1, base_price: Number(r.base_price) || 0,
                     retail_price: r.retail_price === '' || r.retail_price == null ? null : Number(r.retail_price) }
      if (r.track_expiry) {
        base.expiry_date = r.expiry_date || null
        base.batch_number = r.batch_number || ''
      }
      // Existing line received in a pack/strip → send the chosen unit (NULL = base).
      if (r.variant) return { variant: r.variant, unit: r.unit || null, ...base }
      const attributes = Object.entries(r._attrs || {})
        .filter(([, v]) => v !== '' && v != null)
        .map(([definition, value]) => ({ definition, value }))
      // New product: tell the backend to onboard it as expiry-tracked from its first
      // receipt (closes the inline-new-product gap). Ignored unless the store switch is on.
      return { name: r.name.trim(), category: r.category || null, subcategory: r.subcategory || null,
               attributes, track_expiry: !!r.track_expiry, ...base }
    })
}

async function persist() {
  const payload = {
    supplier: modal.supplier || null,
    date: modal.date,
    purchase_number: modal.purchase_number || '',
    vendor_reference: modal.vendor_reference,
    notes: modal.notes,
    lines: rowsToLines(),
  }
  const res = modal.id
    ? await api.patch(`/api/finance/purchases/${modal.id}/`, payload)
    : await api.post('/api/finance/purchases/', payload)
  return res.data
}

async function saveDraft() {
  saving.value = true
  try {
    const data = await persist()
    loadModal(data)          // reload in place → SKUs + purchase number now visible
    fetchPurchases(page.value)
  } catch (e) {
    alert(e.response?.data?.detail || t('inventory.purchases.err_save'))
  } finally { saving.value = false }
}

async function savePurchase() {
  if (!modal.supplier) return
  saving.value = true
  try {
    const data = await persist()
    await api.post(`/api/finance/purchases/${data.id}/receive/`)
    const wantPrint = printNow.value
    const copies = Math.max(1, Number(labelCopies.value) || 1)
    modal.open = false
    fetchPurchases(1)
    if (wantPrint) await startLabelPrint(data.id, copies)
  } catch (e) {
    alert(e.response?.data?.detail || t('inventory.purchases.err_save'))
  } finally { saving.value = false }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Label printing ────────────────────────────────────────────────────────
const labelPicker = reactive({ open: false, loading: false, presets: [], selectedId: null, totalQty: 0, invoiceId: null, copies: 1 })

async function startLabelPrint(invoiceId, copies) {
  labelPicker.invoiceId = invoiceId
  labelPicker.copies = copies
  labelPicker.loading = true
  labelPicker.open = true
  labelPicker.selectedId = null
  try {
    const res = await api.get('/api/core/label-presets/')
    labelPicker.presets = res.data.results ?? res.data
    const def = labelPicker.presets.find(p => p.is_default)
    if (def) labelPicker.selectedId = def.id
    const ld = await api.get(`/api/finance/purchases/${invoiceId}/label-data/`)
    labelPicker.totalQty = (ld.data.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0) * copies
    labelPicker._items = ld.data.items
    labelPicker._storeName = ld.data.store_name
  } finally { labelPicker.loading = false }
}

async function openLabelPicker() {
  await startLabelPrint(modal.id, 1)
}

async function printLabels() {
  const preset = labelPicker.presets.find(p => p.id === labelPicker.selectedId)
  if (!preset) return
  try {
    let items = labelPicker._items
    if (!items) {
      const res = await api.get(`/api/finance/purchases/${labelPicker.invoiceId}/label-data/`)
      items = res.data.items
      labelPicker._storeName = res.data.store_name
    }
    const copies = Math.max(1, Number(labelPicker.copies) || 1)
    const expanded = items.map(i => ({ ...i, quantity: (Number(i.quantity) || 0) * copies }))
    labelsStore.setJob({ preset, store_name: labelPicker._storeName, items: expanded })
    labelPicker.open = false
    router.push('/print/labels')
  } catch { alert(t('inventory.purchases.err_label_data')) }
}

async function fetchStoreSettings() {
  try {
    const s = await api.get('/api/core/settings/')
    expiryEnabled.value = !!s.data.expiry_tracking_enabled
  } catch {}
}

onMounted(() => {
  fetchPurchases()
  fetchSuppliers()
  fetchCategories()
  fetchAttrDefs()
  fetchStoreSettings()
})
</script>

<style scoped>
.toolbar { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
.toolbar-search { position:relative; display:flex; align-items:center; }
.search-icon { position:absolute; left:9px; color:var(--text-muted); pointer-events:none; }
.search-input { padding-left:30px; min-width:220px; }
.filter-select { max-width:160px; }
.filter-date   { max-width:140px; }
.draft-hint { font-size:11px; font-weight:400; color:var(--warning, #d97706); margin-left:6px; }

.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.col-name   { font-weight:500; }
.col-ref    { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-amount { font-variant-numeric:tabular-nums; }

.status-badge { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.status-draft    { background:var(--warning-soft); color:#92400e; }
.status-received { background:var(--success-soft); color:var(--success-hover); }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action.success:hover { background:var(--success-soft); color:var(--success); }
.row-action.danger:hover  { background:var(--danger-soft); color:var(--danger); }
.row-action:disabled { opacity:.4; cursor:not-allowed; }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.section-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-bottom:10px; }

/* Item rows */
.items-head { display:grid; grid-template-columns:96px 1fr 70px 100px 100px 32px; gap:8px; padding:0 4px 6px; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); }
.ih-num { text-align:left; }

.item-card { border:1px solid var(--border); border-radius:10px; padding:8px; margin-bottom:8px; background:var(--bg-card); transition:border-color 120ms; }
.item-card.is-new { border-color:color-mix(in srgb, var(--accent) 40%, var(--border)); }
.item-main { display:grid; grid-template-columns:96px 1fr 70px 100px 100px 32px; gap:8px; align-items:center; }

.cell-sku { font-family:monospace; font-size:12px; display:flex; align-items:center; justify-content:center; min-height:34px; }
.sku-val  { color:var(--text-primary); font-weight:600; }
.sku-dash { color:var(--text-muted); opacity:.5; }
.sku-lock { color:var(--warning, #d97706); }

.cell-name { position:relative; }
.cell-qty  { text-align:center; }
.cell-num  { font-variant-numeric:tabular-nums; }
.cell-del  { justify-self:center; }

.ac-dropdown { position:absolute; top:100%; left:0; right:0; z-index:30; margin-top:4px; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-card, 0 6px 20px rgba(0,0,0,.12)); overflow:hidden; max-height:240px; overflow-y:auto; }
.ac-item { display:flex; flex-direction:column; gap:2px; width:100%; text-align:left; padding:8px 10px; border:none; background:none; cursor:pointer; transition:background 100ms; }
.ac-item:hover { background:var(--bg-app); }
.ac-name { font-size:13px; font-weight:500; color:var(--text-primary); }
.ac-meta { font-size:11px; font-family:monospace; color:var(--text-muted); }

.item-extra { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; padding-top:8px; border-top:1px dashed var(--border); }
.ie-field { display:flex; flex-direction:column; gap:3px; min-width:140px; }
.ie-label { font-size:10.5px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.ie-check { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--text-secondary); cursor:pointer; }
.ie-check input { width:15px; height:15px; accent-color:var(--accent); cursor:pointer; }
.ie-track-expiry { justify-content:flex-end; align-self:center; }
.item-unit .form-input { min-width:160px; }

.invoice-totals { margin-top:18px; border-top:1px solid var(--border); padding-top:14px; display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.totals-row { display:flex; gap:32px; font-size:13px; color:var(--text-secondary); }
.totals-row span:last-child { font-variant-numeric:tabular-nums; min-width:90px; text-align:right; }
.total-line { font-size:15px; font-weight:700; color:var(--text-primary); }

.print-opt { display:flex; align-items:center; gap:10px; margin-top:14px; padding:10px 12px; border:1px dashed var(--border); border-radius:8px; }
.print-opt.disabled { opacity:.55; }
.print-check { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:500; cursor:pointer; }
.print-x { color:var(--text-muted); }
.print-copies { width:64px; text-align:center; }
.print-hint { font-size:12px; color:var(--text-muted); }

.preset-option { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border:1.5px solid var(--border); border-radius:8px; cursor:pointer; transition:border-color 100ms,background 100ms; }
.preset-option:hover   { background:var(--bg-app); }
.preset-option.selected { border-color:var(--accent); background:color-mix(in srgb, var(--accent) 8%, transparent); }
.preset-info { display:flex; flex-direction:column; gap:2px; }
.preset-name { font-size:13px; font-weight:600; color:var(--text-primary); }
.preset-size { font-size:11.5px; color:var(--text-muted); font-variant-numeric:tabular-nums; }
</style>
