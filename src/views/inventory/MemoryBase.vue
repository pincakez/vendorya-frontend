<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.memory_base.title') }}</h1>
        <p class="page-sub">{{ t('inventory.memory_base.sub') }}</p>
      </div>
      <div class="mb-head-actions">
        <BaseButton variant="ghost" size="sm" @click="openDedup">
          <CopyX :size="15" /> {{ t('inventory.memory_base.dedup_btn') }}
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="openImport">
          <Upload :size="15" /> {{ t('inventory.memory_base.import_btn') }}
        </BaseButton>
        <div class="mb-count" v-if="!loading">
          {{ t('inventory.memory_base.count', { n: formatNumber(total, { decimals: 0 }) }) }}
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-toolbar">
      <div class="mb-search">
        <Search :size="16" class="mb-search-ic" />
        <input
          v-model="search"
          class="form-input mb-search-input"
          :placeholder="t('inventory.memory_base.search_placeholder')"
          @input="debouncedFetch"
        />
        <button v-if="search" class="mb-search-clear" @click="clearSearch" :title="t('common.clear')">
          <X :size="14" />
        </button>
      </div>
    </div>

    <BaseTable :columns="columns" :rows="rows" :loading="loading">
      <template #empty>
        <Library :size="32" style="opacity:.3;margin-bottom:8px;" />
        <div>{{ search ? t('inventory.memory_base.empty_search') : t('inventory.memory_base.empty') }}</div>
      </template>
      <template #cell-name="{ row }">
        <span class="col-name">{{ row.name }}</span>
      </template>
      <template #cell-active_ing="{ row }">
        <span class="col-muted">{{ row.active_ing || '—' }}</span>
      </template>
      <template #cell-brand="{ row }">
        <span class="col-muted">{{ row.brand || '—' }}</span>
      </template>
      <template #cell-manufacturer="{ row }">
        <span class="col-muted">{{ row.manufacturer || '—' }}</span>
      </template>
    </BaseTable>

    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="p => { page = p; fetchEntries() }" />

    <!-- Remove duplicates -->
    <AppModal :open="dedupModal.open" :title="t('inventory.memory_base.dedup_title')" width="520px" @close="dedupModal.open = false">
      <p class="mb-import-hint">{{ t('inventory.memory_base.dedup_confirm') }}</p>
      <template #footer>
        <BaseButton variant="ghost" @click="dedupModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="primary" :loading="dedupModal.busy" @click="doDedup">
          {{ t('inventory.memory_base.dedup_btn') }}
        </BaseButton>
      </template>
    </AppModal>

    <!-- CSV import (rough stub) -->
    <AppModal :open="importModal.open" :title="t('inventory.memory_base.import_title')" width="560px" @close="closeImport">
      <div class="mb-import">
        <p class="mb-import-hint">{{ t('inventory.memory_base.import_hint') }}</p>
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
/*
 * Memory Base — the supplier-less, SKU-less reference pool of every product the
 * store has ever seen. It feeds the New Purchase / New Product autofill but never
 * shows in POS or the sellable items list. This page is its own browsable window
 * onto that pool. Queries the Products API with ?source=memory_base (the backend
 * opt-in shipped in Phase 1 · Step 1).
 */
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, X, Library, Upload, CopyX } from 'lucide-vue-next'
import api from '@/api/axios'
import { formatNumber } from '@/utils/format'
import { showSuccessToast } from '@/utils/toast'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { t } = useI18n()

const rows     = ref([])
const loading  = ref(false)
const search   = ref('')
const page     = ref(1)
const pageSize = ref(20)
const total    = ref(0)

const columns = [
  { key: 'name',         label: t('inventory.memory_base.col_name') },
  { key: 'active_ing',   label: t('inventory.memory_base.col_active_ing') },
  { key: 'brand',        label: t('inventory.memory_base.col_brand') },
  { key: 'manufacturer', label: t('inventory.memory_base.col_manufacturer') },
]

