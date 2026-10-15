<template>
  <div>
    <div class="om-toolbar">
      <div class="om-toolbar-left">
        <BaseSelect v-model="partId" :options="partOptions" :label="t('finance.owner.pnl.which')" :placeholder="t('finance.owner.f.pick_part')" />
        <BaseInput v-model="from" type="date" :label="t('finance.owner.f.date_from')" />
        <BaseInput v-model="to" type="date" :label="t('finance.owner.f.date_to')" />
      </div>
      <BaseButton variant="secondary" :loading="loading" :disabled="!partId" @click="load"><RefreshCw :size="14" /> {{ t('finance.owner.pnl.refresh') }}</BaseButton>
    </div>
    <p class="om-sub" style="margin-bottom:14px">{{ t('finance.owner.pnl.hint') }}</p>

    <div v-if="!partOptions.length" class="om-empty">{{ t('finance.owner.pnl.no_parts') }}</div>
    <div v-else-if="loading && !data" class="om-skel" style="height:160px" />
    <div v-else-if="error" class="om-empty om-error">{{ error }}</div>
    <template v-else-if="data && part">
      <!-- SHOP part: the shop P&L totals (same maths as Reports → Profit & Loss) -->
      <template v-if="part.kind === 'SHOP'">
        <div class="om-panel" style="max-width:560px">
          <h3 class="om-panel-title">{{ partName(t, part) }}</h3>
          <div class="om-summary">
            <div v-for="row in shopRows" :key="row.key" class="om-summary-row" :class="{ 'om-summary-row--total': row.total }">
              <span>{{ t('finance.owner.pnl.shop.' + row.key) }}</span>
              <span :class="{ 'om-neg': row.total && Number(row.value) < 0 }"><Money :value="row.sign * Number(row.value || 0)" /></span>
            </div>
          </div>
          <router-link to="/reports/pnl" class="om-link">{{ t('finance.owner.pnl.full_report') }}</router-link>
        </div>
      </template>

      <!-- BUSINESS part: income − expenses = net, by category -->
      <template v-else>
        <div class="om-kpis">
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.owner.pnl.income') }}</div><div class="om-kpi-value om-pos"><Money :value="data.income ?? 0" /></div></div>
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.owner.pnl.expenses') }}</div><div class="om-kpi-value om-neg"><Money :value="data.expenses ?? 0" /></div></div>
          <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.owner.pnl.net') }}</div><div class="om-kpi-value" :class="{ 'om-neg': Number(data.net) < 0 }"><Money :value="data.net ?? 0" /></div></div>
        </div>
        <div class="dt-card">
          <div class="dt-xscroll">
            <table class="dt">
              <thead>
                <tr>
                  <th class="dt-th" style="width:140px">{{ t('finance.owner.f.direction') }}</th>
                  <th class="dt-th">{{ t('finance.owner.f.category') }}</th>
                  <th class="dt-th ta-right" style="width:160px">{{ t('finance.owner.f.amount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!byCategory.length"><td colspan="3" class="dt-empty">{{ t('finance.owner.pnl.empty') }}</td></tr>
                <template v-else>
                  <tr v-for="(c, i) in byCategory" :key="i" class="dt-row">
                    <td><span class="om-tag" :class="c.direction === 'IN' ? 'om-tag--ok' : 'om-tag--warn'">{{ t('finance.owner.entries.dir.' + (c.direction === 'IN' ? 'IN' : 'OUT')) }}</span></td>
                    <td>{{ c.category || '—' }}</td>
                    <td class="ta-right" :class="c.direction === 'IN' ? 'om-pos' : 'om-neg'"><Money :value="c.amount ?? 0" /></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw } from 'lucide-vue-next'
import api from '@/api/axios'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { treasuryError } from '@/utils/treasury'
import { OWNER_API, partName, BUSINESS_PART_KINDS, localISO } from '@/utils/ownerMoney'

const props = defineProps({ parts: { type: Array, default: () => [] } })
const { t } = useI18n()

// Personal money is never profit → PERSONAL is not offered (the server would answer `personal_no_pnl`).
const bizParts = computed(() => props.parts.filter(p => BUSINESS_PART_KINDS.includes(p.kind)))
const partOptions = computed(() => bizParts.value.map(p => ({ value: p.id, label: partName(t, p) })))
const partId = ref('')
const part = computed(() => bizParts.value.find(p => String(p.id) === String(partId.value)) || null)
watch(bizParts, list => { if (!partId.value && list.length) partId.value = list[0].id }, { immediate: true })

const now = new Date()
const from = ref(localISO(new Date(now.getFullYear(), now.getMonth(), 1)))   // default: this month
const to = ref(localISO(now))

const data = ref(null)
const loading = ref(false)
const error = ref('')

async function load() {
  if (!partId.value) return
  loading.value = true
  error.value = ''
  try {
    const params = { part: partId.value }
    if (from.value) params.date_from = from.value
    if (to.value) params.date_to = to.value
    const r = await api.get(`${OWNER_API}/pnl/`, { params })
    data.value = r.data || {}
  } catch (e) {
    data.value = null
    const d = e?.response?.data
    error.value = (typeof d?.date_to === 'string' && d.date_to) || treasuryError(t, e, t('finance.owner.err_load'))
  } finally { loading.value = false }
}
watch([partId, from, to], () => { data.value = null; load() })

// The shop answer = the /api/reports/pnl/ totals (maybe wrapped in `totals`). Money out shows with a minus.
const shopRows = computed(() => {
  const tot = data.value?.totals || data.value || {}
  return [
    { key: 'revenue',      value: tot.revenue,      sign: 1 },
    { key: 'returns',      value: tot.returns,      sign: -1 },
    { key: 'cogs',         value: tot.cogs,         sign: -1 },
    { key: 'gross_profit', value: tot.gross_profit, sign: 1, total: true },
    { key: 'expenses',     value: tot.expenses,     sign: -1 },
    { key: 'other_income', value: tot.other_income, sign: 1 },
    { key: 'net',          value: tot.net,          sign: 1, total: true },
  ]
})
const byCategory = computed(() => [...(data.value?.by_category || [])]
  .sort((a, b) => (a.direction === 'IN' ? 0 : 1) - (b.direction === 'IN' ? 0 : 1) || Number(b.amount) - Number(a.amount)))

onMounted(load)
</script>
