<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventory</h1>
        <p class="page-sub">Manage products, stock, categories, and suppliers</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB: Products -->
    <div v-if="activeTab === 'products'">
      <div class="toolbar">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input
            v-model="productSearch"
            class="form-input search-input"
            placeholder="Search by name, SKU, barcode…"
            @input="debouncedFetch"
          />
        </div>
        <template v-for="attr in filterableAttrs" :key="attr.id">
          <select v-model="attrFilters[attr.key]" class="form-input filter-select" @change="fetchProducts(1)">
            <option value="">{{ attr.name }}</option>
            <option v-for="opt in attr.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </template>
        <button class="btn-ghost" @click="clearFilters">
          <X :size="13" /> Clear
        </button>
      </div>

      <div class="table-wrap">
        <div v-if="productsLoading" class="table-skeleton">
          <div v-for="i in 8" :key="i" class="skeleton-row" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th v-for="attr in summaryAttrs" :key="attr.key">{{ attr.name }}</th>
              <th>Supplier</th>
              <th>Wholesale</th>
              <th class="col-retail">Retail</th>
              <th>Profit</th>
              <th class="col-stock">In Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="products.length === 0">
              <td :colspan="6 + summaryAttrs.length" class="table-empty">
                <Package :size="32" style="opacity:.3;margin-bottom:8px;" />
                <div>No products found</div>
              </td>
            </tr>
            <tr v-for="p in products" :key="p.id" class="table-row">
              <td class="col-sku">{{ p.id.slice(0,8).toUpperCase() }}</td>
              <td class="col-name">{{ p.name }}</td>
              <td v-for="attr in summaryAttrs" :key="attr.key" class="col-attr">
                {{ (p.attributes_summary?.[attr.key] || []).join(', ') || '—' }}
              </td>
              <td>{{ p.supplier_name || '—' }}</td>
              <td>{{ auth.currencySymbol }} {{ p.price_display }}</td>
              <td class="col-retail">{{ auth.currencySymbol }} {{ p.price_display }}</td>
              <td :class="profitClass(p.profit_display)">{{ auth.currencySymbol }} {{ p.profit_display }}</td>
              <td class="col-stock">
                <span class="stock-badge" :class="stockClass(p.total_stock)">{{ p.total_stock }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppPagination :page="productPage" :page-size="pageSize" :total="productTotal" @update:page="fetchProducts" />
    </div>

    <!-- TAB: Categories -->
    <div v-if="activeTab === 'categories'">
      <div class="toolbar">
        <span style="flex:1;font-size:13px;color:var(--text-muted);">{{ categories.length }} categories</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Parent</th><th style="width:80px;"></th></tr></thead>
          <tbody>
            <tr v-if="categories.length === 0">
              <td colspan="3" class="table-empty">No categories yet</td>
            </tr>
            <tr v-for="cat in categories" :key="cat.id" class="table-row">
              <td>{{ cat.name }}</td>
              <td>{{ categories.find(c => c.id === cat.parent)?.name || '—' }}</td>
              <td>
                <button class="row-action" @click="openEditCategory(cat)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deleteCategory(cat.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Suppliers -->
    <div v-if="activeTab === 'suppliers'">
      <div class="toolbar">
        <span style="flex:1;font-size:13px;color:var(--text-muted);">{{ suppliers.length }} suppliers</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Code</th><th>Contact</th><th style="width:80px;"></th></tr></thead>
          <tbody>
            <tr v-if="suppliers.length === 0">
              <td colspan="4" class="table-empty">No suppliers yet</td>
            </tr>
            <tr v-for="s in suppliers" :key="s.id" class="table-row">
              <td>{{ s.name }}</td>
              <td><span class="code-chip">{{ s.code_prefix }}</span></td>
              <td>{{ s.contact_info || '—' }}</td>
              <td>
                <button class="row-action" @click="openEditSupplier(s)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deleteSupplier(s.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Reports -->
    <div v-if="activeTab === 'reports'">
      <div class="table-empty" style="margin-top:48px;">
        <BarChart3 :size="36" style="opacity:.25;margin-bottom:10px;" />
        <div style="font-weight:600;">Inventory Reports</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Coming in Phase 2 final pass</div>
      </div>
    </div>

    <!-- MODAL: Category -->
    <AppModal :open="catModal.open" :title="catModal.id ? 'Edit Category' : 'New Category'" @close="catModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Name</label>
          <input v-model="catModal.name" class="form-input" placeholder="Category name" />
        </div>
        <div>
          <label class="form-label">Parent (optional)</label>
          <select v-model="catModal.parent" class="form-input">
            <option value="">None</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="catModal.open = false">Cancel</button>
        <button class="btn-primary" @click="saveCategory" :disabled="!catModal.name.trim()">Save</button>
      </template>
    </AppModal>

    <!-- MODAL: Supplier -->
    <AppModal :open="supModal.open" :title="supModal.id ? 'Edit Supplier' : 'New Supplier'" @close="supModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Name</label>
          <input v-model="supModal.name" class="form-input" placeholder="Supplier name" />
        </div>
        <div>
          <label class="form-label">2-digit code prefix</label>
          <input v-model="supModal.code_prefix" class="form-input" placeholder="e.g. 13" maxlength="2" />
        </div>
        <div>
          <label class="form-label">Contact info (optional)</label>
          <textarea v-model="supModal.contact_info" class="form-input" rows="2" placeholder="Phone, email…" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="supModal.open = false">Cancel</button>
        <button class="btn-primary" @click="saveSupplier" :disabled="!supModal.name.trim() || supModal.code_prefix.length !== 2">Save</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { Package, BarChart3, Search, X, Pencil, Trash2, Tags, Truck } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'

const auth = useAuthStore()
const qab  = useQABStore()

// ── TABS ────────────────────────────────────────────────
const tabs = [
  { id: 'products',   label: 'Products',   icon: Package },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'suppliers',  label: 'Suppliers',  icon: Truck },
  { id: 'reports',    label: 'Reports',    icon: BarChart3 },
]
const activeTab = ref('products')

