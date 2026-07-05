<!--
  AlternativesModal — same-active-ingredient discovery for the /sameing & /sametrade
  search flags. Shared by POS (in-stock only) and Memory Base (full catalog). Reuses
  AppModal; dense rows: trade name · strength · pack · pack price · stock.
-->
<template>
  <AppModal :open="open" :title="title" width="900px" anim="drop" @close="$emit('close')">
    <div v-if="loading" class="alt-state">{{ t('common.loading') }}…</div>

    <template v-else-if="items.length">
      <p class="alt-caption">
        {{ t('inventory.alternatives.count', { n: items.length, ing: ingredient }) }}
      </p>
      <div class="alt-list">
        <div v-for="p in rows" :key="p.id" class="alt-row">
          <div class="alt-main">
            <span class="alt-name">{{ p.name }}</span>
            <span v-if="p.strength" class="alt-strength">{{ p.strength }}</span>
          </div>
          <div class="alt-meta">
            <template v-if="context === 'pos'">
              <span v-if="p.packName" class="alt-pack">{{ p.packName }}</span>
              <span class="alt-price">{{ p.packPrice }}</span>
              <span class="alt-stock" :class="{ 'alt-stock--zero': p.stock <= 0 }">
                {{ p.stock > 0 ? p.stock : t('inventory.alternatives.out') }}
              </span>
            </template>
            <span v-else-if="p.manufacturer" class="alt-pack">{{ p.manufacturer }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="alt-state">{{ t('inventory.alternatives.empty') }}</div>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/ui/AppModal.vue'
import { formatCurrency } from '@/utils/format'

const props = defineProps({
  open:       { type: Boolean, default: false },
  title:      { type: String,  default: '' },
  ingredient: { type: String,  default: '' },
  items:      { type: Array,   default: () => [] },
  loading:    { type: Boolean, default: false },
  arabic:     { type: Boolean, default: false },   // show the Arabic ingredient value
  context:    { type: String,  default: 'pos' },   // 'pos' → price+stock; 'catalog' → manufacturer
})
defineEmits(['close'])
const { t } = useI18n()

function attr(p, key) {
  const v = p?.attributes_summary?.[key]
  return Array.isArray(v) ? (v[0] || '') : (v || '')
}
// The "pack" = the sellable unit with the largest factor (base unit if it's alone).
function pack(p) {
  const units = Array.isArray(p.selling_units) ? p.selling_units : []
  if (!units.length) return { name: '', price: p.default_variant_price }
  return units.reduce((a, b) => (Number(b.factor) > Number(a.factor) ? b : a))
}

const rows = computed(() => props.items.map(p => {
  const pk = pack(p)
  return {
    id: p.id,
    name: p.name,
    strength: attr(p, props.arabic ? 'active_ing_ar' : 'active_ing'),
    packName: pk.name || '',
    packPrice: formatCurrency(pk.price ?? p.default_variant_price ?? 0),
    stock: Number(p.default_variant_stock ?? p.total_stock ?? 0),
    manufacturer: attr(p, 'manufacturer'),
  }
}))
</script>

<style scoped>
.alt-caption {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-muted);
}
.alt-list {
  display: flex;
  flex-direction: column;
  max-height: 60vh;
  overflow-y: auto;
}
.alt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--border);
}
.alt-row:last-child { border-bottom: 0; }
.alt-main { display: flex; flex-direction: column; min-width: 0; }
.alt-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.alt-strength { font-size: 12px; color: var(--text-muted); }
.alt-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  font-size: 13px;
}
.alt-pack  { color: var(--text-muted); min-width: 48px; text-align: right; }
.alt-price { font-weight: 600; color: var(--text); min-width: 72px; text-align: right; }
.alt-stock {
  min-width: 56px;
  text-align: right;
  font-weight: 600;
  color: var(--accent);
}
.alt-stock--zero { color: var(--danger); font-weight: 500; }
.alt-state {
  padding: 32px 8px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
