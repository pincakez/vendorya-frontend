<script setup>
/**
 * AccountStatement — a كشف حساب (account statement) for ANY running account: supplier today,
 * customer next. The parent fetches and labels the lines; this component draws the toolbar
 * (date range · Show · CSV · Print), the opening line, one row per movement with its running
 * balance, the totals and the closing balance.
 *
 *   <AccountStatement
 *     v-model:date-from="from" v-model:date-to="to" @refresh="load"
 *     :party-label="t('…supplier')" :party-name="supplier.name"
 *     :lines="rows" :opening-balance="s.opening_balance" :closing-balance="s.closing_balance"
 *     :totals="s.totals" :debit-label="…" :credit-label="…" :balance-hint="…" filename="statement-x" />
 *
 * lines: [{ key, date (ISO), type (label), ref, note, by? (who made it — a small line under the note), debit, credit,
 *           running_balance, to?, dim? }]
 *   `to` = optional router path; the Ref cell becomes a link on screen. `dim` = draw the row faded (e.g. a reversed line).
 *
 * Optional slot `actions` ({ line }) — s169c, money boxes: one extra column at the end of each line (e.g. a Reverse
 * button). Screen only: the column never reaches the paper or the CSV.
 *
 * Print: the sheet is teleported to <body> for the print and everything else is hidden
 * (body.stmt-printing) — the app's sidebar/header never reach the paper.
 */
import { ref, computed, nextTick, onBeforeUnmount, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import { Printer, Download } from 'lucide-vue-next'
import Money from '@/components/ui/Money.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { formatDate } from '@/utils/date'
import { exportCSV } from '@/composables/useExport'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  title:          { type: String,  default: '' },
  partyLabel:     { type: String,  default: '' },
  partyName:      { type: String,  default: '' },
  partyMeta:      { type: String,  default: '' },
  lines:          { type: Array,   default: () => [] },
  openingBalance: { type: [Number, String], default: 0 },
  closingBalance: { type: [Number, String], default: 0 },
  totals:         { type: Object,  default: () => ({ debit: 0, credit: 0 }) },
  dateFrom:       { type: String,  default: '' },
  dateTo:         { type: String,  default: '' },
  debitLabel:     { type: String,  default: '' },
  creditLabel:    { type: String,  default: '' },
  balanceHint:    { type: String,  default: '' },
  loading:        { type: Boolean, default: false },
  error:          { type: String,  default: '' },
  filename:       { type: String,  default: 'account-statement' },
})
const emit = defineEmits(['update:dateFrom', 'update:dateTo', 'refresh'])

const { t } = useI18n()
const auth = useAuthStore()
const slots = useSlots()
const hasActions = computed(() => !!slots.actions)

const heading  = computed(() => props.title || t('finance.statement.title'))
const debitLbl  = computed(() => props.debitLabel  || t('finance.statement.cols.debit'))
const creditLbl = computed(() => props.creditLabel || t('finance.statement.cols.credit'))

// A bare YYYY-MM-DD parses as UTC midnight — pin it to midday so no timezone shifts the day.
function dayLabel(d) { return d ? formatDate(d.length === 10 ? d + 'T12:00:00Z' : d) : '' }
function fmtLineDate(iso) { return iso ? formatDate(iso) : '—' }

const period = computed(() => {
  if (!props.dateFrom && !props.dateTo) return t('finance.statement.all_dates')
  return `${dayLabel(props.dateFrom) || '…'} → ${dayLabel(props.dateTo) || '…'}`
})
const printedOn = computed(() => t('finance.statement.printed_on', { date: formatDate(new Date()) }))

// ── CSV (client-side, same numbers as the screen) ─────────────────────────
function exportCsv() {
  const cols = [
    { key: 'date',    label: t('finance.statement.cols.date'),    type: 'text' },
    { key: 'type',    label: t('finance.statement.cols.type'),    type: 'text' },
    { key: 'ref',     label: t('finance.statement.cols.ref'),     type: 'text' },
    { key: 'note',    label: t('finance.statement.cols.note'),    type: 'text' },
    ...(props.lines.some(l => l.by) ? [{ key: 'by', label: t('finance.statement.cols.by'), type: 'text' }] : []),
    { key: 'debit',   label: debitLbl.value,                      type: 'number' },
    { key: 'credit',  label: creditLbl.value,                     type: 'number' },
    { key: 'balance', label: t('finance.statement.cols.balance'), type: 'number' },
  ]
  const rows = [
    { date: dayLabel(props.dateFrom), type: t('finance.statement.opening'), balance: props.openingBalance },
    ...props.lines.map(l => ({
      date: fmtLineDate(l.date), type: l.type, ref: l.ref, note: l.note, by: l.by || '',
      debit: l.debit, credit: l.credit, balance: l.running_balance,
    })),
    { type: t('finance.statement.totals'), debit: props.totals?.debit, credit: props.totals?.credit },
    { date: dayLabel(props.dateTo), type: t('finance.statement.closing'), balance: props.closingBalance },
  ]
  exportCSV(rows, cols, props.filename)
}

