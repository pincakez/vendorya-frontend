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
      <select v-model="statusFilter" class="form-input filter-select" @change="fetchPurchases(1)">
        <option value="">{{ t('inventory.purchases.status_all') }}</option>
        <option value="DRAFT">{{ t('inventory.purchases.status_draft') }}</option>
        <option value="RECEIVED">{{ t('inventory.purchases.status_received') }}</option>
      </select>
    </div>

    <div class="dt-card">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 8" :key="i" class="skeleton-row" />
      </div>
      <div v-else class="dt-xscroll">
        <table class="dt">
        <thead>
          <tr>
            <th class="dt-th">{{ t('inventory.purchases.table_supplier') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_ref') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_date') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_status') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_total') }}</th>
            <th class="dt-th">{{ t('inventory.purchases.table_paid') }}</th>
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
            <td class="col-name">{{ p.supplier_name || p.supplier }}</td>
            <td class="col-ref">{{ p.vendor_reference || '—' }}</td>
            <td>{{ fmtDate(p.date) }}</td>
            <td><span class="status-badge" :class="`status-${p.status.toLowerCase()}`">{{ statusLabel(p.status) }}</span></td>
            <td class="col-amount"><Money :value="p.total_amount" /></td>
            <td class="col-amount"><Money :value="p.paid_amount" /></td>
            <td @click.stop>
              <button v-if="p.status === 'DRAFT'" class="row-action success" :title="t('inventory.purchases.receive_hint')" @click="receivePurchase(p)">
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
    <AppModal :open="modal.open" :title="modal.id ? t('inventory.purchases.modal_view_title') : t('inventory.purchases.modal_new_title')" width="720px" @close="closeModal">
      <div class="form-grid">
        <div>
          <label class="form-label">{{ t('inventory.purchases.form_supplier') }}</label>
          <select v-model="modal.supplier" class="form-input" :disabled="!!modal.id">
            <option value="">{{ t('inventory.purchases.select_supplier') }}</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ t('inventory.purchases.form_date') }}</label>
          <input v-model="modal.date" type="datetime-local" class="form-input" :disabled="!!modal.id" />
        </div>
        <div>
          <label class="form-label">{{ t('inventory.purchases.form_vendor_ref') }}</label>
          <input v-model="modal.vendor_reference" class="form-input" :placeholder="t('inventory.purchases.form_vendor_ref_placeholder')" :disabled="!!modal.id" />
        </div>
        <div>
          <label class="form-label">{{ t('inventory.purchases.form_notes') }}</label>
          <input v-model="modal.notes" class="form-input" :placeholder="t('inventory.purchases.form_notes_placeholder')" :disabled="!!modal.id" />
        </div>
      </div>

      <div style="margin-top:18px;">
        <div class="section-label">{{ t('inventory.purchases.items_section') }}</div>
        <div v-for="(item, i) in modal.items" :key="i" class="item-row">
          <select v-model="item.variant" class="form-input item-variant" :disabled="!!modal.id">
            <option value="">{{ t('inventory.purchases.select_variant') }}</option>
            <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.product_name }} — {{ v.sku }}</option>
          </select>
          <input v-model="item.quantity" type="number" min="1" class="form-input item-qty" :placeholder="t('inventory.purchases.qty_placeholder')" :disabled="!!modal.id" />
          <input v-model="item.unit_cost" type="number" min="0" step="0.01" class="form-input item-price" :placeholder="t('inventory.purchases.cost_placeholder')" :disabled="!!modal.id" />
          <button v-if="!modal.id" class="row-action danger" @click="modal.items.splice(i, 1)"><Trash2 :size="13" /></button>
        </div>
        <button v-if="!modal.id" class="btn-ghost" style="margin-top:8px;" @click="modal.items.push({ variant: '', quantity: 1, unit_cost: '' })">
          <Plus :size="13" /> {{ t('inventory.purchases.add_item') }}
        </button>
      </div>

      <div class="invoice-totals">
        <div class="totals-row total-line">
          <span>{{ t('inventory.purchases.total_cost') }}</span>
          <span><Money :value="modalTotal" /></span>
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeModal">{{ modal.id ? t('common.close') : t('common.cancel') }}</button>
        <button v-if="modal.id" class="btn-ghost" @click="openLabelPicker"><Tag :size="14" /> {{ t('inventory.purchases.print_labels') }}</button>
        <button v-if="!modal.id" class="btn-primary" :disabled="saving || !modal.supplier || modal.items.length === 0" @click="savePurchase">
          {{ saving ? t('common.saving') : t('inventory.purchases.save_purchase') }}
        </button>
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
import { ShoppingCart, PackageCheck, Trash2, Plus, Tag } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { useCtrlN } from '@/composables/useCtrlN'
useCtrlN(openNew)
import { useAuthStore } from '@/stores/auth'
import { useLabelsStore } from '@/stores/labels'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const { t }       = useI18n()
const auth        = useAuthStore()
const labelsStore = useLabelsStore()
const router      = useRouter()

