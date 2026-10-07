<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">SKU Management</h1>
        <p class="page-sub">Each shop's product code setup and its second code (SKU2). Set it with the shop owner before the first product.</p>
      </div>
    </div>

    <div class="store-pick">
      <BaseSelect v-model="storeId" :options="storeOptions" label="Shop" placeholder="Pick a shop…" />
    </div>

    <div v-if="loading" class="muted">Loading…</div>

    <div v-else-if="data" class="sku-grid">
      <!-- ── Our SKU ─────────────────────────────────────────────── -->
      <BaseCard padding="lg">
        <div class="card-head">
          <h2 class="card-title">Our SKU</h2>
          <span class="badge" :class="data.setup_locked ? 'badge-warn' : 'badge-ok'">
            {{ data.setup_locked ? `${data.skus_count} SKUs made — changes need your password` : 'No products yet — free to set' }}
          </span>
        </div>
        <p class="hint">Product number + supplier code + shop code. A part grows by one digit by itself when its numbers run out. Existing SKUs (and their stickers) never change — only new ones follow a new setup.</p>

        <div class="form-grid">
          <BaseSelect v-model="form.sku_product_digits" :options="digitOpts([3, 4, 5])" label="Product digits" />
          <BaseSelect v-model="form.sku_supplier_digits" :options="digitOpts([2, 3])" label="Supplier digits (new suppliers)" />
          <BaseInput v-model="form.sku_shop_code" label="Shop code (2–3 digits)" :placeholder="data.store_code ? `empty = store code ${data.store_code}` : '2 digits'" :error="shopCodeError" />
          <BaseSelect v-model="form.product_numbering_mode" :options="modeOpts" label="New product numbers" />
        </div>
        <label class="check-row"><input type="checkbox" v-model="form.sku_dashes" class="check-input" /> <span>Dashes between the parts (123-45-67) — two SKUs can never look the same</span></label>

        <div class="preview">
          <span class="preview-label">Next SKU of a new supplier looks like</span>
          <code class="preview-code">{{ preview }}</code>
        </div>
        <div class="card-actions">
          <BaseButton variant="admin" :loading="savingSetup" :disabled="!!shopCodeError || !setupDirty" @click="saveSetup()">Save SKU setup</BaseButton>
        </div>
      </BaseCard>

      <!-- ── SKU2 ────────────────────────────────────────────────── -->
      <BaseCard padding="lg">
        <div class="card-head">
          <h2 class="card-title">SKU2 — second code</h2>
          <span class="badge" :class="{ 'badge-off': data.sku2_state === 'OFF', 'badge-ok': data.sku2_state === 'ON', 'badge-dead': data.sku2_state === 'DISABLED' }">
            {{ stateLabel }}
          </span>
        </div>

        <template v-if="data.sku2_state === 'OFF'">
          <p class="hint">A second code on every product — e.g. the old system's code already printed on the stickers. Scanning or typing it finds the product. Once on, the only way off is "disable for good".</p>
          <div class="card-actions">
            <BaseButton variant="admin" :loading="savingSku2" @click="turnOnOpen = true">Switch SKU2 on</BaseButton>
          </div>
        </template>

        <template v-else-if="data.sku2_state === 'ON'">
          <p class="hint">{{ data.sku2_count }} products have a SKU2.</p>
          <div class="form-grid">
            <BaseSelect v-model="form.sku2_digits" :options="digitOpts([5, 6, 7, 8])" label="Digits (new SKU2s)" />
            <BaseSelect v-model="form.sku2_mode" :options="modeOpts2" label="New SKU2 numbers" />
          </div>
          <label class="check-row"><input type="checkbox" v-model="form.sku2_auto_new" class="check-input" /> <span>Give every new product a SKU2 automatically</span></label>
          <label class="check-row"><input type="checkbox" v-model="form.sku2_hide_tables" class="check-input" /> <span>Hide SKU2 in tables</span></label>
          <label class="check-row"><input type="checkbox" v-model="form.sku2_hide_search" class="check-input" /> <span>Hide SKU2 in search results (scanning still finds it)</span></label>
          <label class="check-row"><input type="checkbox" v-model="form.sku2_print_label" class="check-input" /> <span>Print SKU2 on price stickers</span></label>
          <div class="card-actions">
            <BaseButton variant="admin" :loading="savingSku2" :disabled="!sku2Dirty" @click="saveSku2()">Save SKU2 options</BaseButton>
          </div>

          <div class="danger-zone">
            <div class="danger-title">Disable for good</div>
            <p class="hint">Vendorya stops making and using SKU2 in this shop. This can never be undone — SKU2 can't be switched on again.</p>
            <div class="danger-actions">
              <BaseButton variant="danger" @click="startDisable(false)">Disable the secondary SKU2 for good</BaseButton>
              <BaseButton variant="danger" @click="startDisable(true)">Disable and delete the secondary SKU2 for good</BaseButton>
            </div>
          </div>
        </template>

        <template v-else>
          <p class="hint">SKU2 was disabled for good and can't be switched on again.
            <span v-if="data.sku2_count">{{ data.sku2_count }} products keep their SKU2 as history.</span>
            <span v-else>No SKU2 history is kept.</span>
          </p>
        </template>
      </BaseCard>
    </div>

    <!-- Switch on — one-way warning -->
    <AppModal :open="turnOnOpen" title="Switch SKU2 on?" width="480px" @close="turnOnOpen = false">
      <p class="modal-text">After this, SKU2 can only be turned off with <strong>"Disable for good"</strong> — and then it can never come back for <strong>{{ data?.store_name }}</strong>.</p>
      <template #footer>
        <BaseButton variant="ghost" @click="turnOnOpen = false">Cancel</BaseButton>
        <BaseButton variant="admin" :loading="savingSku2" @click="turnOn">Switch on</BaseButton>
      </template>
    </AppModal>

    <!-- Password (setup change on a shop that has SKUs, or step 1 of disable) -->
    <AppModal :open="pw.open" :title="pw.title" width="480px" @close="closePw">
      <p class="modal-text">{{ pw.text }}</p>
      <BaseInput v-model="pw.value" type="password" label="Your password" :error="pw.error" @keyup.enter="pwContinue" />
      <template #footer>
        <BaseButton variant="ghost" @click="closePw">Cancel</BaseButton>
        <BaseButton :variant="pw.kind === 'disable' ? 'danger' : 'admin'" :disabled="!pw.value" :loading="pw.busy" @click="pwContinue">Continue</BaseButton>
      </template>
    </AppModal>

    <!-- Disable — the last warning -->
    <AppModal :open="lastWarn.open" title="Last warning" width="480px" @close="lastWarn.open = false">
      <p class="modal-text">
        SKU2 will be disabled <strong>for good</strong> in <strong>{{ data?.store_name }}</strong>.
        <template v-if="lastWarn.wipe"> All {{ data?.sku2_count }} SKU2 codes will be <strong>deleted</strong>.</template>
        <template v-else> The {{ data?.sku2_count }} existing SKU2 codes stay as history only.</template>
        This can't be undone.
      </p>
      <p v-if="lastWarn.error" class="error-text">{{ lastWarn.error }}</p>
      <template #footer>
        <BaseButton variant="ghost" @click="lastWarn.open = false">Cancel</BaseButton>
        <BaseButton variant="danger" :loading="lastWarn.busy" @click="doDisable">I'm sure</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast, showErrorToast } from '@/utils/toast'