// ── Print ─────────────────────────────────────────────────────────────────
const printing = ref(false)
function endPrint() {
  printing.value = false
  document.body.classList.remove('stmt-printing')
}
async function doPrint() {
  printing.value = true
  await nextTick()   // the sheet is now a direct child of <body>
  document.body.classList.add('stmt-printing')
  window.addEventListener('afterprint', endPrint, { once: true })
  window.print()
}
onBeforeUnmount(() => {
  window.removeEventListener('afterprint', endPrint)
  document.body.classList.remove('stmt-printing')
})
</script>

<template>
  <div class="stmt">
    <div class="stmt-toolbar">
      <div class="stmt-range">
        <BaseInput :model-value="dateFrom" type="date" :label="t('finance.statement.from')"
                   @update:model-value="v => emit('update:dateFrom', v)" />
        <BaseInput :model-value="dateTo" type="date" :label="t('finance.statement.to')"
                   @update:model-value="v => emit('update:dateTo', v)" />
        <BaseButton variant="secondary" :loading="loading" @click="emit('refresh')">{{ t('finance.statement.show') }}</BaseButton>
      </div>
      <div class="stmt-actions">
        <BaseButton variant="ghost" :disabled="loading || !!error" @click="exportCsv">
          <Download :size="15" /> {{ t('finance.statement.csv') }}
        </BaseButton>
        <BaseButton variant="secondary" :disabled="loading || !!error" @click="doPrint">
          <Printer :size="15" /> {{ t('finance.statement.print') }}
        </BaseButton>
      </div>
    </div>

    <Teleport to="body" :disabled="!printing">
      <div class="stmt-sheet">
        <header class="stmt-head">
          <div>
            <div class="stmt-store">{{ auth.storeName }}</div>
            <div class="stmt-title">{{ heading }}</div>
          </div>
          <div class="stmt-party">
            <div v-if="partyLabel" class="stmt-party-label">{{ partyLabel }}</div>
            <div class="stmt-party-name">{{ partyName }}</div>
            <div v-if="partyMeta" class="stmt-party-meta">{{ partyMeta }}</div>
            <div class="stmt-period">{{ t('finance.statement.period') }}: {{ period }}</div>
          </div>
        </header>

        <div v-if="error" class="stmt-error">{{ error }}</div>
        <div v-else-if="loading" class="table-skeleton"><div v-for="i in 5" :key="i" class="skeleton-row" /></div>
        <div v-else class="dt-card stmt-card">
          <div class="dt-xscroll">
            <table class="dt">
              <colgroup>
                <col style="width:11%" /><col style="width:17%" /><col style="width:10%" /><col style="width:21%" />
                <col style="width:13%" /><col style="width:14%" /><col style="width:14%" />
                <col v-if="hasActions" class="stmt-noprint" style="width:96px" />
              </colgroup>
              <thead>
                <tr>
                  <th class="dt-th">{{ t('finance.statement.cols.date') }}</th>
                  <th class="dt-th">{{ t('finance.statement.cols.type') }}</th>
                  <th class="dt-th">{{ t('finance.statement.cols.ref') }}</th>
                  <th class="dt-th">{{ t('finance.statement.cols.note') }}</th>
                  <th class="dt-th ta-right">{{ debitLbl }}</th>
                  <th class="dt-th ta-right">{{ creditLbl }}</th>
                  <th class="dt-th ta-right">{{ t('finance.statement.cols.balance') }}</th>
                  <th v-if="hasActions" class="dt-th stmt-noprint" />
                </tr>
              </thead>
              <tbody>
                <tr class="dt-row stmt-edge">
                  <td>{{ dayLabel(dateFrom) || '—' }}</td>
                  <td colspan="5">{{ t('finance.statement.opening') }}</td>
                  <td class="ta-right"><Money :value="openingBalance" /></td>
                  <td v-if="hasActions" class="stmt-noprint" />
                </tr>
                <tr v-if="!lines.length">
                  <td :colspan="hasActions ? 8 : 7" class="dt-empty">{{ t('finance.statement.empty') }}</td>
                </tr>
                <tr v-for="l in lines" :key="l.key" class="dt-row" :class="{ 'stmt-dim': l.dim }">
                  <td class="stmt-muted">{{ fmtLineDate(l.date) }}</td>
                  <td class="stmt-type">{{ l.type }}</td>
                  <td class="mono">
                    <router-link v-if="l.to && l.ref" :to="l.to" class="stmt-link">{{ l.ref }}</router-link>
                    <span v-else>{{ l.ref || '—' }}</span>
                  </td>
                  <td class="stmt-muted stmt-note" :title="[l.note, l.by].filter(Boolean).join(' — ')">
                    {{ l.note || '' }}
                    <span v-if="l.by" class="stmt-by">{{ t('finance.statement.by', { name: l.by }) }}</span>
                  </td>
                  <td class="ta-right"><Money v-if="Number(l.debit)" :value="l.debit" /></td>
                  <td class="ta-right"><Money v-if="Number(l.credit)" :value="l.credit" /></td>
                  <td class="ta-right stmt-bal"><Money :value="l.running_balance" /></td>
                  <td v-if="hasActions" class="ta-right stmt-noprint"><slot name="actions" :line="l" /></td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="stmt-total">
                  <td colspan="4">{{ t('finance.statement.totals') }}</td>
                  <td class="ta-right"><Money :value="totals?.debit || 0" /></td>
                  <td class="ta-right"><Money :value="totals?.credit || 0" /></td>
                  <td />
                  <td v-if="hasActions" class="stmt-noprint" />
                </tr>
                <tr class="stmt-total stmt-closing">
                  <td>{{ dayLabel(dateTo) || '' }}</td>
                  <td colspan="5">{{ t('finance.statement.closing') }}</td>
                  <td class="ta-right"><Money :value="closingBalance" /></td>
                  <td v-if="hasActions" class="stmt-noprint" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="stmt-foot">
          <span v-if="balanceHint">{{ balanceHint }}</span>
          <span class="stmt-printed">{{ printedOn }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.stmt { display:flex; flex-direction:column; gap:14px; }
.stmt-toolbar { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.stmt-range { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; }
.stmt-range :deep(.base-input-root) { width:170px; }
.stmt-actions { display:flex; gap:8px; }

.stmt-sheet { display:flex; flex-direction:column; gap:12px; }
.stmt-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
.stmt-store { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
.stmt-title { font-size:17px; font-weight:800; color:var(--text-primary); }
.stmt-party { text-align:right; }
.stmt-party-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
.stmt-party-name { font-size:15px; font-weight:700; color:var(--text-primary); }
.stmt-party-meta, .stmt-period { font-size:12px; color:var(--text-secondary); }

.stmt-error { padding:24px; text-align:center; color:var(--danger); }
.stmt-muted { color:var(--text-muted); }
.stmt-note { font-size:13px; }
.stmt-type { white-space:normal; }
.stmt-by { display:block; font-size:11.5px; color:var(--text-muted); margin-top:2px; }
.mono { font-family:ui-monospace,monospace; font-size:13px; }
.stmt-link { color:var(--accent); text-decoration:none; font-weight:600; }
.stmt-link:hover { text-decoration:underline; }
.stmt-bal { font-weight:700; }
.stmt-edge td { background:var(--bg-app); font-weight:600; color:var(--text-secondary); }
.stmt-total td { padding:12px 16px; border-top:1px solid var(--border); font-weight:700; color:var(--text-primary); font-size:14px; }
.stmt-closing td { background:var(--accent-soft); font-size:15px; font-weight:800; }
.stmt-closing td:first-child { border-bottom-left-radius:15px; }
.stmt-closing td:last-child  { border-bottom-right-radius:15px; }
.stmt-foot { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; font-size:12px; color:var(--text-muted); }
.stmt-printed { display:none; }
.stmt-dim td { opacity:.55; }

@media print {
  .stmt-sheet { display:block; color:black; background:white; padding:0; }
  .stmt-sheet * { color:black !important; }
  .stmt-head { border-bottom:2px solid black; padding-bottom:10px; margin-bottom:12px; }
  .stmt-card { box-shadow:none; border:none; }
  .stmt-sheet .dt-th { position:static; background:white; border-bottom:1.5px solid black; padding:6px 8px; font-size:10px; }
  .stmt-sheet .dt td { padding:6px 8px; font-size:11px; white-space:normal; }
  .stmt-edge td, .stmt-closing td { background:white; }
  .stmt-closing td { border-top:1.5px solid black; }
  .stmt-total td { padding:6px 8px; font-size:12px; }
  .stmt-foot { margin-top:14px; }
  .stmt-printed { display:inline; }
  .stmt-link { text-decoration:none; font-weight:400; }
  .stmt-noprint { display:none; }
  col.stmt-noprint { width:0 !important; }
}
</style>

<!-- Global on purpose: while printing, only the teleported statement sheet reaches the paper. -->
<style>
@media print {
  body.stmt-printing > *:not(.stmt-sheet) { display:none !important; }
}
</style>
