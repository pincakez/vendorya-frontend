<template>
  <div class="om-split">
    <div class="om-panel">
      <h2 class="om-panel-title">{{ t('finance.owner.move.title') }}</h2>
      <p class="om-sub">{{ t('finance.owner.move.hint') }}</p>
      <div v-if="options.length < 2" class="om-empty">{{ t('finance.owner.move.need_two') }}</div>
      <div v-else class="om-form">
        <BaseSelect v-model="form.from_box" :options="options" :label="t('finance.owner.f.from')" :placeholder="t('finance.owner.f.pick_box')" />
        <p v-if="src" class="om-help">{{ t('finance.owner.in_box_now') }}: <Money :value="src.box.balance ?? 0" /></p>
        <BaseSelect v-model="form.to_box" :options="toOptions" :label="t('finance.owner.f.to')" :placeholder="t('finance.owner.f.pick_box')" />
        <BaseInput v-model="form.amount" type="number" min="0" step="0.01" :label="t('finance.owner.f.amount')" placeholder="0.00" />
        <BaseInput v-model="form.note" :label="t('finance.owner.f.note')" :placeholder="t('finance.owner.f.move_note_ph')" />

        <!-- BEFORE saving: what this move will be (same rule as the server's ledger.pair_kinds) -->
        <div v-if="kind" class="om-verdict" :class="'om-verdict--' + kind">
          <component :is="verdictIcon" :size="18" style="flex-shrink:0;margin-top:2px" />
          <div>
            <strong>{{ t('finance.owner.move.kinds.' + kind) }}</strong>
            {{ t('finance.owner.move.explain.' + kind, { from: partName(t, src.part), to: partName(t, dst.part) }) }}
          </div>
        </div>
        <p v-if="overBalance" class="om-help">{{ t('finance.owner.move.over_balance') }}</p>

        <p v-if="error" class="om-err">{{ error }}</p>
        <div style="display:flex;justify-content:flex-end">
          <BaseButton :loading="saving" :disabled="!canSave" @click="save">
            <ArrowRightLeft :size="14" /> {{ kind ? t('finance.owner.move.save_' + kind) : t('finance.owner.move_money') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="om-panel">
      <h2 class="om-panel-title">{{ t('finance.owner.move.rules_title') }}</h2>
      <div v-for="k in KINDS" :key="k" class="om-verdict" :class="'om-verdict--' + k">
        <div>
          <strong>{{ t('finance.owner.move.kinds.' + k) }}</strong>
          {{ t('finance.owner.move.rule.' + k) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Repeat, Shuffle } from 'lucide-vue-next'
import api from '@/api/axios'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast } from '@/utils/toast'
import { treasuryError } from '@/utils/treasury'
import { OWNER_API, boxOptionsByPart, indexBoxes, moveKind, partName } from '@/utils/ownerMoney'

const props = defineProps({ parts: { type: Array, default: () => [] } })
const emit = defineEmits(['done'])
const { t } = useI18n()

const KINDS = ['TRANSFER', 'DRAW', 'PUT_IN', 'BETWEEN']
const form = reactive({ from_box: '', to_box: '', amount: '', note: '' })
const saving = ref(false)
const error = ref('')

const idx = computed(() => indexBoxes(props.parts))
const options = computed(() => boxOptionsByPart(t, props.parts))
const toOptions = computed(() => options.value.filter(o => o.value !== form.from_box))
const src = computed(() => idx.value[form.from_box] || null)
const dst = computed(() => idx.value[form.to_box] || null)
const kind = computed(() => (src.value && dst.value ? moveKind(src.value.part, dst.value.part) : ''))
const verdictIcon = computed(() => ({ TRANSFER: Repeat, DRAW: ArrowDownToLine, PUT_IN: ArrowUpFromLine, BETWEEN: Shuffle }[kind.value] || Repeat))
const overBalance = computed(() => !!src.value && Number(form.amount) > Number(src.value.box.balance || 0) && !src.value.box.allow_negative)
const canSave = computed(() => !!form.from_box && !!form.to_box && form.from_box !== form.to_box && Number(form.amount) > 0)

watch(() => form.from_box, v => { if (v && v === form.to_box) form.to_box = '' })

async function save() {
  error.value = ''
  saving.value = true
  try {
    const r = await api.post(`${OWNER_API}/moves/`, {
      from_box: form.from_box, to_box: form.to_box, amount: form.amount, note: form.note || '',
    })
    const done = KINDS.includes(r.data?.kind) ? r.data.kind : kind.value
    showSuccessToast(t('finance.owner.move.done', { kind: t('finance.owner.move.kinds.' + done) }), 2500)
    Object.assign(form, { from_box: '', to_box: '', amount: '', note: '' })
    emit('done')
  } catch (e) { error.value = treasuryError(t, e) } finally { saving.value = false }
}
</script>
