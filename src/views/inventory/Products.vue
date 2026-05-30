<template>
  <div class="inv">
    <!-- ── NON-STICKY: title + tabs (scroll away) ── -->
    <div class="inv-head">
      <h1 class="inv-title">Inventory</h1>
      <p class="inv-sub">Manage products, stock, categories, and suppliers</p>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" /> {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════ PRODUCTS TAB ═══════════ -->
    <div v-if="activeTab === 'products'">
      <!-- STICKY toolbar: search + category quick-filter + Filter -->
      <div class="dt-toolbar" ref="toolbarRef">
        <div class="dt-search">
          <Search :size="15" class="dt-search-icon" />
          <input v-model="search" class="dt-search-input" placeholder="Search by name, SKU…" @input="debouncedFetch" />
          <button v-show="search" class="dt-x" @click="clearSearch"><X :size="13" /></button>
        </div>

        <div class="cat-slider">
          <button v-if="cats.length > catWindow" class="cat-nav" @click="catScroll(-1)"><ChevronLeft :size="18" /></button>
          <div class="cat-track">
            <TransitionGroup :name="catDir">
              <button
                v-for="c in visibleCats" :key="c.id ?? 'all'"
                class="cat-pill" :class="{ active: activeCatId === c.id }"
                @click="setCat(c.id)"
              >{{ c.name }}</button>
            </TransitionGroup>
          </div>
          <button v-if="cats.length > catWindow" class="cat-nav" @click="catScroll(1)"><ChevronRight :size="18" /></button>
        </div>

        <button class="dt-filter" :class="{ on: showFilters }" @click="showFilters = !showFilters">
          <Filter :size="14" /> Filter
        </button>
      </div>

      <!-- optional advanced (attribute) filters -->
      <div v-if="showFilters && filterableAttrs.length" class="dt-filterpanel">
        <select v-for="attr in filterableAttrs" :key="attr.id" v-model="attrFilters[attr.key]" class="form-input filter-select" @change="fetchProducts(1)">
          <option value="">{{ attr.name }}</option>
          <option v-for="opt in attr.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <button class="btn-ghost" @click="clearFilters"><X :size="13" /> Clear</button>
      </div>

      <!-- TABLE -->
      <div class="dt-card">
        <div class="dt-xscroll">
          <table class="dt" :style="{ minWidth: tableMin + 'px' }">
            <thead :style="{ top: theadTop + 'px' }">
              <tr>
                <th
                  v-for="col in columns" :key="col.key"
                  class="dt-th" :class="[col.align === 'right' ? 'ta-right' : '', col.sort ? 'sortable' : '']"
                  :style="{ width: colWidths[col.key] + 'px', top: theadTop + 'px' }"
                  @click="col.sort && handleSort(col)"
                >
                  <span class="dt-th-inner" :class="{ jend: col.align === 'right' }">
                    <component v-if="col.align === 'right'" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                    {{ col.label }}
                    <component v-if="col.align !== 'right'" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                  </span>
                  <span class="dt-resize" @mousedown.stop.prevent="startResize(col.key, $event)" @click.stop></span>
                </th>
              </tr>
            </thead>

            <Transition :name="rowTransition" mode="out-in">
              <tbody :key="page">
                <tr v-if="loading"><td :colspan="columns.length" class="dt-loading">Loading…</td></tr>
                <template v-else>
                  <tr v-for="p in products" :key="p.id" class="dt-row">
                    <td class="c-sku">{{ p.sku_display || '—' }}</td>
                    <td class="c-name">{{ p.name }}</td>
                    <td class="c-sup">{{ p.supplier_name || '—' }}</td>
                    <td class="c-mono c-muted">{{ auth.currencySymbol }}{{ p.cost_display }}</td>
                    <td class="c-mono c-retail">{{ auth.currencySymbol }}{{ p.price_display }}</td>
                    <td class="c-mono c-profit">+{{ auth.currencySymbol }}{{ p.profit_display }}</td>
                    <td class="ta-right"><span class="stock-badge">{{ formatQty(p.total_stock) }}</span></td>
                  </tr>
                  <tr v-if="!products.length">
                    <td :colspan="columns.length" class="dt-empty">
                      <Package :size="40" class="dt-empty-icon" />
                      <div class="dt-empty-title">No products found</div>
                      <div class="dt-empty-sub">Adjust your search or filter.</div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </Transition>
          </table>
        </div>

        <!-- pagination -->
        <div class="dt-foot">
          <div class="dt-perpage">
            <span>PER PAGE</span>
            <select v-model.number="pageSize" @change="fetchProducts(1)">
              <option :value="50">50</option><option :value="75">75</option><option :value="100">100</option>
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
    </div>

    <!-- ═══════════ CATEGORIES TAB ═══════════ -->
    <div v-if="activeTab === 'categories'">
      <div class="dt-card simple">
        <table class="dt">
          <thead><tr><th class="dt-th">Name</th><th class="dt-th">Parent</th><th class="dt-th ta-right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="!categories.length"><td colspan="3" class="dt-empty"><div class="dt-empty-title">No categories yet</div></td></tr>
            <tr v-for="cat in categories" :key="cat.id" class="dt-row">
              <td class="c-name">{{ cat.name }}</td>
              <td class="c-sup">{{ categories.find(c => c.id === cat.parent)?.name || '—' }}</td>
              <td class="ta-right">
                <button class="row-action" @click="openEditCategory(cat)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deleteCategory(cat.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════ SUPPLIERS TAB ═══════════ -->
    <div v-if="activeTab === 'suppliers'">
      <div class="dt-card simple">
        <table class="dt">
          <thead><tr><th class="dt-th">Name</th><th class="dt-th">Code</th><th class="dt-th">Contact</th><th class="dt-th ta-right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="!suppliers.length"><td colspan="4" class="dt-empty"><div class="dt-empty-title">No suppliers yet</div></td></tr>
            <tr v-for="s in suppliers" :key="s.id" class="dt-row">
              <td class="c-name">{{ s.name }}</td>
              <td><span class="code-chip">{{ s.code_prefix }}</span></td>
              <td class="c-sup">{{ s.contact_info || '—' }}</td>
              <td class="ta-right">
                <button class="row-action" @click="openEditSupplier(s)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deleteSupplier(s.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════ REPORTS TAB ═══════════ -->
    <div v-if="activeTab === 'reports'" class="dt-empty" style="margin-top:48px;">
      <BarChart3 :size="36" class="dt-empty-icon" />
      <div class="dt-empty-title">Inventory Reports</div>
      <div class="dt-empty-sub">Coming soon</div>
    </div>

    <!-- MODALS -->
    <AppModal :open="catModal.open" :title="catModal.id ? 'Edit Category' : 'New Category'" @close="catModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">Name</label><input v-model="catModal.name" class="form-input" placeholder="Category name" /></div>
        <div><label class="form-label">Parent (optional)</label>
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

    <AppModal :open="supModal.open" :title="supModal.id ? 'Edit Supplier' : 'New Supplier'" @close="supModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">Name</label><input v-model="supModal.name" class="form-input" placeholder="Supplier name" /></div>
        <div><label class="form-label">3-digit code prefix</label><input v-model="supModal.code_prefix" class="form-input" placeholder="e.g. 130" maxlength="3" /></div>
        <div><label class="form-label">Contact info (optional)</label><textarea v-model="supModal.contact_info" class="form-input" rows="2" placeholder="Phone, email…" /></div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="supModal.open = false">Cancel</button>
        <button class="btn-primary" @click="saveSupplier" :disabled="!supModal.name.trim() || supModal.code_prefix.length !== 3">Save</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  Package, BarChart3, Search, X, Filter, Pencil, Trash2, Tags, Truck,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { formatQty } from '@/utils/format'
