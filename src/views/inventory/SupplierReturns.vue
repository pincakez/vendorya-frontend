<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.supplier_returns.title') }}</h1>
        <p class="page-sub">{{ t('inventory.supplier_returns.sub') }}</p>
      </div>
      <BaseButton variant="secondary" @click="$router.push('/inventory/purchases')">
        <ShoppingCart :size="14" /> {{ t('inventory.supplier_returns.from_purchase') }}
      </BaseButton>
    </div>

    <div class="sr-filters">
      <BaseSelect v-model="supplier" :options="supplierOptions" :placeholder="t('inventory.supplier_returns.all_suppliers')" />
    </div>

    <BaseCard>
      <BaseTable :columns="columns" :rows="rows" :loading="loading" :empty-text="t('inventory.supplier_returns.empty')"
                 storage-key="supplier_returns" @row-click="openDetail">
        <template #cell-return_number="{ row }">S#{{ row.return_number }}</template>
        <template #cell-date="{ row }">{{ fmtDate(row.date) }}</template>
        <template #cell-purchase_number="{ row }">{{ row.purchase_number || '—' }}</template>
        <template #cell-total_amount="{ row }"><Money :value="row.total_amount" /></template>
        <template #cell-refund_amount="{ row }"><Money v-if="Number(row.refund_amount) > 0" :value="row.refund_amount" /><span v-else>—</span></template>
        <template #cell-credit_amount="{ row }"><Money :value="row.credit_amount" /></template>
        <template #cell-status="{ row }">
          <span class="sr-pill" :class="row.status === 'VOID' ? 'void' : 'ok'">{{ t('inventory.supplier_returns.status.' + row.status) }}</span>
        </template>
      </BaseTable>
    </BaseCard>

    <AppModal :open="!!detail" :title="detail ? t('inventory.supplier_returns.detail_title', { n: detail.return_number }) : ''" width="820px" @close="closeDetail">
      <template v-if="detail">
        <div class="sr-meta">
          <div><span>{{ t('inventory.supplier_returns.cols.supplier') }}</span>{{ detail.supplier_name }}</div>
          <div><span>{{ t('inventory.supplier_returns.cols.purchase') }}</span>{{ detail.purchase_number || '—' }}</div>
          <div><span>{{ t('inventory.supplier_returns.cols.date') }}</span>{{ fmtDate(detail.date) }}</div>
          <div><span>{{ t('inventory.supplier_returns.branch') }}</span>{{ detail.branch_name }}</div>
          <div><span>{{ t('inventory.supplier_returns.by') }}</span>{{ detail.created_by_name || '—' }}</div>
          <div v-if="Number(detail.refund_amount) > 0"><span>{{ t('inventory.supplier_returns.money_back') }}</span>
            <Money :value="detail.refund_amount" /> · {{ detail.refund_method_name }}<template v-if="detail.refund_box_name"> → {{ detail.refund_box_name }}</template></div>
        </div>
        <BaseTable :columns="lineColumns" :rows="detail.items" :sortable="false">
          <template #cell-product_name="{ row }">
            <div>{{ row.product_name }}</div>
            <div class="sr-sku">{{ row.sku }}<template v-if="row.unit_name"> · {{ row.unit_name }}</template><template v-if="row.serial_numbers?.length"> · {{ row.serial_numbers.join(', ') }}</template></div>
          </template>
          <template #cell-unit_cost="{ row }"><Money :value="row.unit_cost" /></template>
          <template #cell-total_cost="{ row }"><Money :value="row.total_cost" /></template>
        </BaseTable>
        <div class="sr-totals">
          <div><span>{{ t('inventory.supplier_returns.total') }}</span><Money :value="detail.total_amount" /></div>
          <div class="sr-strong"><span>{{ t('inventory.supplier_returns.credit') }}</span><Money :value="detail.credit_amount" /></div>
        </div>
        <p v-if="detail.notes" class="sr-note">{{ detail.notes }}</p>
        <p v-if="detail.status === 'VOID'" class="sr-void">{{ t('inventory.supplier_returns.voided_because', { reason: detail.void_reason }) }}</p>
        <div v-if="voiding" class="sr-void-box">
          <BaseInput v-model="voidReason" :label="t('inventory.supplier_returns.void_reason')" :placeholder="t('inventory.supplier_returns.void_reason_ph')" />
          <p class="sr-hint">{{ t('inventory.supplier_returns.void_hint') }}</p>
        </div>
        <p v-if="error" class="sr-error">{{ error }}</p>
      </template>
      <template #footer>
        <BaseButton variant="ghost" @click="closeDetail">{{ t('common.close') }}</BaseButton>
        <template v-if="detail && detail.status === 'POSTED' && canVoid">
          <BaseButton v-if="!voiding" variant="danger" @click="voiding = true">{{ t('inventory.supplier_returns.void') }}</BaseButton>
          <BaseButton v-else variant="danger" :loading="saving" :disabled="!voidReason.trim()" @click="doVoid">{{ t('inventory.supplier_returns.void_confirm') }}</BaseButton>
        </template>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
