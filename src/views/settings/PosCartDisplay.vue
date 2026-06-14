<template>
  <div>
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.cart_display.title') }}</h1>
        <p class="page-sub">{{ t('settings.cart_display.sub') }}</p>
      </div>
      <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? t('common.saving') : t('common.save') }}</button>
    </div>

    <div class="settings-card" :style="{ marginTop: embedded ? '0' : '24px' }">
      <div class="cd-head">
        <span class="cd-title">{{ t('settings.cart_display.heading') }}</span>
        <span class="cd-count" :class="{ full: selected.length >= 4 }">{{ selected.length }}/4</span>
      </div>
      <p class="cd-hint">{{ t('settings.cart_display.hint') }}</p>

      <div class="cd-grid">
        <button
          v-for="f in fields" :key="f.token"
          type="button"
          :class="['cd-chip', { active: isSelected(f.token), locked: !isSelected(f.token) && selected.length >= 4 }]"
          @click="toggle(f.token)"
        >
          <span class="cd-order" v-if="isSelected(f.token)">{{ orderOf(f.token) + 1 }}</span>
          <Check v-else :size="14" class="cd-check" />
          <span class="cd-label">{{ f.label }}</span>
          <span class="cd-kind">{{ f.kind }}</span>
        </button>
      </div>

      <div v-if="!fields.length" class="cd-empty">{{ t('settings.cart_display.no_fields') }}</div>

      <!-- Live preview of a cart line -->
      <div class="cd-preview-wrap">
        <span class="cd-preview-label">{{ t('settings.cart_display.preview') }}</span>
        <div class="cd-preview-row">
          <div class="cd-pr-main">
            <span class="cd-pr-name">{{ t('settings.cart_display.sample_name') }}</span>
            <div v-if="selected.length" class="cd-pr-attrs">
              <span v-for="tok in selected" :key="tok" class="cd-pr-attr">{{ sampleFor(tok) }}</span>
            </div>
          </div>
          <span class="cd-pr-qty">1</span>
          <span class="cd-pr-price">1,200.00</span>
        </div>
      </div>

      <div v-if="embedded" class="embedded-save">
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? t('common.saving') : t('common.save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import api from '@/api/axios'

defineProps({ embedded: { type: Boolean, default: false } })

const { t } = useI18n()

const fields   = ref([])      // [{ token, label, kind }]
const selected = ref([])      // ordered list of tokens
const saving   = ref(false)

// Sample values for the live preview, keyed by token.
const samples = ref({ category: 'Laptops' })

function isSelected(token) { return selected.value.includes(token) }
function orderOf(token)    { return selected.value.indexOf(token) }

function toggle(token) {
  const i = selected.value.indexOf(token)
  if (i >= 0) { selected.value.splice(i, 1); return }
  if (selected.value.length >= 4) return   // cap at 4 total
  selected.value.push(token)
}

function sampleFor(token) {
  return samples.value[token] || fields.value.find(f => f.token === token)?.sampleValue || '—'
}

onMounted(async () => {
  const [setRes, attrRes] = await Promise.all([
    api.get('/api/core/settings/'),
    api.get('/api/inventory/attributes/'),
  ])
  selected.value = Array.isArray(setRes.data.pos_cart_display_fields) ? [...setRes.data.pos_cart_display_fields] : []

  const attrs = attrRes.data.results || attrRes.data || []
  const list = [
    { token: 'category', label: t('settings.cart_display.category'), kind: t('settings.cart_display.kind_category'), sampleValue: 'Laptops' },
  ]
  for (const a of attrs) {
    const tok = `attr:${a.key}`
    list.push({ token: tok, label: a.name, kind: t('settings.cart_display.kind_attribute'), sampleValue: (a.options && a.options[0]) || a.name })
    samples.value[tok] = (a.options && a.options[0]) || a.name
  }
  fields.value = list
})

async function save() {
  saving.value = true
  try {
    await api.patch('/api/core/settings/', { pos_cart_display_fields: selected.value })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; max-width: 640px; }
.cd-head { display: flex; align-items: center; justify-content: space-between; }
.cd-title { font-size: 14px; font-weight: 800; color: var(--text-primary); }
.cd-count { font-size: 12px; font-weight: 800; color: var(--text-muted); padding: 3px 10px; border-radius: 8px; background: var(--bg-app); }
.cd-count.full { color: var(--accent); background: var(--accent-soft); }
.cd-hint { font-size: 12.5px; color: var(--text-muted); margin: 6px 0 16px; }

.cd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.cd-chip {
  display: flex; align-items: center; gap: 8px; text-align: left;
  padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--border);
  background: var(--bg-app); cursor: pointer; position: relative;
  box-shadow: var(--shadow-card);
  transition: background 140ms var(--ease-out), border-color 140ms var(--ease-out),
              box-shadow 140ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.cd-chip:hover:not(.locked) { border-color: var(--accent); }
.cd-chip:active:not(.locked) { transform: scale(var(--press-scale)); transition-duration: var(--press-down); }
.cd-chip.active { border-color: var(--accent); background: var(--accent-soft); }
.cd-chip.locked { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.cd-order {
  width: 20px; height: 20px; flex-shrink: 0; border-radius: 6px;
  background: var(--accent); color: #fff; font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.cd-check { color: var(--text-muted); flex-shrink: 0; }
.cd-label { flex: 1; font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cd-kind { font-size: 9.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
.cd-empty { font-size: 13px; color: var(--text-muted); text-align: center; padding: 20px; }

.cd-preview-wrap { margin-top: 22px; padding-top: 18px; border-top: 1px dashed var(--border); }
.cd-preview-label { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); }
.cd-preview-row {
  display: grid; grid-template-columns: 1fr 60px 90px; align-items: center;
  gap: 10px; margin-top: 10px; padding: 12px 14px; border-radius: 12px;
  background: var(--bg-app); box-shadow: var(--shadow-card);
}
.cd-pr-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.cd-pr-attrs { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
.cd-pr-attr {
  font-size: 10.5px; font-weight: 700; color: var(--text-secondary);
  background: var(--bg-card); border: 1px solid var(--border);
  padding: 1px 7px; border-radius: 6px;
}
.cd-pr-qty   { text-align: center; font-size: 13px; font-weight: 800; color: var(--text-secondary); }
.cd-pr-price { text-align: right; font-size: 13.5px; font-weight: 800; color: var(--text-primary); }

.embedded-save { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
