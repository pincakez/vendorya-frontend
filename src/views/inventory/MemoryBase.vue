<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.memory_base.title') }}</h1>
        <p class="page-sub">{{ t('inventory.memory_base.sub') }}</p>
      </div>
      <div class="mb-head-actions">
        <div class="mb-count" v-if="total > 0">
          {{ t('inventory.memory_base.count', { n: formatNumber(total, { decimals: 0 }) }) }}
        </div>
        <BaseButton variant="ghost" size="sm" @click="openDedup">
          <CopyX :size="15" /> {{ t('inventory.memory_base.dedup_btn') }}
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="openImport">
          <Upload :size="15" /> {{ t('inventory.memory_base.import_btn') }}
        </BaseButton>
      </div>
    </div>

    <FluidDataTable
      table-id="inventory_memory_base"
      :columns="MB_COLUMNS"
      :locked="LOCKED"
      :rows="rows"
      :total="total"
      :loading="loading"
      :page="page"
      :page-size="pageSize"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      :default-hidden="DEFAULT_HIDDEN"
      :default-widths="DEFAULT_WIDTHS"
      :row-clickable="false"
      @layout-ready="fetchEntries"
      @page-change="onPage"
      @page-size-change="onPageSize"
      @sort-change="onSort"
    >
      <!-- Search bar -->
      <template #toolbar-start>
        <div class="dt-search">
          <Search :size="15" class="dt-search-icon" />
          <input
            v-model="search"
            class="dt-search-input"
            :placeholder="t('inventory.memory_base.search_placeholder')"
            @input="debouncedFetch"
          />
          <button v-show="search" class="dt-x" @click="clearSearch"><X :size="13" /></button>
        </div>
      </template>

      <!-- Filter toggle -->
      <template #toolbar-filter-btn>
        <button class="dt-filter" :class="{ on: showFilters }" @click="showFilters = !showFilters">
          <Filter :size="14" /> {{ t('inventory.products.toolbar.filter') }}
        </button>
      </template>

      <!-- Filter panel -->
      <template #filters>
        <div v-if="showFilters" class="dt-filterpanel">
          <select v-model="catFilter" class="form-input filter-select" @change="fetchEntries(1)">
            <option value="">{{ t('inventory.memory_base.filter_all_cats') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <button class="btn-ghost" @click="clearFilters"><X :size="13" /> {{ t('common.clear') }}</button>
        </div>
      </template>

      <!-- Custom cells -->
      <template #cell-name="{ row }">
        <span class="mb-name">{{ row.name }}</span>
      </template>
      <template #cell-brand_ar="{ row }">
        <span class="mb-ar">{{ attrVal(row, 'brand_ar') }}</span>
      </template>
      <template #cell-active_ing="{ row }">
        <span class="mb-muted">{{ attrVal(row, 'active_ing') }}</span>
      </template>
      <template #cell-active_ing_ar="{ row }">
        <span class="mb-ar">{{ attrVal(row, 'active_ing_ar') }}</span>
      </template>
      <template #cell-manufacturer="{ row }">
        <span class="mb-muted">{{ attrVal(row, 'manufacturer') }}</span>
      </template>
      <template #cell-category="{ row }">
        <span class="mb-muted">{{ row.category_l1 || '—' }}</span>
      </template>
      <template #cell-price="{ row }">
        <Money v-if="row.price_display" :value="row.price_display" />
        <span v-else class="mb-muted">—</span>
      </template>

      <!-- Empty state -->
      <template #empty>
        <Library :size="32" style="opacity:.3;margin-bottom:8px;" />
        <div>{{ search ? t('inventory.memory_base.empty_search') : t('inventory.memory_base.empty') }}</div>
      </template>
    </FluidDataTable>

    <!-- Dedup modal -->
    <AppModal :open="dedupModal.open" :title="t('inventory.memory_base.dedup_title')" width="520px" @close="dedupModal.open = false">
      <p class="mb-hint">{{ t('inventory.memory_base.dedup_confirm') }}</p>
      <template #footer>
        <BaseButton variant="ghost" @click="dedupModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="primary" :loading="dedupModal.busy" @click="doDedup">
          {{ t('inventory.memory_base.dedup_btn') }}
        </BaseButton>
      </template>
    </AppModal>

    <!-- Import modal -->
    <AppModal :open="importModal.open" :title="t('inventory.memory_base.import_title')" width="560px" @close="closeImport">
      <div class="mb-import">
        <p class="mb-hint">{{ t('inventory.memory_base.import_hint') }}</p>
        <input type="file" accept=".csv,text/csv" class="mb-import-file" @change="onFilePick" />
        <p v-if="importModal.result" class="mb-import-result">
          {{ t('inventory.memory_base.import_done', { created: importModal.result.created, skipped: importModal.result.skipped }) }}
        </p>
        <p v-if="importModal.error" class="mb-import-error">{{ importModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="closeImport">{{ t('common.close') }}</BaseButton>
        <BaseButton variant="primary" :disabled="!importModal.file || importModal.busy" :loading="importModal.busy" @click="doImport">
          {{ t('inventory.memory_base.import_btn') }}
        </BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, X, Library, Upload, CopyX, Filter } from 'lucide-vue-next'
import api from '@/api/axios'
import { formatNumber } from '@/utils/format'
import { showSuccessToast } from '@/utils/toast'
import FluidDataTable from '@/components/base/FluidDataTable.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import Money from '@/components/ui/Money.vue'

const { t } = useI18n()

/* ── Column definitions ─────────────────────────────────────── */
const MB_COLUMNS = [
  { key: 'name',         label: 'DRUG NAME',        sort: 'name',      align: 'left',  field: 'name',          cls: '' },
  { key: 'brand_ar',     label: 'BRAND (AR)',        align: 'left',  field: 'brand_ar',      cls: '' },
  { key: 'active_ing',   label: 'ACTIVE ING.',       align: 'left',  field: 'active_ing',    cls: '' },
  { key: 'active_ing_ar',label: 'ACTIVE ING. (AR)',  align: 'left',  field: 'active_ing_ar', cls: '' },
  { key: 'manufacturer', label: 'MANUFACTURER',      align: 'left',  field: 'manufacturer',  cls: '' },
  { key: 'category',     label: 'CATEGORY',          align: 'left',  field: 'category_l1',   cls: '' },
  { key: 'price',        label: 'PRICE',             sort: 'o_retail', align: 'right', field: 'price_display', cls: '', money: true },
]
const LOCKED         = ['name']
const DEFAULT_HIDDEN = ['active_ing_ar']
const DEFAULT_WIDTHS = { name: 280, brand_ar: 200, active_ing: 220, active_ing_ar: 200, manufacturer: 180, category: 160, price: 110 }

/* ── Data state ─────────────────────────────────────────────── */
const rows      = ref([])
const loading   = ref(false)
const total     = ref(0)
const page      = ref(1)
const pageSize  = ref(50)
const search    = ref('')
const sortKey   = ref(null)
const sortDir   = ref('asc')
const showFilters = ref(false)
const catFilter   = ref('')
const categories  = ref([])

function attrVal(row, key) {
  const v = row.attributes_summary?.[key]
  return Array.isArray(v) && v.length ? v[0] : '—'
}

async function fetchEntries(p = page.value) {
  loading.value = true
  page.value = p
  try {
    const params = { source: 'memory_base', page: p, page_size: pageSize.value }
    if (search.value)  params.search    = search.value
    if (catFilter.value) params.category = catFilter.value
    if (sortKey.value) {
      const col = MB_COLUMNS.find(c => c.key === sortKey.value)
      if (col?.sort) params.ordering = (sortDir.value === 'desc' ? '-' : '') + col.sort
    }
    const { data } = await api.get('/api/inventory/products/', { params })
    const results  = data.results ?? data
    total.value    = data.count ?? results.length
    rows.value     = results
  } catch {
    rows.value = []; total.value = 0
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const { data } = await api.get('/api/inventory/categories/')
    categories.value = data.results ?? data
  } catch { /* noop */ }
}
fetchCategories()

/* ── Events from FluidDataTable ─────────────────────────────── */
function onPage(p)     { fetchEntries(p) }
function onPageSize(s) { pageSize.value = s; fetchEntries(1) }
function onSort({ key, dir, init }) {
  sortKey.value = key; sortDir.value = dir
  if (!init) fetchEntries(1)
}

/* ── Search ──────────────────────────────────────────────────── */
let searchTimer = null
function debouncedFetch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchEntries(1) }, 300)
}
function clearSearch()  { search.value = '';    page.value = 1; fetchEntries(1) }
function clearFilters() { catFilter.value = ''; showFilters.value = false; fetchEntries(1) }