/* Returns to suppliers (s171) — the list + one return's detail + Void (ADMIN). New returns start from a received
   purchase (Purchases → "Return to supplier"), so the quantity can be capped by what was bought. */
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCart } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import Money from '@/components/ui/Money.vue'
import { useAuthStore, ROLE_RANK } from '@/stores/auth'
import { supplierReturnError } from '@/utils/supplierReturns'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const rows = ref([])
const suppliers = ref([])
const supplier = ref('')
const detail = ref(null)
const voiding = ref(false)
const voidReason = ref('')
const saving = ref(false)
const error = ref('')

const canVoid = computed(() => (ROLE_RANK[auth.user?.role] || 0) >= ROLE_RANK.ADMIN)
const supplierOptions = computed(() => [{ value: '', label: t('inventory.supplier_returns.all_suppliers') },
  ...suppliers.value.map(s => ({ value: s.id, label: s.name }))])

const columns = computed(() => [
  { key: 'return_number',   label: '#' },
  { key: 'date',            label: t('inventory.supplier_returns.cols.date') },
  { key: 'supplier_name',   label: t('inventory.supplier_returns.cols.supplier') },
  { key: 'purchase_number', label: t('inventory.supplier_returns.cols.purchase') },
  { key: 'total_amount',    label: t('inventory.supplier_returns.total'), type: 'currency' },
  { key: 'refund_amount',   label: t('inventory.supplier_returns.money_back'), type: 'currency' },
  { key: 'credit_amount',   label: t('inventory.supplier_returns.credit'), type: 'currency' },
  { key: 'status',          label: t('inventory.supplier_returns.cols.status') },
])
const lineColumns = computed(() => [
  { key: 'product_name', label: t('inventory.supplier_returns.cols.product') },
  { key: 'quantity',     label: t('inventory.supplier_returns.cols.qty'), type: 'qty' },
  { key: 'unit_cost',    label: t('inventory.supplier_returns.cols.unit_cost'), type: 'currency' },
  { key: 'total_cost',   label: t('inventory.supplier_returns.cols.line_total'), type: 'currency' },
])

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/finance/purchase-returns/', { params: supplier.value ? { supplier: supplier.value } : {} })
    rows.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { rows.value = [] } finally { loading.value = false }
}

async function openDetail(row) {
  error.value = ''
  voiding.value = false
  voidReason.value = ''
  try {
    detail.value = (await api.get(`/api/finance/purchase-returns/${row.id}/`)).data
  } catch (e) { error.value = supplierReturnError(t, e) }
}
function closeDetail() {
  detail.value = null
  if (route.query.open) router.replace({ query: {} }).catch(() => {})
}

async function doVoid() {
  saving.value = true
  error.value = ''
  try {
    detail.value = (await api.post(`/api/finance/purchase-returns/${detail.value.id}/void/`, { reason: voidReason.value })).data
    voiding.value = false
    load()
  } catch (e) { error.value = supplierReturnError(t, e) } finally { saving.value = false }
}

watch(supplier, load)
onMounted(async () => {
  load()
  try {
    const r = await api.get('/api/inventory/suppliers/')
    suppliers.value = Array.isArray(r.data) ? r.data : (r.data.results || [])
  } catch { suppliers.value = [] }
  if (route.query.open) openDetail({ id: route.query.open })
})
</script>

<style scoped>
.sr-filters { display: flex; gap: 12px; margin-bottom: 12px; max-width: 320px; }
.sr-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.sr-pill.ok { background: var(--success-soft); color: var(--success); }
.sr-pill.void { background: var(--danger-soft); color: var(--danger); }
.sr-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px 16px; margin-bottom: 16px; color: var(--text-primary); }
.sr-meta span { display: block; font-size: 12px; color: var(--text-muted); }
.sr-sku { font-size: 12px; color: var(--text-muted); }
.sr-totals { margin-top: 16px; margin-inline-start: auto; max-width: 320px; display: flex; flex-direction: column; gap: 6px; }
.sr-totals > div { display: flex; justify-content: space-between; gap: 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.sr-strong { font-weight: 700; color: var(--text-primary) !important; border-top: 1px solid var(--border); padding-top: 6px; }
.sr-note { margin-top: 12px; color: var(--text-secondary); white-space: pre-wrap; }
.sr-void { margin-top: 12px; color: var(--danger); font-weight: 600; }
.sr-void-box { margin-top: 16px; }
.sr-hint { margin: 6px 0 0; font-size: 12px; color: var(--text-muted); }
.sr-error { margin-top: 12px; color: var(--danger); font-size: 13px; }
</style>