const purchases    = ref([])
const loading      = ref(false)
const total        = ref(0)
const page         = ref(1)
const pageSize     = 20
const statusFilter = ref('')
const suppliers    = ref([])
const variants     = ref([])

async function fetchPurchases(p = 1) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, page_size: pageSize }
    if (statusFilter.value) params.status = statusFilter.value
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

async function fetchVariants() {
  try {
    const res = await api.get('/api/inventory/variants/', { params: { page_size: 200 } })
    variants.value = res.data.results ?? res.data
  } catch {}
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

const saving = ref(false)
const modal  = reactive({
  open: false, id: null, supplier: '', date: '', vendor_reference: '', notes: '',
  items: [],
})

const modalTotal = computed(() =>
  modal.items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_cost) || 0), 0)
)

function openNew() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  Object.assign(modal, {
    open: true, id: null, supplier: '', date: now.toISOString().slice(0, 16),
    vendor_reference: '', notes: '', items: [],
  })
}

function openView(p) {
  Object.assign(modal, {
    open: true, id: p.id,
    supplier: p.supplier,
    date: p.date?.slice(0, 16) || '',
    vendor_reference: p.vendor_reference || '',
    notes: p.notes || '',
    items: (p.items || []).map(i => ({ variant: i.variant, quantity: i.quantity, unit_cost: i.unit_cost })),
  })
}

function closeModal() { modal.open = false }

async function savePurchase() {
  saving.value = true
  try {
    const payload = {
      supplier: modal.supplier,
      branch: auth.user?.store?.id,
      date: modal.date,
      vendor_reference: modal.vendor_reference,
      notes: modal.notes,
      items: modal.items.map(i => ({
        variant: i.variant,
        quantity: Number(i.quantity),
        unit_cost: Number(i.unit_cost),
      })),
    }
    await api.post('/api/finance/purchases/', payload)
    closeModal()
    fetchPurchases(1)
  } catch (e) {
    alert(e.response?.data?.detail || t('inventory.purchases.err_save'))
  } finally {
    saving.value = false
  }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Label printing ────────────────────────────────────────────────────────
const labelPicker = reactive({ open: false, loading: false, presets: [], selectedId: null, totalQty: 0, invoiceId: null })

async function openLabelPicker() {
  labelPicker.invoiceId = modal.id
  labelPicker.totalQty  = modal.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
  labelPicker.loading   = true
  labelPicker.open      = true
  labelPicker.selectedId = null
  try {
    const res = await api.get('/api/core/label-presets/')
    labelPicker.presets = res.data.results ?? res.data
    const def = labelPicker.presets.find(p => p.is_default)
    if (def) labelPicker.selectedId = def.id
  } finally { labelPicker.loading = false }
}

async function printLabels() {
  const preset = labelPicker.presets.find(p => p.id === labelPicker.selectedId)
  if (!preset) return
  try {
    const res = await api.get(`/api/finance/purchases/${labelPicker.invoiceId}/label-data/`)
    labelsStore.setJob({ preset, store_name: res.data.store_name, items: res.data.items })
    labelPicker.open = false
    router.push('/print/labels')
  } catch { alert(t('inventory.purchases.err_label_data')) }
}

onMounted(() => {
  fetchPurchases()
  fetchSuppliers()
  fetchVariants()
})
</script>

<style scoped>

.toolbar { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
.filter-select { max-width:160px; }

.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
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

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.section-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-bottom:10px; }

.item-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.item-variant { flex:2; min-width:0; }
.item-qty   { width:70px; flex-shrink:0; }
.item-price { width:100px; flex-shrink:0; }

.invoice-totals { margin-top:18px; border-top:1px solid var(--border); padding-top:14px; display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.totals-row { display:flex; gap:32px; font-size:13px; color:var(--text-secondary); }
.totals-row span:last-child { font-variant-numeric:tabular-nums; min-width:90px; text-align:right; }
.total-line { font-size:15px; font-weight:700; color:var(--text-primary); }


.preset-option { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border:1.5px solid var(--border); border-radius:8px; cursor:pointer; transition:border-color 100ms,background 100ms; }
.preset-option:hover   { background:var(--bg-app); }
.preset-option.selected { border-color:var(--accent); background:color-mix(in srgb, var(--accent) 8%, transparent); }
.preset-info { display:flex; flex-direction:column; gap:2px; }
.preset-name { font-size:13px; font-weight:600; color:var(--text-primary); }
.preset-size { font-size:11.5px; color:var(--text-muted); font-variant-numeric:tabular-nums; }
</style>
