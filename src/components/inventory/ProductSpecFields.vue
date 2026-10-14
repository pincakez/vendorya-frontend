<template>
  <!-- s168 (PROLINE-PARITY Upgrade 9): the product's category SPEC SET — inherited lines first, in order,
       one input per type. Values live in the parent form's attrs map (keyed by attribute id), so switching
       category never loses what was typed: a value whose spec is gone shows up in the form's other attributes. -->
  <div v-if="specs.length" class="psf" data-testid="spec-fields">
    <div class="psf-head">
      <span class="psf-title">{{ t('inventory.specs.form_title') }}</span>
      <span class="psf-sub">{{ t('inventory.specs.form_sub') }}</span>
    </div>
    <div class="psf-grid">
      <div v-for="s in specs" :key="s.definition" class="psf-field">
        <template v-if="s.input_type === 'SELECT'">
          <!-- label row carries the "add a choice" button so the box lines up with its neighbour -->
          <div class="psf-fh">
            <label class="form-label psf-label">{{ labelOf(s) }}</label>
            <BaseButton v-if="allowAddOption" variant="ghost" size="sm" class="psf-add"
                        :title="t('inventory.products.product_modal.add_option_hint')"
                        @click="$emit('add-option', defOf(s))"><Plus :size="12" /></BaseButton>
          </div>
          <BaseSelect
            :options="selectOptions(s)"
            :model-value="valueOf(s)"
            :error="errorOf(s)"
            @update:model-value="v => setValue(s, v)"
          />
        </template>
        <BaseInput
          v-else
          :type="s.input_type === 'NUMBER' ? 'number' : 'text'"
          :label="labelOf(s)"
          :suffix="s.unit"
          :placeholder="s.name"
          :model-value="valueOf(s)"
          :error="errorOf(s)"
          @update:model-value="v => setValue(s, v)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  categoryId:     { type: [String, null], default: null },
  modelValue:     { type: Object, default: () => ({}) },   // { [attribute id]: value }
  attributes:     { type: Array,  default: () => [] },     // the shop's live definitions (fresher options)
  showErrors:     { type: Boolean, default: false },
  allowAddOption: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'state', 'add-option'])
const { t } = useI18n()

const specs = ref([])
let seq = 0

async function load(id) {
  const mine = ++seq
  if (!id) { specs.value = []; return }
  try {
    const { data } = await api.get(`/api/inventory/categories/${id}/specs/`)
    if (mine === seq) specs.value = data.effective || []
  } catch {
    if (mine === seq) specs.value = []   // no spec set → the form behaves exactly as before
  }
}
watch(() => props.categoryId, id => load(id), { immediate: true })

const liveDefs = computed(() => {
  const m = {}
  for (const d of props.attributes) m[d.id] = d
  return m
})
function defOf(s) { return liveDefs.value[s.definition] || { id: s.definition, name: s.name, options: s.options } }
const optText = o => (typeof o === 'string' ? o : (o?.value ?? o?.label ?? String(o)))

function valueOf(s) {
  const v = props.modelValue[s.definition]
  return v == null ? '' : String(v)
}
function setValue(s, v) {
  emit('update:modelValue', { ...props.modelValue, [s.definition]: v })
}
function labelOf(s) { return s.required ? `${s.name} *` : s.name }
function selectOptions(s) {
  const opts = (defOf(s).options || s.options || []).map(optText)
  const cur = valueOf(s)
  if (cur && !opts.includes(cur)) opts.unshift(cur)   // an older value not in the list stays visible
  return [{ value: '', label: '—' }, ...opts.map(o => ({ value: o, label: o }))]
}
const missing = computed(() => specs.value.filter(s => s.required && !valueOf(s).trim()).map(s => s.name))
function errorOf(s) {
  return props.showErrors && s.required && !valueOf(s).trim() ? t('inventory.specs.required') : ''
}

// Tell the form which attributes this block shows (so it doesn't show them twice) + what is still missing.
watch([specs, missing], () => {
  emit('state', { ids: specs.value.map(s => s.definition), missing: missing.value })
}, { immediate: true })
</script>

<style scoped>
.psf        { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; border-top: 1px solid var(--border); }
.psf-head   { display: flex; flex-direction: column; gap: 2px; }
.psf-title  { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .09em; color: var(--text-muted); }
.psf-sub    { font-size: 11.5px; color: var(--text-muted); }
.psf-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.psf-fh     { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px; }
.psf-label  { margin-bottom: 0; }
.psf-add    { flex-shrink: 0; height: 18px; padding: 0 6px; }
</style>
