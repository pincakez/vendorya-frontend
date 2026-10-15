<template>
  <AppModal :open="open" :title="t('inventory.supplier_returns.modal.title')" width="900px" :no-backdrop-close="true" @close="$emit('close')">
    <div v-if="loading" class="sr-loading">{{ t('inventory.supplier_returns.loading') }}</div>
    <div v-else-if="loadError" class="sr-error">{{ loadError }}</div>
    <template v-else>
      <p class="sr-intro">
        {{ t('inventory.supplier_returns.modal.intro', { supplier: info.supplier_name }) }}
      </p>

      <BaseTable :columns="columns" :rows="lines" row-key="purchase_item" :sortable="false" :min-width="720">
        <template #cell-product_name="{ row }">
          <div class="sr-name">{{ row.product_name }}</div>
          <div class="sr-sku">{{ row.sku }}<template v-if="row.unit_name"> · {{ row.unit_name }}</template></div>
        </template>
        <template #cell-left="{ row }">{{ formatQty(row.left) }}</template>
        <template #cell-unit_cost="{ row }"><Money :value="row.unit_cost" /></template>
        <template #cell-qty="{ row }">
          <div v-if="row.track_serials" class="sr-serials">
            <label v-for="s in row.serial_numbers" :key="s" class="sr-chip" :class="{ on: row.picked.includes(s) }">
              <input type="checkbox" :value="s" v-model="row.picked" class="sr-chip-box" />{{ s }}
            </label>
            <span v-if="!row.serial_numbers.length" class="sr-muted">{{ t('inventory.supplier_returns.modal.no_units') }}</span>
          </div>
          <BaseInput v-else v-model="row.qty" type="number" :disabled="Number(row.left) <= 0" placeholder="0" />
        </template>
        <template #cell-line_total="{ row }"><Money :value="lineTotal(row)" /></template>
      </BaseTable>

      <div class="sr-grid">
        <BaseInput v-model="form.refund_amount" type="number" :label="t('inventory.supplier_returns.modal.money_back')" placeholder="0" />
        <BaseSelect v-model="form.refund_method" :options="methodOptions" :label="t('inventory.supplier_returns.modal.method')"
                    :placeholder="t('inventory.supplier_returns.modal.method_ph')" :disabled="!(Number(form.refund_amount) > 0)" />
        <BaseSelect v-if="fmt.treasuryEnabled" v-model="form.refund_box" :options="boxOptions" :label="t('inventory.supplier_returns.modal.box')"
                    :placeholder="t('inventory.supplier_returns.modal.box_auto')" :disabled="!(Number(form.refund_amount) > 0)" />
        <BaseInput v-model="form.notes" class="sr-notes" :label="t('inventory.supplier_returns.modal.notes')" :placeholder="t('inventory.supplier_returns.modal.notes_ph')" />
      </div>
      <p class="sr-hint">{{ t('inventory.supplier_returns.modal.money_hint') }}</p>

      <div class="sr-totals">
        <div><span>{{ t('inventory.supplier_returns.total') }}</span><Money :value="total" /></div>
        <div><span>{{ t('inventory.supplier_returns.money_back') }}</span><Money :value="Number(form.refund_amount) || 0" /></div>
        <div class="sr-strong"><span>{{ t('inventory.supplier_returns.credit') }}</span><Money :value="total - (Number(form.refund_amount) || 0)" /></div>
      </div>
      <p v-if="error" class="sr-error">{{ error }}</p>
    </template>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton :loading="saving" :disabled="!canSave" @click="save">
        <Undo2 :size="14" /> {{ t('inventory.supplier_returns.modal.confirm') }}
      </BaseButton>
    </template>
  </AppModal>
</template>

<script setup>
/* Return goods to a supplier (s171) — opened from a RECEIVED purchase. POST /api/finance/purchase-returns/ creates AND
   posts it (stock out, the supplier's account credited, money handed back lands in a box). */
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Undo2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import Money from '@/components/ui/Money.vue'
import { formatQty } from '@/utils/format'
import { useFormatStore } from '@/stores/format'
import { fetchBoxes, boxOptionLabel } from '@/utils/treasury'
import { supplierReturnError } from '@/utils/supplierReturns'

const props = defineProps({
  open: { type: Boolean, default: false },
  purchaseId: { type: String, default: '' },
})
const emit = defineEmits(['close', 'saved'])
const { t } = useI18n()
const fmt = useFormatStore()

const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const error = ref('')
const info = ref({})
const lines = ref([])
const methods = ref([])
const boxes = ref([])
const form = reactive({ refund_amount: '', refund_method: '', refund_box: '', notes: '' })

