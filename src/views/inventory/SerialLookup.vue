<template>
  <!-- New 7/8: find one unit by its serial / IMEI / service tag — what it is, where it is, who sold it to whom,
       and whether its warranty still runs. Read-only; any shop role (a cashier checks warranty at the counter). -->
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('serials.lookup_title') }}</h1>
        <p class="page-sub">{{ t('serials.lookup_sub') }}</p>
      </div>
    </div>

    <BaseCard class="sl-search">
      <BaseInput v-model="query" :placeholder="t('serials.lookup_ph')" @input="onInput" />
    </BaseCard>

    <BaseTable :columns="columns" :rows="rows" :loading="loading" :sortable="false" @row-click="openDetail">
      <template #empty>
        <ScanBarcode :size="32" style="opacity:.3;margin-bottom:8px;" />
        <div>{{ query.trim() ? t('serials.lookup_none') : t('serials.lookup_start') }}</div>
      </template>
      <template #cell-serial="{ row }"><span class="sl-mono" dir="ltr">{{ row.serial }}</span></template>
      <template #cell-product_name="{ row }"><span class="sl-strong">{{ row.product_name }}</span></template>
      <template #cell-status="{ row }">
        <span class="sl-pill" :class="'sl-pill--' + row.status.toLowerCase()">{{ t(`serials.status.${row.status}`) }}</span>
      </template>
      <template #cell-branch_name="{ row }"><span class="sl-muted">{{ row.branch_name || '—' }}</span></template>
      <template #cell-sale="{ row }">
        <span v-if="row.sale" class="sl-muted">#{{ row.sale.invoice_number }} · {{ row.sale.customer_name || '—' }}</span>
        <span v-else class="sl-muted">—</span>
      </template>
      <template #cell-warranty_ends_on="{ row }">
        <span v-if="row.warranty_ends_on" :class="row.warranty_active ? 'sl-ok' : 'sl-muted'">
          {{ row.warranty_ends_on }} · {{ row.warranty_active ? t('serials.warranty_active') : t('serials.warranty_ended') }}
        </span>
        <span v-else class="sl-muted">—</span>
      </template>
    </BaseTable>
    <p v-if="truncated" class="sl-muted" style="margin-top:8px;">{{ t('serials.lookup_truncated') }}</p>

    <AppModal :open="!!detail" :title="detail ? detail.serial : ''" width="640px" @close="detail = null">
      <div v-if="detail" class="sl-detail">
        <div class="sl-grid">
          <div><div class="sl-label">{{ t('serials.col_product') }}</div>
            <router-link class="sl-strong" :to="`/inventory/products/${detail.product_id}`">{{ detail.product_name }}</router-link>
            <div class="sl-muted sl-mono">{{ detail.sku }}</div></div>
          <div><div class="sl-label">{{ t('serials.col_status') }}</div>
            <span class="sl-pill" :class="'sl-pill--' + detail.status.toLowerCase()">{{ t(`serials.status.${detail.status}`) }}</span>
            <div class="sl-muted">{{ detail.branch_name || '—' }}</div></div>
          <div><div class="sl-label">{{ t('serials.condition_label') }}</div>
            <div>{{ detail.condition ? t(conditionKey(detail.condition)) : '—' }}</div></div>
          <div><div class="sl-label">{{ t('serials.col_warranty_end') }}</div>
            <div v-if="detail.warranty_ends_on" :class="detail.warranty_active ? 'sl-ok' : 'sl-muted'">
              {{ t('serials.warranty_months_until', { months: formatQty(detail.warranty_months), date: detail.warranty_ends_on }) }}
              · {{ detail.warranty_active ? t('serials.warranty_active') : t('serials.warranty_ended') }}
            </div>
            <div v-else class="sl-muted">—</div></div>
          <div><div class="sl-label">{{ t('serials.col_purchase') }}</div>
            <div v-if="detail.purchase">
              {{ detail.purchase.supplier_name || '' }}<span v-if="detail.purchase.purchase_number"> · #{{ detail.purchase.purchase_number }}</span>
              <div class="sl-muted">{{ fmtDate(detail.purchase.date) }}</div>
            </div>
            <div v-else class="sl-muted">—</div></div>
          <div><div class="sl-label">{{ t('serials.col_sale') }}</div>
            <div v-if="detail.sale">
              <router-link :to="`/finance/invoices/${detail.sale.id}`">#{{ detail.sale.invoice_number }}</router-link>
              · {{ detail.sale.customer_name || '—' }}
              <div class="sl-muted">{{ fmtDate(detail.sale.date) }}</div>
            </div>
            <div v-else class="sl-muted">—</div></div>
        </div>

        <div class="sl-label" style="margin-top:18px;">{{ t('serials.history') }}</div>
        <div v-if="detailLoading" class="sl-muted">{{ t('serials.loading') }}</div>
        <ol v-else class="sl-history">
          <li v-for="(m, i) in (detail.moves || [])" :key="i">
            <span class="sl-strong">{{ t(`serials.move.${m.kind}`) }}</span>
            <span class="sl-muted"> · {{ fmtDate(m.at) }}</span>
            <span v-if="m.branch_name" class="sl-muted"> · {{ m.branch_name }}<span v-if="m.to_branch_name"> → {{ m.to_branch_name }}</span></span>
            <span v-if="m.sale" class="sl-muted"> · #{{ m.sale.invoice_number }} {{ m.sale.customer_name || '' }}</span>
            <span v-if="m.purchase && m.purchase.supplier_name" class="sl-muted"> · {{ m.purchase.supplier_name }}</span>
            <span v-if="m.refund_number" class="sl-muted"> · {{ t('serials.return_no', { n: m.refund_number }) }}</span>
            <span v-if="m.by" class="sl-muted"> · {{ m.by }}</span>
          </li>
        </ol>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ScanBarcode } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { formatQty } from '@/utils/format'
