<template>
  <div>
    <div class="mr-pick" role="tablist">
      <button v-for="r in reports" :key="r" class="mr-pill" :class="{ on: report === r }" role="tab" @click="report = r">
        {{ t('finance.money_reports.names.' + r) }}
      </button>
    </div>

    <div class="om-toolbar">
      <div class="om-toolbar-left">
        <BaseInput v-if="onDate" v-model="on" type="date" :label="t('finance.money_reports.on_date')" />
        <template v-if="inRange">
          <BaseInput v-model="from" type="date" :label="t('finance.owner.f.date_from')" />
          <BaseInput v-model="to" type="date" :label="t('finance.owner.f.date_to')" />
        </template>
      </div>
      <BaseButton variant="secondary" :loading="loading" @click="load"><RefreshCw :size="14" /> {{ t('finance.owner.pnl.refresh') }}</BaseButton>
    </div>
    <p class="om-sub mr-hint">{{ t('finance.money_reports.hint.' + report) }}</p>

    <div v-if="error" class="om-empty om-error">{{ error }}</div>
    <div v-else-if="loading && !data" class="om-skel" style="height:160px" />
    <template v-else-if="data">
      <!-- Balances on a date -->
      <template v-if="report === 'balances'">
        <div class="om-kpis">
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.total') }}</div><div class="om-kpi-value"><Money :value="data.total" /></div></div>
          <template v-if="data.amanat_held !== undefined">
            <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.amanat_held') }}</div><div class="om-kpi-value"><Money :value="data.amanat_held" /></div></div>
            <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.own_money') }}</div><div class="om-kpi-value"><Money :value="Number(data.total) - Number(data.amanat_held)" /></div></div>
          </template>
          <div v-for="(v, k) in data.by_kind" :key="k" class="om-kpi"><div class="om-kpi-label">{{ kindLabel(t, k) }}</div><div class="om-kpi-value"><Money :value="v" /></div></div>
        </div>
        <BaseCard>
          <BaseTable :columns="balanceCols" :rows="data.boxes" :empty-text="t('finance.money_reports.empty')">
            <template #cell-part="{ row }">{{ partName(t, { kind: row.part_kind, name: row.part_name }) }}</template>
            <template #cell-name="{ row }">{{ boxName(t, row) }}<span v-if="!row.is_active" class="mr-muted"> · {{ t('finance.money_reports.closed') }}</span></template>
            <template #cell-kind="{ row }">{{ kindLabel(t, row.kind) }}</template>
            <template #cell-balance="{ row }"><span :class="{ 'om-neg': Number(row.balance) < 0 }"><Money :value="row.balance" /></span></template>
          </BaseTable>
        </BaseCard>
      </template>

      <!-- Movements -->
      <template v-else-if="report === 'movements'">
        <div class="om-kpis">
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.money_in') }}</div><div class="om-kpi-value om-pos"><Money :value="data.totals.money_in_without_transfers" /></div></div>
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.money_out') }}</div><div class="om-kpi-value om-neg"><Money :value="data.totals.money_out_without_transfers" /></div></div>
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.net') }}</div><div class="om-kpi-value"><Money :value="data.totals.net" /></div></div>
        </div>
        <h3 class="mr-title">{{ t('finance.money_reports.by_kind') }}</h3>
        <BaseCard>
          <BaseTable :columns="moveCols('kind')" :rows="data.by_kind" row-key="kind" :empty-text="t('finance.money_reports.empty')">
            <template #cell-kind="{ row }">{{ moveKindLabel(t, row.kind) }}</template>
            <template #cell-money_in="{ row }"><Money :value="row.money_in" /></template>
            <template #cell-money_out="{ row }"><Money :value="row.money_out" /></template>
            <template #cell-net="{ row }"><span :class="{ 'om-neg': Number(row.net) < 0 }"><Money :value="row.net" /></span></template>
          </BaseTable>
        </BaseCard>
        <h3 class="mr-title">{{ t('finance.money_reports.by_box') }}</h3>
        <BaseCard>
          <BaseTable :columns="moveCols('name')" :rows="data.by_box" row-key="box" :empty-text="t('finance.money_reports.empty')">
            <template #cell-name="{ row }">{{ row.name || t('finance.treasury.unsorted_name') }}</template>
            <template #cell-money_in="{ row }"><Money :value="row.money_in" /></template>
            <template #cell-money_out="{ row }"><Money :value="row.money_out" /></template>
            <template #cell-net="{ row }"><span :class="{ 'om-neg': Number(row.net) < 0 }"><Money :value="row.net" /></span></template>
          </BaseTable>
        </BaseCard>
        <h3 class="mr-title">{{ t('finance.money_reports.by_day') }}</h3>
        <BaseCard>
          <BaseTable :columns="moveCols('day')" :rows="data.by_day" row-key="day" :empty-text="t('finance.money_reports.empty')">
            <template #cell-day="{ row }">{{ fmtDay(row.day) }}</template>
            <template #cell-money_in="{ row }"><Money :value="row.money_in" /></template>
            <template #cell-money_out="{ row }"><Money :value="row.money_out" /></template>
            <template #cell-net="{ row }"><span :class="{ 'om-neg': Number(row.net) < 0 }"><Money :value="row.net" /></span></template>
          </BaseTable>
        </BaseCard>
      </template>

      <!-- Owner draws -->
      <template v-else-if="report === 'draws'">
        <div class="om-kpis">
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.drawn') }}</div><div class="om-kpi-value"><Money :value="data.drawn" /></div></div>
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.put_in') }}</div><div class="om-kpi-value"><Money :value="data.put_in" /></div></div>
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.net_drawn') }}</div><div class="om-kpi-value"><Money :value="data.net_drawn" /></div></div>
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.per_day', { n: data.days }) }}</div><div class="om-kpi-value"><Money :value="data.per_day" /></div></div>
        </div>
        <BaseCard>
          <BaseTable :columns="drawCols" :rows="data.by_part" row-key="part" :empty-text="t('finance.money_reports.empty')">
            <template #cell-name="{ row }">{{ partName(t, { kind: row.part_kind, name: row.name }) }}</template>
            <template #cell-drawn="{ row }"><Money :value="row.drawn" /></template>
            <template #cell-put_in="{ row }"><Money :value="row.put_in" /></template>
            <template #cell-net_drawn="{ row }"><Money :value="row.net_drawn" /></template>
          </BaseTable>
        </BaseCard>
        <h3 v-if="data.by_month.length" class="mr-title">{{ t('finance.money_reports.by_month') }}</h3>
        <BaseCard v-if="data.by_month.length">
          <BaseTable :columns="monthCols" :rows="data.by_month" row-key="month">
            <template #cell-drawn="{ row }"><Money :value="row.drawn" /></template>
          </BaseTable>
        </BaseCard>
      </template>

      <!-- Amanat -->
      <template v-else-if="report === 'amanat'">
        <div class="om-kpis">
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.money_reports.amanat_held') }}</div><div class="om-kpi-value"><Money :value="data.total" /></div></div>
        </div>
        <BaseCard>
          <BaseTable :columns="amanaCols" :rows="data.amanat" :empty-text="t('finance.money_reports.empty')">
            <template #cell-part_name="{ row }">{{ partName(t, { kind: row.part_kind, name: row.part_name }) }}</template>
            <template #cell-opened_on="{ row }">{{ fmtDay(row.opened_on) }}</template>
            <template #cell-received="{ row }"><Money :value="row.received" /></template>
            <template #cell-returned="{ row }"><Money :value="row.returned" /></template>
            <template #cell-held="{ row }"><Money :value="row.held" /></template>
          </BaseTable>
        </BaseCard>
      </template>

      <!-- Partners -->
      <template v-else-if="report === 'partners'">
        <BaseCard>
          <BaseTable :columns="partnerCols" :rows="data.partners" :empty-text="t('finance.money_reports.empty')">
            <template #cell-share_pct="{ row }">{{ formatNumber(row.share_pct) }}%</template>
            <template #cell-settled="{ row }"><span :class="{ 'om-neg': Number(row.settled) < 0 }"><Money :value="row.settled" /></span></template>
            <template #cell-put_in="{ row }"><Money :value="row.put_in" /></template>
            <template #cell-paid="{ row }"><Money :value="row.paid" /></template>
            <template #cell-balance_now="{ row }"><span :class="{ 'om-neg': Number(row.balance_now) < 0 }"><Money :value="row.balance_now" /></span></template>
          </BaseTable>
        </BaseCard>
        <p class="om-sub mr-hint">{{ t('finance.money_reports.partner_balance_hint') }}</p>
      </template>
    </template>
  </div>