watch(activeTab, tab => {
  if (tab === 'products') {
    qab.setActions([{ id: 'add', label: 'Add Product', icon: 'plus', handler: () => {} }])
  } else if (tab === 'categories') {
    qab.setActions([{ id: 'add-cat', label: 'New Category', icon: 'plus', handler: openNewCategory }])
  } else if (tab === 'suppliers') {
    qab.setActions([{ id: 'add-sup', label: 'New Supplier', icon: 'plus', handler: openNewSupplier }])
  } else {
    qab.clearActions()
  }
}, { immediate: true })

onUnmounted(() => qab.clearActions())

// ── PRODUCTS ────────────────────────────────────────────
const products        = ref([])
const productsLoading = ref(false)
const productTotal    = ref(0)
const productPage     = ref(1)
const pageSize        = 20
const productSearch   = ref('')
const attrFilters     = reactive({})
const attributes      = ref([])

const filterableAttrs = computed(() =>
  attributes.value.filter(a => a.input_type === 'SELECT' && a.options?.length)
)
const summaryAttrs = computed(() => filterableAttrs.value.slice(0, 4))

async function fetchAttributes() {
  try {
    const res = await api.get('/api/inventory/attributes/')
    attributes.value = res.data.results ?? res.data
  } catch {}
}

async function fetchProducts(page = 1) {
  productsLoading.value = true
  productPage.value = page
  try {
    const params = { page, page_size: pageSize }
    if (productSearch.value) params.search = productSearch.value
    for (const [k, v] of Object.entries(attrFilters)) {
      if (v) params[k] = v
    }
    const res = await api.get('/api/inventory/products/', { params })
    products.value = res.data.results ?? res.data
    productTotal.value = res.data.count ?? products.value.length
  } catch {
    products.value = []
  } finally {
    productsLoading.value = false
  }
}

let searchTimer = null
function debouncedFetch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchProducts(1), 300)
}

