<template>
  <!-- The money lines behind a loan / an amana (newest first): date · what · box · amount. -->
  <div class="dt-card">
    <div class="dt-xscroll">
      <table class="dt">
        <thead>
          <tr>
            <th class="dt-th" style="width:105px">{{ t('common.date') }}</th>
            <th class="dt-th">{{ t('finance.owner.f.what') }}</th>
            <th class="dt-th">{{ t('finance.owner.f.box') }}</th>
            <th class="dt-th ta-right" style="width:130px">{{ t('finance.owner.f.amount') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!sorted.length"><td colspan="4" class="dt-empty">{{ t('finance.owner.no_lines') }}</td></tr>
          <template v-else>
            <tr v-for="l in sorted" :key="l.id" class="dt-row" :class="{ 'om-row-dim': l.reversed || l.reverses }">
              <td class="om-muted">{{ l.at ? formatDate(l.at) : (l.date ? formatDate(l.date + 'T12:00:00Z') : '—') }}</td>
              <td :title="l.note || ''" style="white-space:normal">
                {{ moveKindLabel(t, l.kind) }}<template v-if="l.reversed"> ({{ t('finance.treasury.reversed') }})</template>
                <div v-if="l.note" class="om-muted">{{ l.note }}</div>
              </td>
              <td style="white-space:normal">{{ l.box_name || boxLabel(l.box) }}</td>
              <td class="ta-right" :class="Number(l.amount) < 0 ? 'om-neg' : 'om-pos'"><Money :value="l.amount ?? 0" /></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/utils/date'
import { moveKindLabel, boxName } from '@/utils/treasury'
import { indexBoxes } from '@/utils/ownerMoney'

const props = defineProps({
  lines: { type: Array, default: () => [] },
  parts: { type: Array, default: () => [] },
})
const { t } = useI18n()
const idx = computed(() => indexBoxes(props.parts))
function boxLabel(id) { return idx.value[id] ? boxName(t, idx.value[id].box) : '—' }
const sorted = computed(() => [...props.lines].sort((a, b) => String(b.at || b.date || '').localeCompare(String(a.at || a.date || ''))))
</script>