import AppModal from '@/components/ui/AppModal.vue'

const auth = useAuthStore()

const tabs = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]
const activeTab = ref('products')

/* ── columns ── */
const columns = [
  { key: 'sku',       label: 'SKU',       sort: 'o_sku',          align: 'left' },
  { key: 'product',   label: 'PRODUCT',   sort: 'name',           align: 'left' },
  { key: 'supplier',  label: 'SUPPLIER',  sort: 'supplier__name', align: 'left' },
  { key: 'wholesale', label: 'WHOLESALE', sort: 'o_wholesale',    align: 'left' },
  { key: 'retail',    label: 'RETAIL',    sort: 'o_retail',       align: 'left' },
  { key: 'profit',    label: 'PROFIT',    sort: 'o_profit',       align: 'left' },
  { key: 'inStock',   label: 'IN STOCK',  sort: 'o_stock',        align: 'right' },
]
const DEFAULT_WIDTHS = { sku: 130, product: 300, supplier: 170, wholesale: 120, retail: 120, profit: 120, inStock: 110 }
const WIDTH_KEY = 'dt_inventory_widths'
const colWidths = reactive({ ...DEFAULT_WIDTHS, ...(JSON.parse(localStorage.getItem(WIDTH_KEY) || 'null') || {}) })
const tableMin = computed(() => Object.values(colWidths).reduce((a, b) => a + b, 0))