</template>

<script setup>
/* Treasury Wave 3 reports (TREASURY.md § 8, New 9). scope="shop" (Finance → Treasury, managers): balances on a date +
   movements. scope="owner" (My money, the owner): the same over every part, plus draws, amanat and partners. */
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw } from 'lucide-vue-next'
import api from '@/api/axios'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import Money from '@/components/ui/Money.vue'
import { formatNumber } from '@/utils/format'
import { boxName, kindLabel, moveKindLabel, treasuryError } from '@/utils/treasury'
import { partName } from '@/utils/ownerMoney'
import './owner.css'

const props = defineProps({ scope: { type: String, default: 'shop' } })
const { t, locale } = useI18n()

const reports = computed(() => props.scope === 'owner'
  ? ['balances', 'movements', 'draws', 'amanat', 'partners'] : ['balances', 'movements'])
const report = ref('balances')
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const today = iso(new Date())
const on = ref(today)
const from = ref(iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
const to = ref(today)
const data = ref(null)
const loading = ref(false)
const error = ref('')

const onDate = computed(() => report.value === 'balances' || report.value === 'amanat')
const inRange = computed(() => report.value !== 'balances')
const base = computed(() => props.scope === 'owner' ? '/api/treasury/owner/reports/' : '/api/treasury/reports/')

const balanceCols = computed(() => [
  ...(props.scope === 'owner' ? [{ key: 'part', label: t('finance.money_reports.cols.part') }] : []),
  { key: 'name', label: t('finance.money_reports.cols.box') },
  { key: 'kind', label: t('finance.money_reports.cols.kind') },
  { key: 'balance', label: t('finance.money_reports.cols.balance'), type: 'currency' },
])
const moveCols = first => [
  { key: first, label: t('finance.money_reports.cols.' + (first === 'name' ? 'box' : first)) },
  { key: 'money_in', label: t('finance.money_reports.money_in'), type: 'currency' },
  { key: 'money_out', label: t('finance.money_reports.money_out'), type: 'currency' },
  { key: 'net', label: t('finance.money_reports.net'), type: 'currency' },
  { key: 'count', label: t('finance.money_reports.cols.count'), type: 'number' },
]
const drawCols = computed(() => [
  { key: 'name', label: t('finance.money_reports.cols.part') },
  { key: 'drawn', label: t('finance.money_reports.drawn'), type: 'currency' },
  { key: 'put_in', label: t('finance.money_reports.put_in'), type: 'currency' },
  { key: 'net_drawn', label: t('finance.money_reports.net_drawn'), type: 'currency' },
])
const monthCols = computed(() => [
  { key: 'month', label: t('finance.money_reports.cols.month') },
  { key: 'drawn', label: t('finance.money_reports.drawn'), type: 'currency' },
])
const amanaCols = computed(() => [
  { key: 'held_for', label: t('finance.money_reports.cols.held_for') },
  { key: 'part_name', label: t('finance.money_reports.cols.part') },
  { key: 'opened_on', label: t('finance.money_reports.cols.opened_on') },
  { key: 'received', label: t('finance.money_reports.cols.received'), type: 'currency' },
  { key: 'returned', label: t('finance.money_reports.cols.returned'), type: 'currency' },
  { key: 'held', label: t('finance.money_reports.cols.held'), type: 'currency' },
])
const partnerCols = computed(() => [
  { key: 'name', label: t('finance.money_reports.cols.partner') },
  { key: 'part_name', label: t('finance.money_reports.cols.part') },
  { key: 'share_pct', label: t('finance.money_reports.cols.share'), type: 'number' },
  { key: 'settled', label: t('finance.money_reports.cols.settled'), type: 'currency' },
  { key: 'put_in', label: t('finance.money_reports.cols.partner_put_in'), type: 'currency' },
  { key: 'paid', label: t('finance.money_reports.cols.paid'), type: 'currency' },
  { key: 'balance_now', label: t('finance.money_reports.cols.balance_now'), type: 'currency' },
])

function fmtDay(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString(locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  loading.value = true
  error.value = ''
  const params = {}
  if (onDate.value && on.value) params.date = on.value
  if (inRange.value) { if (from.value) params.date_from = from.value; if (to.value) params.date_to = to.value }
  try {
    data.value = (await api.get(base.value + report.value + '/', { params })).data
  } catch (e) {
    data.value = null
    error.value = treasuryError(t, e, t('finance.money_reports.err'))
  } finally { loading.value = false }
}

watch(report, () => { data.value = null; load() })
onMounted(load)
</script>

<style scoped>
.mr-pick { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.mr-pill { padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg-card);
  color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; }
.mr-pill.on { border-color: var(--accent); background: var(--accent-soft); color: var(--text-primary); }
.mr-hint { margin-bottom: 14px; }
.mr-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 18px 0 8px; }
.mr-muted { color: var(--text-muted); font-size: 12px; }
</style>