import { conditionKey } from '@/utils/serials'

const { t } = useI18n()
const route = useRoute()

const query = ref(String(route.query.q || ''))
const rows = ref([])
const truncated = ref(false)
const loading = ref(false)
const detail = ref(null)
const detailLoading = ref(false)
let timer = null

const columns = computed(() => [
  { key: 'serial',           label: t('serials.col_serial'),       type: 'text' },
  { key: 'product_name',     label: t('serials.col_product'),      type: 'text' },
  { key: 'status',           label: t('serials.col_status'),       type: 'text' },
  { key: 'branch_name',      label: t('serials.col_branch'),       type: 'text' },
  { key: 'sale',             label: t('serials.col_sale'),         type: 'text' },
  { key: 'warranty_ends_on', label: t('serials.col_warranty_end'), type: 'text' },
])

function onInput() {
  clearTimeout(timer)
  timer = setTimeout(search, 300)
}

async function search() {
  const q = query.value.trim()
  if (q.length < 2) { rows.value = []; truncated.value = false; return }
  loading.value = true
  try {
    const { data } = await api.get('/api/inventory/serials/', { params: { q } })
    rows.value = data.results || []
    truncated.value = !!data.truncated
  } catch { rows.value = [] } finally { loading.value = false }
}

async function openDetail(row) {
  detail.value = { ...row, moves: [] }
  detailLoading.value = true
  try {
    const { data } = await api.get(`/api/inventory/serials/${row.id}/`)
    detail.value = data
  } catch { /* keep the row's summary */ } finally { detailLoading.value = false }
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'
}

onMounted(() => { if (query.value) search() })
</script>

<style scoped>
.sl-search { margin-bottom: 16px; }
.sl-mono { font-family: ui-monospace, monospace; font-weight: 600; }
.sl-strong { font-weight: 600; color: var(--text-primary); }
.sl-muted { color: var(--text-muted); font-size: 12.5px; }
.sl-ok { color: var(--success); font-weight: 600; font-size: 12.5px; }
.sl-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin-bottom: 4px; }
.sl-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--border); background: var(--bg-app); color: var(--text-secondary); }
.sl-pill--in_stock { border-color: var(--success); color: var(--success); }
.sl-pill--sold { border-color: var(--accent); color: var(--accent); }
.sl-pill--returned, .sl-pill--written_off { border-color: var(--danger); color: var(--danger); }
.sl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.sl-history { margin: 0; padding-inline-start: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
:lang(ar) .sl-label { letter-spacing: 0; }
@media (max-width: 640px) { .sl-grid { grid-template-columns: 1fr; } }
</style>