/* ── sort (server-side) ── */
const sortKey = ref(null)
const sortDir = ref('asc')   // asc | desc
function handleSort(col) {
  if (sortKey.value === col.key) {
    if (sortDir.value === 'asc') sortDir.value = 'desc'
    else { sortKey.value = null; sortDir.value = 'asc' }
  } else { sortKey.value = col.key; sortDir.value = 'asc' }
  fetchProducts(1)
}
function arrowFor(col) {
  if (sortKey.value !== col.key) return ArrowUpDown
  return sortDir.value === 'asc' ? ArrowUp : ArrowDown
}

/* ── resize ── */
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
  localStorage.setItem(WIDTH_KEY, JSON.stringify({ ...colWidths }))
}

/* ── data ── */
const products = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const showFilters = ref(false)
const attrFilters = reactive({})
const attributes = ref([])
const rowTransition = ref('slide-left')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const from = computed(() => (page.value - 1) * pageSize.value + 1)
const to = computed(() => Math.min(page.value * pageSize.value, total.value))

const filterableAttrs = computed(() => attributes.value.filter(a => a.input_type === 'SELECT' && a.options?.length))

async function fetchProducts(p = 1) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, page_size: pageSize.value }
    if (search.value) params.search = search.value
    if (activeCatId.value) params.category = activeCatId.value
    if (sortKey.value) {
      const col = columns.find(c => c.key === sortKey.value)
      params.ordering = (sortDir.value === 'desc' ? '-' : '') + col.sort
    }
    for (const [k, v] of Object.entries(attrFilters)) if (v) params[k] = v
    const res = await api.get('/api/inventory/products/', { params })
    products.value = res.data.results ?? res.data
    total.value = res.data.count ?? products.value.length
  } catch { products.value = [] } finally { loading.value = false }
}
function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  rowTransition.value = p > page.value ? 'slide-left' : 'slide-right'
  fetchProducts(p)
}

let searchTimer = null
function debouncedFetch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => fetchProducts(1), 300) }
function clearSearch() { search.value = ''; fetchProducts(1) }
function clearFilters() { for (const k in attrFilters) attrFilters[k] = ''; fetchProducts(1) }

/* ── category quick-filter slider ── */
const cats = ref([{ id: null, name: 'All' }])
const activeCatId = ref(null)
const catWindow = 5
const catStart = ref(0)
const catDir = ref('cat-left')
const visibleCats = computed(() => {
  if (cats.value.length <= catWindow) return cats.value
  const out = []
  for (let i = 0; i < catWindow; i++) out.push(cats.value[(catStart.value + i) % cats.value.length])
  return out
})
function catScroll(d) {
  catDir.value = d > 0 ? 'cat-left' : 'cat-right'
  const n = cats.value.length
  catStart.value = ((catStart.value + d * catWindow) % n + n) % n
}
function setCat(id) { activeCatId.value = id; fetchProducts(1) }

/* ── sticky thead offset (measure toolbar) ── */
const toolbarRef = ref(null)
const theadTop = ref(64)
let ro = null

/* ── categories / suppliers CRUD ── */
const categories = ref([])
const suppliers = ref([])
const catModal = reactive({ open: false, id: null, name: '', parent: '' })
const supModal = reactive({ open: false, id: null, name: '', code_prefix: '', contact_info: '' })

async function fetchAttributes() { try { const r = await api.get('/api/inventory/attributes/'); attributes.value = r.data.results ?? r.data } catch { /* noop */ } }
async function fetchCategories() {
  try {
    const r = await api.get('/api/inventory/categories/')
    categories.value = r.data.results ?? r.data
    cats.value = [{ id: null, name: 'All' }, ...categories.value.map(c => ({ id: c.id, name: c.name }))]
  } catch { /* noop */ }
}
async function fetchSuppliers() { try { const r = await api.get('/api/inventory/suppliers/'); suppliers.value = r.data.results ?? r.data } catch { /* noop */ } }

function openEditCategory(c) { Object.assign(catModal, { open: true, id: c.id, name: c.name, parent: c.parent || '' }) }
async function saveCategory() {
  const payload = { name: catModal.name, parent: catModal.parent || null }
  catModal.id ? await api.patch(`/api/inventory/categories/${catModal.id}/`, payload) : await api.post('/api/inventory/categories/', payload)
  catModal.open = false; fetchCategories()
}
async function deleteCategory(id) { if (!confirm('Delete this category?')) return; await api.delete(`/api/inventory/categories/${id}/`); fetchCategories() }

