<template>
  <!-- New 7: pick the exact unit(s) of a serial-tracked product being sold — scan / type a serial, or tick
       it in the list of units on the shelf at this branch. The quantity of the line = the serials picked. -->
  <AppModal :open="true" :title="t('serials.pick_title', { product: productName })" width="520px" @close="$emit('close')">
    <div class="spm-body">
      <div ref="scanEl" @keydown.enter.prevent="addScanned">
        <BaseInput v-model="scan" :placeholder="t('serials.pick_scan_ph')" :error="scanError" />
      </div>

      <div v-if="loading" class="spm-muted">{{ t('serials.loading') }}</div>
      <div v-else-if="!available.length" class="spm-muted">{{ t('serials.pick_none_here') }}</div>
      <div v-else class="spm-list">
        <div v-for="u in available" :key="u.id" class="spm-row" :class="{ 'spm-row--on': picked.includes(u.serial) }"
             role="checkbox" :aria-checked="picked.includes(u.serial)" tabindex="0"
             @click="toggle(u.serial)" @keydown.enter.prevent="toggle(u.serial)" @keydown.space.prevent="toggle(u.serial)">
          <span class="spm-box"><Check v-if="picked.includes(u.serial)" :size="13" /></span>
          <span class="spm-serial" dir="ltr">{{ u.serial }}</span>
        </div>
      </div>
      <div class="spm-count">{{ t('serials.count', { n: formatQty(picked.length) }) }}</div>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton :disabled="!picked.length" @click="$emit('confirm', [...picked])">{{ t('serials.pick_confirm') }}</BaseButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatQty } from '@/utils/format'
import { normalizeSerial } from '@/utils/serials'

const props = defineProps({
  productName: { type: String, default: '' },
  variantId:   { type: String, required: true },
  branchId:    { type: String, required: true },
  initial:     { type: Array,  default: () => [] },   // serials already on the line
})
defineEmits(['confirm', 'close'])
const { t } = useI18n()

const available = ref([])
const picked    = ref([...props.initial])
const loading   = ref(true)
const scan      = ref('')
const scanError = ref('')
const scanEl    = ref(null)

onMounted(async () => {
  try {
    const { data } = await api.get('/api/inventory/serials/', {
      params: { variant: props.variantId, branch: props.branchId, status: 'IN_STOCK' },
    })
    available.value = data.results || []
  } catch { available.value = [] }
  finally { loading.value = false }
  nextTick(() => scanEl.value?.querySelector('input')?.focus())
})

function toggle(serial) {
  const i = picked.value.indexOf(serial)
  if (i >= 0) picked.value.splice(i, 1)
  else picked.value.push(serial)
}

function addScanned() {
  const s = normalizeSerial(scan.value)
  scanError.value = ''
  if (!s) return
  if (!available.value.some(u => u.serial === s)) {
    scanError.value = t('serials.pick_not_here', { serial: s })
    return
  }
  if (!picked.value.includes(s)) picked.value.push(s)
  scan.value = ''
}
</script>

<style scoped>
.spm-body { display: flex; flex-direction: column; gap: 12px; }
.spm-muted { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
.spm-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
.spm-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--bg-card); cursor: pointer;
}
.spm-row:hover, .spm-row:focus-visible { border-color: var(--accent); outline: none; }
.spm-row--on { border-color: var(--accent); background: var(--accent-soft); }
.spm-box {
  width: 18px; height: 18px; border-radius: 5px; border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0;
}
.spm-row--on .spm-box { border-color: var(--accent); }
.spm-serial { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.spm-count { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
</style>