const SETUP = ['sku_product_digits', 'sku_supplier_digits', 'sku_shop_code', 'sku_dashes', 'product_numbering_mode']
const SKU2 = ['sku2_digits', 'sku2_mode', 'sku2_auto_new', 'sku2_hide_tables', 'sku2_hide_search', 'sku2_print_label']

const stores = ref([])
const storeId = ref('')
const data = ref(null)
const loading = ref(false)
const form = reactive({})
const savingSetup = ref(false)
const savingSku2 = ref(false)
const turnOnOpen = ref(false)

const storeOptions = computed(() => stores.value.map(s => ({ value: s.id, label: `${s.name}${s.store_code ? ' · ' + s.store_code : ''}` })))
const digitOpts = (list) => list.map(n => ({ value: n, label: `${n} digits` }))
const modeOpts = [{ value: 'PROGRESSIVE', label: 'In sequence' }, { value: 'RANDOM', label: 'Random' }]
const modeOpts2 = [{ value: 'SEQUENCE', label: 'In sequence' }, { value: 'RANDOM', label: 'Random' }]
const stateLabel = computed(() => ({ OFF: 'Off', ON: 'On', DISABLED: 'Disabled for good' }[data.value?.sku2_state]))

const shopCodeError = computed(() => {
  const v = (form.sku_shop_code || '').trim()
  return v && !/^\d{2,3}$/.test(v) ? '2 or 3 digits' : ''
})
const setupDirty = computed(() => data.value && SETUP.some(k => String(form[k] ?? '') !== String(data.value[k] ?? '')))
const sku2Dirty = computed(() => data.value && SKU2.some(k => String(form[k] ?? '') !== String(data.value[k] ?? '')))

// Live preview: product no. 1 at the chosen width + a sample supplier code + the shop code.
const preview = computed(() => {
  if (!data.value) return ''
  const head = '1'.padStart(Number(form.sku_product_digits) || 4, '0')
  const sup = '1'.padEnd(Number(form.sku_supplier_digits) || 3, '0')
  const shop = (form.sku_shop_code || '').trim() || data.value.store_code || '00'
  return form.sku_dashes ? [head, sup, shop].join('-') : head + sup + shop
})

