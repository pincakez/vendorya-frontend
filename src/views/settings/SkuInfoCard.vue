<template>
  <div class="sku-card">
    <div v-if="!data" class="sku-skel" />
    <template v-else>
      <div class="sku-row">
        <span class="sku-label">{{ t('settings.hub.sku_example') }}</span>
        <code class="sku-code" dir="ltr">{{ example }}</code>
      </div>
      <ul class="sku-facts">
        <li>{{ t('settings.hub.sku_parts', { p: data.sku_product_digits, s: data.sku_supplier_digits, c: shopCode }) }}</li>
        <li>{{ data.sku_dashes ? t('settings.hub.sku_dashes_on') : t('settings.hub.sku_dashes_off') }}</li>
        <li>{{ t('settings.hub.sku2_' + (data.sku2_state || 'OFF').toLowerCase()) }}</li>
      </ul>
      <p class="sku-note"><Lock :size="12" /> {{ t('settings.hub.set_by_vendorya') }}</p>
    </template>
  </div>
</template>

<script setup>
// s176 (Yakot 10-16): settings only sudo may change are shown to the owner read-only, with "Set by Vendorya",
// so the owner knows why the product codes look the way they do. Values come from GET /api/core/settings/.
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const data = ref(null)

const shopCode = computed(() => (data.value?.sku_shop_code || '').trim() || auth.user?.store?.store_code || '00')
// Same shape as Admin → SKU Management's preview: product no. 1 + a sample supplier code + the shop code.
const example = computed(() => {
  if (!data.value) return ''
  const head = '1'.padStart(Number(data.value.sku_product_digits) || 4, '0')
  const sup = '1'.padEnd(Number(data.value.sku_supplier_digits) || 3, '0')
  return data.value.sku_dashes ? [head, sup, shopCode.value].join('-') : head + sup + shopCode.value
})

onMounted(async () => {
  try { data.value = (await api.get('/api/core/settings/')).data } catch { data.value = {} }
})
</script>

<style scoped>
.sku-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:18px 20px; display:flex; flex-direction:column; gap:10px; }
.sku-skel { height:70px; border-radius:8px; background:var(--bg-app); }
.sku-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.sku-label { font-size:12.5px; color:var(--text-muted); }
.sku-code { font-family:ui-monospace, monospace; font-size:17px; font-weight:700; color:var(--text-primary); letter-spacing:.04em;
  background:var(--bg-app); border:1px dashed var(--border); border-radius:8px; padding:4px 10px; }
.sku-facts { margin:0; padding-inline-start:18px; font-size:13px; color:var(--text-secondary); display:flex; flex-direction:column; gap:2px; }
.sku-note { margin:0; font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px; }
</style>
