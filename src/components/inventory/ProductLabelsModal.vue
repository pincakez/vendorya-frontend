<template>
  <!-- s167 (PROLINE-PARITY Upgrade 14): price stickers from the product list / product page.
       Same preset picker as a purchase's "Print Labels"; hands the SAME job shape to /print/labels. -->
  <AppModal :open="open" :title="t('inventory.labels.title')" width="420px" @close="$emit('close')">
    <div v-if="loading" class="pl-msg">{{ t('inventory.labels.loading') }}</div>
    <div v-else-if="error" class="pl-msg pl-err">{{ error }}</div>
    <div v-else-if="presets.length === 0" class="pl-msg">{{ t('inventory.purchases.label_picker_no_presets') }}</div>
    <div v-else-if="items.length === 0" class="pl-msg">{{ t('inventory.labels.none_found') }}</div>
    <div v-else class="pl-body">
      <div class="pl-presets">
        <label v-for="p in presets" :key="p.id" class="preset-option" :class="{ selected: selectedId === p.id }">
          <input v-model="selectedId" type="radio" :value="p.id" class="pl-hidden" />
          <div class="preset-info">
            <div class="preset-name">{{ p.name }}</div>
            <div class="preset-size">{{ p.width_mm }} × {{ p.height_mm }} mm</div>
          </div>
          <span v-if="p.is_default" class="pl-badge">{{ t('inventory.purchases.label_default_badge') }}</span>
        </label>
      </div>

      <div class="pl-section-title">{{ t('inventory.labels.per_item_title') }}</div>
      <div class="pl-modes">
        <label class="preset-option" :class="{ selected: mode === 'one' }">
          <input v-model="mode" type="radio" value="one" class="pl-hidden" />
          <span class="preset-name">{{ t('inventory.labels.per_item_one') }}</span>
        </label>
        <label class="preset-option" data-testid="labels-mode-stock" :class="{ selected: mode === 'stock' }">
          <input v-model="mode" type="radio" value="stock" class="pl-hidden" />
          <span class="preset-name">{{ t('inventory.labels.per_item_stock') }}</span>
        </label>
      </div>

      <p class="pl-summary" data-testid="labels-summary">{{ t('inventory.labels.summary', { n: formatNumber(totalLabels, { decimals: 0 }), items: formatNumber(items.length, { decimals: 0 }) }) }}</p>
      <p v-if="mode === 'stock' && hasWeight" class="pl-note">{{ t('inventory.labels.weight_note') }}</p>
      <p v-if="totalLabels > LABEL_BATCH" class="pl-note">{{ t('inventory.labels.batch_note', { max: LABEL_BATCH }) }}</p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton data-testid="labels-print" :disabled="!canPrint" @click="print"><Tag :size="14" /> {{ t('inventory.purchases.print_btn') }}</BaseButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Tag } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useLabelsStore, LABEL_BATCH, LABEL_MAX_PRODUCTS } from '@/stores/labels'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  open:       { type: Boolean, default: false },
  productIds: { type: Array,   default: () => [] },
})
const emit = defineEmits(['close'])

const { t } = useI18n()
const router = useRouter()
const labelsStore = useLabelsStore()

const loading    = ref(false)
const error      = ref('')
const presets    = ref([])
const selectedId = ref(null)
const items      = ref([])
const storeName  = ref('')
const mode       = ref('one')   // 'one' = 1 label per item · 'stock' = 1 per unit in stock

const qtyOf = i => (mode.value === 'stock' ? i.stock_labels : i.quantity) || 1
const totalLabels = computed(() => items.value.reduce((s, i) => s + qtyOf(i), 0))
const hasWeight   = computed(() => items.value.some(i => i.by_weight))
const canPrint    = computed(() => !loading.value && !!selectedId.value && items.value.length > 0)

async function load() {
  loading.value = true
  error.value = ''
  items.value = []
  mode.value = 'one'
  try {
    if (props.productIds.length > LABEL_MAX_PRODUCTS) {
      error.value = t('inventory.labels.too_many', { max: LABEL_MAX_PRODUCTS })
      return
    }
    const [pr, ld] = await Promise.all([
      api.get('/api/core/label-presets/'),
      api.post('/api/inventory/products/label-data/', { ids: props.productIds }),
    ])
    presets.value = pr.data.results ?? pr.data
    const def = presets.value.find(p => p.is_default) || presets.value[0]
    selectedId.value = def ? def.id : null
    items.value = ld.data.items || []
    storeName.value = ld.data.store_name
  } catch {
    error.value = t('inventory.labels.err_load')
  } finally {
    loading.value = false
  }
}

watch(() => props.open, v => { if (v) load() }, { immediate: true })

function print() {
  const preset = presets.value.find(p => p.id === selectedId.value)
  if (!preset) return
  labelsStore.setJob({
    source: 'products',
    preset,
    store_name: storeName.value,
    items: items.value.map(i => ({ ...i, quantity: qtyOf(i) })),
  })
  emit('close')
  router.push('/print/labels')
}
</script>

<style scoped>
.pl-msg { text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px; }
.pl-err { color: var(--danger); }
.pl-body { display: flex; flex-direction: column; gap: 8px; }
.pl-presets, .pl-modes { display: flex; flex-direction: column; gap: 8px; }
.pl-modes { flex-direction: row; }
.pl-modes .preset-option { flex: 1; }
.pl-hidden { display: none; }
.pl-section-title { margin-top: 8px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
.pl-summary { margin: 8px 0 0; font-size: 13px; font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.pl-note { margin: 0; font-size: 12px; color: var(--text-muted); line-height: 1.5; }
.pl-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
/* Same look as the purchase label picker (Purchases.vue) */
.preset-option { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border:1.5px solid var(--border); border-radius:8px; cursor:pointer; transition:border-color 100ms,background 100ms; }
.preset-option:hover   { background:var(--bg-app); }
.preset-option.selected { border-color:var(--accent); background:color-mix(in srgb, var(--accent) 8%, transparent); }
.preset-info { display:flex; flex-direction:column; gap:2px; }
.preset-name { font-size:13px; font-weight:600; color:var(--text-primary); }
.preset-size { font-size:11.5px; color:var(--text-muted); font-variant-numeric:tabular-nums; }
</style>