// attributes_summary is { KEY: [values…] }; we want the first value per key.
function attr(summary, key) {
  const v = summary?.[key]
  return Array.isArray(v) && v.length ? v[0] : ''
}

async function fetchEntries() {
  loading.value = true
  try {
    const params = { source: 'memory_base', page: page.value, page_size: pageSize.value }
    if (search.value) params.search = search.value
    const { data } = await api.get('/api/inventory/products/', { params })
    const results = data.results ?? data
    total.value = data.count ?? results.length
    rows.value = results.map(p => ({
      id: p.id,
      name: p.name,
      active_ing:   attr(p.attributes_summary, 'active_ing'),
      brand:        attr(p.attributes_summary, 'brand_ar'),
      manufacturer: attr(p.attributes_summary, 'manufacturer'),
    }))
  } catch {
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function debouncedFetch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchEntries() }, 300)
}
function clearSearch() { search.value = ''; page.value = 1; fetchEntries() }

// ── CSV import (rough stub) ──────────────────────────────────────────────────
const importModal = reactive({ open: false, file: null, busy: false, result: null, error: '' })
function openImport() { importModal.open = true; importModal.file = null; importModal.result = null; importModal.error = '' }
function closeImport() { importModal.open = false }
function onFilePick(e) { importModal.file = e.target.files?.[0] || null; importModal.result = null; importModal.error = '' }
async function doImport() {
  if (!importModal.file) return
  importModal.busy = true; importModal.error = ''
  try {
    // Read the CSV client-side and send as text — avoids multipart/Content-Type
    // pitfalls with the shared axios instance. The backend accepts {csv}.
    const csv = await importModal.file.text()
    const { data } = await api.post('/api/inventory/products/import-memory-base/', { csv })
    importModal.result = data
    showSuccessToast(t('inventory.memory_base.import_done', { created: data.created, skipped: data.skipped }))
    page.value = 1
    fetchEntries()
  } catch (err) {
    importModal.error = err?.response?.data?.detail || t('inventory.memory_base.import_error')
  } finally {
    importModal.busy = false
  }
}

// ── Remove duplicates ────────────────────────────────────────────────────────
const dedupModal = reactive({ open: false, busy: false })
function openDedup() { dedupModal.open = true }
async function doDedup() {
  dedupModal.busy = true
  try {
    const { data } = await api.post('/api/inventory/products/dedup-memory-base/')
    showSuccessToast(data.removed
      ? t('inventory.memory_base.dedup_done', { removed: data.removed })
      : t('inventory.memory_base.dedup_none'))
    dedupModal.open = false
    page.value = 1
    fetchEntries()
  } catch {
    showSuccessToast(t('inventory.memory_base.dedup_error'))
  } finally {
    dedupModal.busy = false
  }
}

onMounted(fetchEntries)
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.mb-head-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.mb-count {
  flex-shrink: 0; font-size: 13px; font-weight: 600; color: var(--accent);
  background: var(--accent-soft); border: 1px solid var(--accent);
  padding: 6px 12px; border-radius: 10px; white-space: nowrap;
}

.mb-toolbar { margin: 16px 0; }
.mb-search { position: relative; max-width: 420px; }
.mb-search-ic {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--text-secondary); opacity: 0.6; pointer-events: none;
}
.mb-search-input { padding-left: 36px; padding-right: 34px; width: 100%; }
.mb-search-clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border: none; background: none; cursor: pointer;
  color: var(--text-secondary); border-radius: 6px; transition: background 120ms, color 120ms;
}
.mb-search-clear:hover { background: var(--accent-soft); color: var(--accent); }

.col-name { font-weight: 600; color: var(--text-primary); }
.col-muted { color: var(--text-secondary); }

/* CSV import modal */
.mb-import { display: flex; flex-direction: column; gap: 12px; }
.mb-import-hint { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
.mb-import-file { font-size: 13px; color: var(--text-primary); }
.mb-import-result { font-size: 13px; font-weight: 600; color: var(--accent); margin: 0; }
.mb-import-error { font-size: 13px; color: var(--danger); margin: 0; }
</style>