function openEditSupplier(s) { Object.assign(supModal, { open: true, id: s.id, name: s.name, code_prefix: s.code_prefix, contact_info: s.contact_info || '' }) }
async function saveSupplier() {
  const payload = { name: supModal.name, code_prefix: supModal.code_prefix, contact_info: supModal.contact_info }
  supModal.id ? await api.patch(`/api/inventory/suppliers/${supModal.id}/`, payload) : await api.post('/api/inventory/suppliers/', payload)
  supModal.open = false; fetchSuppliers()
}
async function deleteSupplier(id) { if (!confirm('Delete this supplier?')) return; await api.delete(`/api/inventory/suppliers/${id}/`); fetchSuppliers() }

onMounted(() => {
  fetchAttributes(); fetchProducts(); fetchCategories(); fetchSuppliers()
  ro = new ResizeObserver(() => { if (toolbarRef.value) theadTop.value = toolbarRef.value.offsetHeight })
  if (toolbarRef.value) ro.observe(toolbarRef.value)
})
onUnmounted(() => { ro?.disconnect() })
</script>

<style scoped>
.inv-head { margin-bottom: 18px; }
.inv-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin: 0 0 4px; }
.inv-sub { font-size: 13.5px; color: var(--text-muted); margin: 0; }

.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 13.5px; font-weight: 500; color: var(--text-muted); border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

/* ── STICKY toolbar ── */
.dt-toolbar {
  position: sticky; top: 0; z-index: 30;
  display: flex; align-items: center; gap: 14px;
  background: var(--bg-app); margin: 0 -24px; padding: 14px 24px;
}
.dt-search { display: flex; align-items: center; gap: 6px; width: 300px; flex-shrink: 0; position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 11px; padding: 8px 10px; }
.dt-search-icon { color: var(--text-muted); flex-shrink: 0; }
.dt-search-input { flex: 1; border: none; background: none; outline: none; font-size: 13.5px; color: var(--text-primary); min-width: 0; }
.dt-x { display: flex; border: none; cursor: pointer; background: var(--border); color: var(--text-muted); border-radius: 6px; padding: 3px; }

.cat-slider { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.cat-nav { display: flex; flex-shrink: 0; border: none; background: none; cursor: pointer; color: var(--text-muted); border-radius: 8px; padding: 6px; transition: background 120ms, color 120ms; }
.cat-nav:hover { background: var(--sb-hover, var(--border)); color: var(--text-primary); }
.cat-track { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; overflow: hidden; }
.cat-pill { flex: 0 0 auto; padding: 9px 18px; border: 1px solid transparent; background: none; cursor: pointer; border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--text-muted); white-space: nowrap; transition: background 120ms, color 120ms; }
.cat-pill:hover { background: var(--bg-card); color: var(--text-primary); }
.cat-pill.active { background: var(--text-primary); color: var(--bg-card); font-weight: 600; }

.dt-filter { display: flex; align-items: center; gap: 7px; flex-shrink: 0; padding: 10px 16px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); border-radius: 11px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background 120ms, color 120ms; }
.dt-filter:hover, .dt-filter.on { color: var(--text-primary); border-color: var(--accent); }

.dt-filterpanel { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; }
.filter-select { max-width: 150px; }

/* ── TABLE ── */
/* No overflow:hidden — it would trap the sticky thead. Corners rounded via children. */
.dt-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.dt thead tr:first-child .dt-th:first-child { border-top-left-radius: 15px; }
.dt thead tr:first-child .dt-th:last-child  { border-top-right-radius: 15px; }
.dt-foot { border-radius: 0 0 15px 15px; }
.dt-card.simple { margin-top: 14px; }
.dt-xscroll { width: 100%; }
.dt { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }

.dt-th {
  position: sticky; z-index: 20;
  padding: 13px 16px; text-align: left; background: var(--bg-app);
  border-bottom: 1px solid var(--border); color: var(--text-primary);
  font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
  white-space: nowrap; user-select: none;
}
.dt-th.sortable { cursor: pointer; }
.dt-th.sortable:hover { background: var(--sb-hover, var(--border)); }
.dt-th.ta-right { text-align: right; }
.dt-th-inner { display: inline-flex; align-items: center; gap: 6px; }
.dt-th-inner.jend { justify-content: flex-end; }
.dt-arrow { color: var(--text-muted); opacity: 0.6; flex-shrink: 0; }
.dt-arrow.on { color: var(--accent); opacity: 1; }
.dt-resize { position: absolute; right: 0; top: 0; bottom: 0; width: 8px; cursor: col-resize; }
.dt-resize:hover { background: var(--accent-soft); }

