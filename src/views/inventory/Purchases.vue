<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Purchases</h1>
        <p class="page-sub">Supplier purchase invoices and stock receiving</p>
      </div>
    </div>

    <div class="toolbar">
      <select v-model="statusFilter" class="form-input filter-select" @change="fetchPurchases(1)">
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="RECEIVED">Received</option>
      </select>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 8" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Ref #</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Paid</th>
            <th style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="purchases.length === 0">
            <td colspan="7" class="table-empty">
              <ShoppingCart :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No purchases yet</div>
            </td>
          </tr>
          <tr v-for="p in purchases" :key="p.id" class="table-row" @click="openView(p)" style="cursor:pointer;">
            <td class="col-name">{{ p.supplier_name || p.supplier }}</td>
            <td class="col-ref">{{ p.vendor_reference || '—' }}</td>
            <td>{{ fmtDate(p.date) }}</td>
            <td><span class="status-badge" :class="`status-${p.status.toLowerCase()}`">{{ p.status }}</span></td>
            <td class="col-amount">{{ auth.currencySymbol }} {{ formatNumber(p.total_amount) }}</td>
            <td class="col-amount">{{ auth.currencySymbol }} {{ formatNumber(p.paid_amount) }}</td>
            <td @click.stop>
              <button v-if="p.status === 'DRAFT'" class="row-action success" title="Receive stock" @click="receivePurchase(p)">
                <PackageCheck :size="13" />
              </button>
              <button v-if="p.status === 'DRAFT'" class="row-action danger" title="Delete" @click="deletePurchase(p)">
                <Trash2 :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchPurchases" />

    <!-- MODAL: New / View Purchase -->
    <AppModal :open="modal.open" :title="modal.id ? 'Purchase Details' : 'New Purchase'" width="720px" @close="closeModal">
      <div class="form-grid">
        <div>
          <label class="form-label">Supplier</label>
          <select v-model="modal.supplier" class="form-input" :disabled="!!modal.id">
            <option value="">Select supplier…</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Date</label>
          <input v-model="modal.date" type="datetime-local" class="form-input" :disabled="!!modal.id" />
        </div>
        <div>
          <label class="form-label">Supplier Invoice # (optional)</label>
          <input v-model="modal.vendor_reference" class="form-input" placeholder="e.g. INV-2026-001" :disabled="!!modal.id" />
        </div>
        <div>
          <label class="form-label">Notes</label>
          <input v-model="modal.notes" class="form-input" placeholder="Optional notes" :disabled="!!modal.id" />
        </div>
      </div>

      <div style="margin-top:18px;">
        <div class="section-label">Items</div>
        <div v-for="(item, i) in modal.items" :key="i" class="item-row">
          <select v-model="item.variant" class="form-input item-variant" :disabled="!!modal.id">
            <option value="">Select variant…</option>
            <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.product_name }} — {{ v.sku }}</option>
          </select>
          <input v-model="item.quantity" type="number" min="1" class="form-input item-qty" placeholder="Qty" :disabled="!!modal.id" />
          <input v-model="item.unit_cost" type="number" min="0" step="0.01" class="form-input item-price" placeholder="Cost" :disabled="!!modal.id" />
          <button v-if="!modal.id" class="row-action danger" @click="modal.items.splice(i, 1)"><Trash2 :size="13" /></button>
        </div>
        <button v-if="!modal.id" class="btn-ghost" style="margin-top:8px;" @click="modal.items.push({ variant: '', quantity: 1, unit_cost: '' })">
          <Plus :size="13" /> Add Item
        </button>
      </div>

      <div class="invoice-totals">
        <div class="totals-row total-line">
          <span>Total Cost</span>
          <span>{{ auth.currencySymbol }} {{ formatNumber(modalTotal) }}</span>
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeModal">{{ modal.id ? 'Close' : 'Cancel' }}</button>
        <button v-if="!modal.id" class="btn-primary" :disabled="saving || !modal.supplier || modal.items.length === 0" @click="savePurchase">
          {{ saving ? 'Saving…' : 'Save Purchase' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ShoppingCart, PackageCheck, Trash2, Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const auth = useAuthStore()
const qab  = useQABStore()

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

async function receivePurchase(p) {
  if (!confirm(`Receive stock for this purchase from ${p.supplier_name || p.supplier}?`)) return
  await api.post(`/api/finance/purchases/${p.id}/receive/`)
  fetchPurchases(page.value)
}

async function deletePurchase(p) {
  if (!confirm('Delete this draft purchase?')) return
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
    alert(e.response?.data?.detail || 'Failed to save.')
  } finally {
    saving.value = false
  }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  qab.setActions([{ id: 'new', label: 'New Purchase', icon: 'plus', handler: openNew }])
  fetchPurchases()
  fetchSuppliers()
  fetchVariants()
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.toolbar { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
.filter-select { max-width:160px; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); white-space:nowrap; }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.col-name   { font-weight:500; }
.col-ref    { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-amount { font-variant-numeric:tabular-nums; }

.status-badge { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.status-draft    { background:#fef3c7; color:#92400e; }
.status-received { background:#dcfce7; color:#15803d; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action.success:hover { background:#dcfce7; color:#16a34a; }
.row-action.danger:hover  { background:#fee2e2; color:#dc2626; }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.section-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-bottom:10px; }

.item-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.item-variant { flex:2; min-width:0; }
.item-qty   { width:70px; flex-shrink:0; }
.item-price { width:100px; flex-shrink:0; }

.invoice-totals { margin-top:18px; border-top:1px solid var(--border); padding-top:14px; display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.totals-row { display:flex; gap:32px; font-size:13px; color:var(--text-secondary); }
.totals-row span:last-child { font-variant-numeric:tabular-nums; min-width:90px; text-align:right; }
.total-line { font-size:15px; font-weight:700; color:var(--text-primary); }

.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