function clearFilters() {
  productSearch.value = ''
  for (const k in attrFilters) attrFilters[k] = ''
  fetchProducts(1)
}

function profitClass(val) {
  const n = parseFloat(String(val).split('–')[0])
  return isNaN(n) ? '' : n > 0 ? 'profit-pos' : n < 0 ? 'profit-neg' : ''
}

function stockClass(qty) {
  const n = Number(qty)
  if (n <= 0) return 'stock-zero'
  if (n <= 5)  return 'stock-low'
  return 'stock-ok'
}

// ── CATEGORIES ──────────────────────────────────────────
const categories = ref([])

async function fetchCategories() {
  try {
    const res = await api.get('/api/inventory/categories/')
    categories.value = res.data.results ?? res.data
  } catch {}
}

const catModal = reactive({ open: false, id: null, name: '', parent: '' })

function openNewCategory()    { Object.assign(catModal, { open: true, id: null, name: '', parent: '' }) }
function openEditCategory(c)  { Object.assign(catModal, { open: true, id: c.id, name: c.name, parent: c.parent || '' }) }

async function saveCategory() {
  const payload = { name: catModal.name, parent: catModal.parent || null }
  catModal.id
    ? await api.patch(`/api/inventory/categories/${catModal.id}/`, payload)
    : await api.post('/api/inventory/categories/', payload)
  catModal.open = false
  fetchCategories()
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return
  await api.delete(`/api/inventory/categories/${id}/`)
  fetchCategories()
}

// ── SUPPLIERS ───────────────────────────────────────────
const suppliers = ref([])

async function fetchSuppliers() {
  try {
    const res = await api.get('/api/inventory/suppliers/')
    suppliers.value = res.data.results ?? res.data
  } catch {}
}

const supModal = reactive({ open: false, id: null, name: '', code_prefix: '', contact_info: '' })

function openNewSupplier()   { Object.assign(supModal, { open: true, id: null, name: '', code_prefix: '', contact_info: '' }) }
function openEditSupplier(s) { Object.assign(supModal, { open: true, id: s.id, name: s.name, code_prefix: s.code_prefix, contact_info: s.contact_info || '' }) }

async function saveSupplier() {
  const payload = { name: supModal.name, code_prefix: supModal.code_prefix, contact_info: supModal.contact_info }
  supModal.id
    ? await api.patch(`/api/inventory/suppliers/${supModal.id}/`, payload)
    : await api.post('/api/inventory/suppliers/', payload)
  supModal.open = false
  fetchSuppliers()
}

async function deleteSupplier(id) {
  if (!confirm('Delete this supplier?')) return
  await api.delete(`/api/inventory/suppliers/${id}/`)
  fetchSuppliers()
}

// ── INIT ────────────────────────────────────────────────
onMounted(() => {
  fetchAttributes()
  fetchProducts()
  fetchCategories()
  fetchSuppliers()
})
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:20px; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:#2563eb; border-bottom-color:#2563eb; font-weight:600; }

.toolbar { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
.search-wrap  { position:relative; flex:1; min-width:200px; max-width:320px; }
.search-icon  { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding-left:32px !important; }
.filter-select { max-width:140px; }

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

.col-sku    { font-family:monospace; font-size:11px; color:var(--text-muted); }
.col-name   { font-weight:500; max-width:200px; }
.col-attr   { color:var(--text-secondary); }
.col-retail { color:#16a34a; font-weight:600; }
.profit-pos { color:#16a34a; }
.profit-neg { color:#dc2626; }

.stock-badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:600; }
.stock-ok   { background:#dcfce7; color:#15803d; }
.stock-low  { background:#fef9c3; color:#a16207; }
.stock-zero { background:#fee2e2; color:#dc2626; }

.code-chip { font-family:monospace; font-size:12px; background:var(--bg-app); border:1px solid var(--border); border-radius:5px; padding:2px 7px; color:var(--text-secondary); }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }

.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:#1d4ed8; }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }

.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
</style>
