<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.memory_base.title') }}</h1>
        <p class="page-sub">{{ t('inventory.memory_base.sub') }}</p>
      </div>
      <div class="mb-count" v-if="!loading">
        {{ t('inventory.memory_base.count', { n: formatNumber(total, { decimals: 0 }) }) }}
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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, X, Library } from 'lucide-vue-next'
import api from '@/api/axios'
import { formatNumber } from '@/utils/format'
import BaseTable from '@/components/base/BaseTable.vue'
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

onMounted(fetchEntries)
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
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
</style>