function fill(d) {
  data.value = d
  for (const k of [...SETUP, ...SKU2]) form[k] = d[k]
}

async function load() {
  if (!storeId.value) { data.value = null; return }
  loading.value = true
  try { fill((await api.get(`/api/admin/stores/${storeId.value}/sku/`)).data) }
  catch { showErrorToast('Could not load this shop.') }
  finally { loading.value = false }
}
watch(storeId, load)

async function patch(body, saving) {
  saving.value = true
  try {
    fill((await api.patch(`/api/admin/stores/${storeId.value}/sku/`, body)).data)
    showSuccessToast('Saved')
    return true
  } catch (e) {
    const d = e.response?.data
    if (d?.code === 'password_required') return 'password'
    showErrorToast(d?.detail || Object.values(d || {})?.[0]?.[0] || 'Could not save.')
    return false
  } finally { saving.value = false }
}

function setupBody() { return Object.fromEntries(SETUP.map(k => [k, k === 'sku_shop_code' ? (form[k] || '').trim() : form[k]])) }

async function saveSetup(password) {
  const r = await patch(password ? { ...setupBody(), password } : setupBody(), savingSetup)
  if (r === 'password') {
    if (password) { pw.error = 'Wrong password.'; return }
    openPw('setup', 'Confirm the SKU change',
      `${data.value.store_name} already has ${data.value.skus_count} SKUs. Only NEW SKUs will follow the new setup. Type your password to continue.`)
  } else if (r) closePw()
}
async function saveSku2() { await patch(Object.fromEntries(SKU2.map(k => [k, form[k]])), savingSku2) }
async function turnOn() { if (await patch({ sku2_state: 'ON' }, savingSku2)) turnOnOpen.value = false }

// ── password modal + disable flow ──
const pw = reactive({ open: false, kind: '', title: '', text: '', value: '', error: '', busy: false, wipe: false })
const lastWarn = reactive({ open: false, wipe: false, busy: false, error: '', password: '' })

function openPw(kind, title, text) { Object.assign(pw, { open: true, kind, title, text, value: '', error: '', busy: false }) }
function closePw() { pw.open = false; pw.value = '' }

function startDisable(wipe) {
  pw.wipe = wipe
  openPw('disable', wipe ? 'Disable and delete SKU2 for good' : 'Disable SKU2 for good',
    'Type your password again to continue.')
}

async function pwContinue() {
  if (!pw.value) return
  if (pw.kind === 'setup') { pw.busy = true; await saveSetup(pw.value); pw.busy = false; return }
  Object.assign(lastWarn, { open: true, wipe: pw.wipe, password: pw.value, error: '', busy: false })
  closePw()
}

async function doDisable() {
  lastWarn.busy = true
  lastWarn.error = ''
  try {
    const { data: d } = await api.post(`/api/admin/stores/${storeId.value}/sku2/disable/`,
      { password: lastWarn.password, delete_history: lastWarn.wipe })
    fill(d)
    lastWarn.open = false
    showSuccessToast('SKU2 disabled for good')
  } catch (e) {
    lastWarn.error = e.response?.data?.detail || 'Could not disable.'
  } finally { lastWarn.busy = false; lastWarn.password = '' }
}

onMounted(async () => {
  try {
    const res = await api.get('/api/admin/stores/')
    stores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { stores.value = [] }
})
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.store-pick { max-width: 420px; margin-bottom: 20px; }
.muted { color: var(--text-muted); font-size: 13px; }
.sku-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; align-items: start; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.card-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; }
.hint { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.check-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); margin: 8px 0; cursor: pointer; }
.check-input { accent-color: var(--admin-accent, var(--danger)); width: 16px; height: 16px; }
.preview { display: flex; align-items: center; gap: 12px; margin: 16px 0 4px; padding: 12px 14px; border: 1px dashed var(--border); border-radius: 10px; background: var(--bg-app); flex-wrap: wrap; }
.preview-label { font-size: 12px; color: var(--text-muted); }
.preview-code { font-family: monospace; font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: .04em; }
.card-actions { display: flex; justify-content: flex-end; margin-top: 16px; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.badge-ok   { background: var(--success-soft); color: var(--success); }
.badge-warn { background: var(--warning-soft); color: var(--warning-hover); }
.badge-off  { background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border); }
.badge-dead { background: var(--danger-soft); color: var(--danger); }
.danger-zone { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--border); }
.danger-title { font-size: 13px; font-weight: 700; color: var(--danger); margin-bottom: 6px; }
.danger-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.modal-text { font-size: 13px; color: var(--text-secondary); margin: 0 0 14px; line-height: 1.55; }
.error-text { font-size: 12px; color: var(--danger); margin-top: 10px; }
@media (max-width: 640px) {
  .sku-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