/* ── Dedup ───────────────────────────────────────────────────── */
const dedupModal = reactive({ open: false, busy: false })
function openDedup() { dedupModal.open = true }
async function doDedup() {
  dedupModal.busy = true
  try {
    const { data } = await api.post('/api/inventory/products/dedup-memory-base/')
    showSuccessToast(data.removed
      ? t('inventory.memory_base.dedup_done',  { removed: data.removed })
      : t('inventory.memory_base.dedup_none'))
    dedupModal.open = false
    fetchEntries(1)
  } catch {
    showSuccessToast(t('inventory.memory_base.dedup_error'))
  } finally { dedupModal.busy = false }
}

/* ── Import ──────────────────────────────────────────────────── */
const importModal = reactive({ open: false, file: null, busy: false, result: null, error: '' })
function openImport()  { importModal.open = true; importModal.file = null; importModal.result = null; importModal.error = '' }
function closeImport() { importModal.open = false }
function onFilePick(e) { importModal.file = e.target.files?.[0] || null; importModal.result = null; importModal.error = '' }
async function doImport() {
  if (!importModal.file) return
  importModal.busy = true; importModal.error = ''
  try {
    const csv = await importModal.file.text()
    const { data } = await api.post('/api/inventory/products/import-memory-base/', { csv })
    importModal.result = data
    showSuccessToast(t('inventory.memory_base.import_done', { created: data.created, skipped: data.skipped }))
    fetchEntries(1)
  } catch (err) {
    importModal.error = err?.response?.data?.detail || t('inventory.memory_base.import_error')
  } finally { importModal.busy = false }
}
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; }
.mb-head-actions { display:flex; align-items:center; gap:12px; flex-shrink:0; }
.mb-count { flex-shrink:0; font-size:13px; font-weight:600; color:var(--accent); background:var(--accent-soft); border:1px solid var(--accent); padding:6px 12px; border-radius:10px; white-space:nowrap; }
.filter-select { max-width:200px; }

.mb-name { font-weight:700; color:var(--text-primary); }
.mb-muted { color:var(--text-secondary); font-size:14.5px; }
.mb-ar { color:var(--text-secondary); font-size:14.5px; direction:rtl; display:inline-block; }

.mb-hint { font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0; }
.mb-import { display:flex; flex-direction:column; gap:12px; }
.mb-import-file { font-size:13px; color:var(--text-primary); }
.mb-import-result { font-size:13px; font-weight:600; color:var(--accent); margin:0; }
.mb-import-error { font-size:13px; color:var(--danger); margin:0; }
</style>