.dt-row { border-bottom: 1px solid var(--border); transition: background 100ms; }
.dt-row:last-child { border-bottom: none; }
.dt-row:hover { background: var(--bg-app); }
.dt td { padding: 12px 16px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ta-right { text-align: right; }

.c-sku { font-family: ui-monospace, monospace; font-size: 11.5px; letter-spacing: 0.03em; color: var(--text-muted); }
.c-name { font-weight: 700; }
.c-sup { color: var(--text-secondary); font-size: 12.5px; }
.c-mono { font-family: ui-monospace, monospace; font-size: 12.5px; font-variant-numeric: tabular-nums; }
.c-muted { color: var(--text-muted); }
.c-retail { color: #16a34a; font-weight: 600; }
.c-profit { color: #16a34a; font-weight: 700; }
.dark .c-retail, .dark .c-profit { color: #4ade80; }

.stock-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; padding: 3px 9px; border-radius: 8px; background: var(--text-primary); color: var(--bg-card); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }

.dt-loading, .dt-empty { text-align: center; padding: 48px 20px; color: var(--text-muted); }
.dt-empty { display: flex; flex-direction: column; align-items: center; }
.dt-empty-icon { color: var(--text-muted); opacity: 0.4; margin-bottom: 10px; }
.dt-empty-title { font-weight: 700; color: var(--text-primary); font-size: 15px; }
.dt-empty-sub { font-size: 13px; margin-top: 3px; }

/* pagination */
.dt-foot { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
.dt-perpage { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: var(--text-muted); }
.dt-perpage select { background: var(--bg-app); border: 1px solid var(--border); border-radius: 7px; padding: 5px 8px; font-size: 12px; font-weight: 700; color: var(--text-primary); cursor: pointer; outline: none; }
.dt-showing { font-size: 11.5px; font-weight: 600; letter-spacing: 0.04em; color: var(--text-muted); }
.dt-pages { display: flex; align-items: center; gap: 6px; }
.dt-pg { display: flex; border: none; background: none; cursor: pointer; color: var(--text-secondary); border-radius: 7px; padding: 4px; transition: background 120ms; }
.dt-pg:hover:not(:disabled) { background: var(--border); color: var(--text-primary); }
.dt-pg:disabled { opacity: 0.3; cursor: default; }
.dt-pgnum { font-size: 13px; font-weight: 700; color: var(--text-primary); padding: 0 6px; }

/* reused */
.code-chip { font-family: ui-monospace, monospace; font-size: 12px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 5px; padding: 2px 7px; color: var(--text-secondary); }
.row-action { width: 28px; height: 28px; border: none; background: none; border-radius: 6px; cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; transition: background 100ms, color 100ms; }
.row-action:hover { background: var(--border); color: var(--text-primary); }
.row-action.danger:hover { background: #fee2e2; color: #dc2626; }
.btn-ghost { display: inline-flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 9px; font-size: 13px; font-weight: 500; border: 1px solid var(--border); background: none; color: var(--text-secondary); cursor: pointer; }
.btn-ghost:hover { background: var(--border); color: var(--text-primary); }
.btn-primary { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 600; border: none; background: var(--accent); color: #1a1208; cursor: pointer; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: .5; cursor: default; }
.form-label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }

/* row page transition */
.slide-left-enter-active, .slide-left-leave-active, .slide-right-enter-active, .slide-right-leave-active { transition: all 0.35s cubic-bezier(0.25,0.8,0.25,1); }
.slide-left-enter-from { opacity: 0; transform: translateX(30px); }
.slide-left-leave-to { opacity: 0; transform: translateX(-30px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-right-leave-to { opacity: 0; transform: translateX(30px); }

/* category slide */
.cat-left-enter-active, .cat-left-leave-active, .cat-right-enter-active, .cat-right-leave-active { transition: all 0.3s ease; }
.cat-left-enter-from { opacity: 0; transform: translateX(20px); }
.cat-left-leave-to { opacity: 0; transform: translateX(-20px); position: absolute; }
.cat-right-enter-from { opacity: 0; transform: translateX(-20px); }
.cat-right-leave-to { opacity: 0; transform: translateX(20px); position: absolute; }
</style>
