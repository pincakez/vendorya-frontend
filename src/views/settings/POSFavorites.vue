<template>
  <div>
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.favorites.title') }}</h1>
        <p class="page-sub">{{ t('settings.favorites.sub') }}</p>
      </div>
    </div>

    <div class="fav-layout" :style="{ marginTop: embedded ? '0' : '24px' }">
      <!-- Current favorites -->
      <div class="table-wrap" style="flex:1;">
        <div class="fav-header">
          <span>{{ t('settings.favorites.heading', { n: favorites.length }) }}</span>
        </div>
        <div v-if="!favorites.length" class="fav-empty">{{ t('settings.favorites.empty') }}</div>
        <div v-for="(f, i) in favorites" :key="f.id" class="fav-row">
          <span class="fav-order">{{ i + 1 }}</span>
          <span class="fav-name">{{ f.product_name }}</span>
          <span class="fav-sku">{{ f.product_sku }}</span>
          <span class="fav-price">{{ f.product_price }}</span>
          <button class="fav-del" @click="remove(f)"><X :size="14" /></button>
        </div>
      </div>

      <!-- Search + add -->
      <div class="fav-search-card">
        <div class="fav-search-title">{{ t('settings.favorites.add_product') }}</div>
        <div class="fav-search-wrap">
          <Search :size="14" />
          <input v-model="q" @input="onSearch" class="fav-search-input" :placeholder="t('settings.favorites.search_ph')" />
        </div>
        <div v-for="p in results" :key="p.id" class="fav-result" @click="add(p)">
          <span class="fr-name">{{ p.name }}</span>
          <span class="fr-sku">{{ p.sku_display }}</span>
          <Plus :size="14" class="fr-add" />
        </div>
        <div v-if="!results.length && q.length >= 2" class="fav-empty">{{ t('settings.favorites.no_products') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, X, Plus } from 'lucide-vue-next'
import api from '@/api/axios'

defineProps({ embedded: { type: Boolean, default: false } })

const { t } = useI18n()

const favorites = ref([])
const results   = ref([])
const q         = ref('')

async function load() {
  const res = await api.get('/api/pos/favorites/')
  favorites.value = res.data.results || res.data
}
onMounted(load)

let timer = null
function onSearch() {
  clearTimeout(timer)
  if (q.value.length < 2) { results.value = []; return }
  timer = setTimeout(async () => {
    const res = await api.get('/api/inventory/products/', { params: { search: q.value, page_size: 10 } })
    results.value = res.data.results || res.data
  }, 250)
}

async function add(product) {
  if (favorites.value.length >= 10) { alert(t('settings.favorites.max_reached')); return }
  await api.post('/api/pos/favorites/', { product: product.id, order: favorites.value.length }).catch(e => {
    alert(e?.response?.data?.non_field_errors?.[0] || t('settings.favorites.err_add'))
  })
  q.value = ''; results.value = []
  load()
}

async function remove(f) {
  await api.delete(`/api/pos/favorites/${f.id}/`)
  load()
}
</script>

<style scoped>
.fav-layout { display: flex; gap: 24px; align-items: flex-start; }
.fav-header { padding: 14px 16px; font-size: 13px; font-weight: 800; color: var(--text-primary); border-bottom: 1px solid var(--border); }
.fav-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; }
.fav-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.fav-order { width: 20px; font-size: 12px; color: var(--text-muted); text-align: center; font-weight: 700; }
.fav-name  { flex: 1; font-size: 13px; font-weight: 700; color: var(--text-primary); }
.fav-sku   { font-family: monospace; font-size: 11px; color: var(--text-muted); }
.fav-price { font-size: 13px; font-weight: 800; color: var(--accent); }
.fav-del   { background: none; border: none; cursor: pointer; color: var(--text-muted); border-radius: 6px; padding: 4px; }
.fav-del:hover { background: var(--danger-soft); color: var(--danger); }

.fav-search-card {
  width: 300px; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
}
.fav-search-title { padding: 14px 16px; font-size: 13px; font-weight: 800; color: var(--text-primary); border-bottom: 1px solid var(--border); }
.fav-search-wrap {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-bottom: 1px solid var(--border);
  color: var(--text-muted);
}
.fav-search-input { flex: 1; border: none; background: none; outline: none; font-size: 13px; color: var(--text-primary); }
.fav-result {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  cursor: pointer; transition: background 120ms; border-bottom: 1px solid var(--border);
}
.fav-result:hover { background: var(--accent-soft); }
.fr-name { flex: 1; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.fr-sku  { font-family: monospace; font-size: 11px; color: var(--text-muted); }
.fr-add  { color: var(--accent); flex-shrink: 0; }
</style>