const columns = computed(() => [
  { key: 'product_name', label: t('inventory.supplier_returns.cols.product') },
  { key: 'bought',       label: t('inventory.supplier_returns.cols.bought'), type: 'qty' },
  { key: 'returned',     label: t('inventory.supplier_returns.cols.returned'), type: 'qty' },
  { key: 'left',         label: t('inventory.supplier_returns.cols.left'), type: 'qty' },
  { key: 'unit_cost',    label: t('inventory.supplier_returns.cols.unit_cost'), type: 'currency' },
  { key: 'qty',          label: t('inventory.supplier_returns.cols.qty') },
  { key: 'line_total',   label: t('inventory.supplier_returns.cols.line_total'), type: 'currency' },
])

const methodOptions = computed(() => methods.value
  .filter(m => !m.is_agel && !m.is_store_credit)
  .map(m => ({ value: m.id, label: m.name })))
const boxOptions = computed(() => boxes.value.map(b => ({ value: b.id, label: boxOptionLabel(t, b) })))

function qtyOf(row) {
  return row.track_serials ? row.picked.length : (Number(row.qty) || 0)
}
function lineTotal(row) {
  return qtyOf(row) * Number(row.unit_cost || 0)
}
const total = computed(() => lines.value.reduce((s, r) => s + lineTotal(r), 0))
const chosen = computed(() => lines.value.filter(r => qtyOf(r) > 0))
const canSave = computed(() => !saving.value && chosen.value.length > 0 &&
  (!(Number(form.refund_amount) > 0) || !!form.refund_method))

async function load() {
  loading.value = true
  loadError.value = ''
  error.value = ''
  Object.assign(form, { refund_amount: '', refund_method: '', refund_box: '', notes: '' })
  try {
    const [r, m] = await Promise.all([
      api.get('/api/finance/purchase-returns/returnable/', { params: { purchase: props.purchaseId } }),
      api.get('/api/finance/payment-methods/'),
    ])
    info.value = r.data
    lines.value = (r.data.lines || []).map(l => ({ ...l, qty: '', picked: [] }))
    methods.value = Array.isArray(m.data) ? m.data : (m.data.results || [])
    boxes.value = fmt.treasuryEnabled ? await fetchBoxes() : []
  } catch (e) {
    loadError.value = supplierReturnError(t, e)
  } finally {
    loading.value = false
  }
}

watch(() => [props.open, props.purchaseId], ([o]) => { if (o && props.purchaseId) load() }, { immediate: true })

async function save() {
  saving.value = true
  error.value = ''
  try {
    const body = {
      purchase: props.purchaseId,
      lines: chosen.value.map(r => ({
        purchase_item: r.purchase_item,
        quantity: String(qtyOf(r)),
        ...(r.track_serials ? { serial_numbers: r.picked } : {}),
      })),
      notes: form.notes,
    }
    if (Number(form.refund_amount) > 0) {
      body.refund_amount = String(form.refund_amount)
      body.refund_method = form.refund_method
      if (form.refund_box) body.refund_box = form.refund_box
    }
    const res = await api.post('/api/finance/purchase-returns/', body)
    emit('saved', res.data)
  } catch (e) {
    error.value = supplierReturnError(t, e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sr-loading { padding: 24px; color: var(--text-muted); text-align: center; }
.sr-intro { margin: 0 0 12px; color: var(--text-secondary); font-size: 14px; }
.sr-name { font-weight: 600; color: var(--text-primary); }
.sr-sku { font-size: 12px; color: var(--text-muted); }
.sr-muted { color: var(--text-muted); }
.sr-serials { display: flex; flex-wrap: wrap; gap: 6px; }
.sr-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border: 1px solid var(--border);
  border-radius: 999px; font-size: 12px; cursor: pointer; color: var(--text-secondary); }
.sr-chip.on { border-color: var(--accent); background: var(--accent-soft); color: var(--text-primary); }
.sr-chip-box { accent-color: var(--accent); }
.sr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 16px; }
.sr-notes { grid-column: 1 / -1; }
.sr-hint { margin: 8px 0 0; font-size: 12px; color: var(--text-muted); }
.sr-totals { margin-top: 16px; margin-inline-start: auto; max-width: 320px; display: flex; flex-direction: column; gap: 6px; }
.sr-totals > div { display: flex; justify-content: space-between; gap: 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.sr-strong { font-weight: 700; color: var(--text-primary) !important; border-top: 1px solid var(--border); padding-top: 6px; }
.sr-error { margin-top: 12px; color: var(--danger); font-size: 13px; }
</style>
