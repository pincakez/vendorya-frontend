<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.capabilities.title') }}</h1>
        <p class="page-sub">{{ t('settings.capabilities.sub') }}</p>
      </div>
    </div>

    <div v-if="loading" class="skeleton-card" />
    <div v-else class="cap-grid">

      <!-- Store type (read-only) -->
      <div class="type-banner">
        <div class="type-icon"><Building2 :size="18" /></div>
        <div>
          <div class="type-label">{{ t('settings.capabilities.store_type') }}</div>
          <div class="type-value">{{ storeTypeLabel }}</div>
        </div>
        <div class="type-hint">{{ t('settings.capabilities.store_type_hint') }}</div>
      </div>

      <!-- Multi-Unit Selling -->
      <div class="cap-card">
        <div class="cap-icon" style="background:var(--accent-soft);color:var(--accent);"><ArrowDownUp :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.multi_unit_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='multi_unit' }" @click="toggleInfo('multi_unit')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
            <span class="affect-flag"><AlertTriangle :size="12" /> {{ t('settings.capabilities.affects_data') }}</span>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.multi_unit_desc') }}</div>
          <div v-if="openInfo==='multi_unit'" class="info-box">{{ t('settings.capabilities.multi_unit_info') }}</div>
          <div class="cap-footer">
            <span class="cap-status" :class="form.multi_unit_enabled ? 'status-on' : 'status-off'">
              {{ form.multi_unit_enabled ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.multi_unit_enabled }" @click="requestToggle('multi_unit_enabled', true)">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <!-- Expiry / Batch Tracking -->
      <div class="cap-card">
        <div class="cap-icon" style="background:#fef3c7;color:#d97706;"><CalendarClock :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.expiry_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='expiry' }" @click="toggleInfo('expiry')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
            <span class="affect-flag"><AlertTriangle :size="12" /> {{ t('settings.capabilities.affects_data') }}</span>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.expiry_desc') }}</div>
          <div v-if="openInfo==='expiry'" class="info-box">{{ t('settings.capabilities.expiry_info') }}</div>
          <div class="cap-footer">
            <span class="cap-status" :class="form.expiry_tracking_enabled ? 'status-on' : 'status-off'">
              {{ form.expiry_tracking_enabled ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.expiry_tracking_enabled }" @click="requestToggle('expiry_tracking_enabled', true)">
              <span class="toggle-knob" />
            </button>
          </div>
          <!-- Sub-options only when tracking is on -->
          <template v-if="form.expiry_tracking_enabled">
            <div class="sub-block">
              <div class="sub-label">{{ t('settings.policies.expiry_sale_policy') }}</div>
              <div class="mode-row">
                <button v-for="opt in expiredPolicyOptions" :key="opt.value"
                  class="mode-btn" :class="{ active: form.expired_sale_policy === opt.value }"
                  @click="form.expired_sale_policy = opt.value"
                >{{ opt.label }}</button>
              </div>
              <div class="days-row">
                <span class="sub-muted">{{ t('settings.policies.expiry_alert_days') }}</span>
                <input v-model.number="form.expiry_alert_days" type="number" min="1" max="365" step="1" class="num-input" style="width:90px;" />
                <span class="sub-muted">{{ t('settings.policies.days') }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Weight-Based Selling -->
      <div class="cap-card">
        <div class="cap-icon" style="background:#dcfce7;color:#16a34a;"><Scale :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.weight_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='weight' }" @click="toggleInfo('weight')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.weight_desc') }}</div>
          <div v-if="openInfo==='weight'" class="info-box">{{ t('settings.capabilities.weight_info') }}</div>
          <div class="cap-footer">
            <span class="cap-status" :class="form.weight_selling_enabled ? 'status-on' : 'status-off'">
              {{ form.weight_selling_enabled ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.weight_selling_enabled }" @click="form.weight_selling_enabled = !form.weight_selling_enabled">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

    </div>

    <div class="save-bar">
      <button class="btn-primary" :disabled="saving" @click="save">
        {{ saving ? t('common.saving') : t('settings.policies.save_btn') }}
      </button>
      <span v-if="saved" class="save-confirm"><CheckCircle :size="14" /> {{ t('settings.policies.saved') }}</span>
    </div>

    <!-- Confirmation gate when turning OFF a data-affecting switch -->
    <AppModal :open="confirm.open" :title="t('settings.capabilities.confirm_title')" width="440px" @close="cancelToggle">
      <p class="confirm-text">{{ confirm.message }}</p>
      <p class="confirm-note">{{ t('settings.capabilities.confirm_note') }}</p>
      <template #footer>
        <button class="btn-ghost" @click="cancelToggle">{{ t('common.cancel') }}</button>
        <button class="btn-danger" @click="applyToggle">{{ t('settings.capabilities.confirm_disable') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDownUp, CalendarClock, Scale, CheckCircle, HelpCircle, AlertTriangle, Building2 } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import api from '@/api/axios'

const { t } = useI18n()

const loading   = ref(false)
const saving    = ref(false)
const saved     = ref(false)
const openInfo  = ref(null)
const storeType = ref('GENERAL')

const form = reactive({
  multi_unit_enabled:      true,
  expiry_tracking_enabled: false,
  expired_sale_policy:     'WARN',
  expiry_alert_days:       60,
  weight_selling_enabled:  false,
})

// Switch → translation key for its store-type label
const storeTypeLabel = computed(() => t(`settings.capabilities.types.${storeType.value}`))

const expiredPolicyOptions = computed(() => [
  { value: 'ALLOW', label: t('settings.policies.exp_allow') },
  { value: 'WARN',  label: t('settings.policies.exp_warn') },
  { value: 'BLOCK', label: t('settings.policies.exp_block') },
])

function toggleInfo(key) { openInfo.value = openInfo.value === key ? null : key }

// --- Confirmation gate for data-affecting switches -------------------------
const confirm = reactive({ open: false, field: null, message: '' })

// `dataAffecting` = turning it OFF hides/stops existing data (never deletes).
function requestToggle(field, dataAffecting) {
  const turningOff = form[field] === true
  if (dataAffecting && turningOff) {
    confirm.field = field
    confirm.message = t(`settings.capabilities.confirm_${field}`)
    confirm.open = true
    return
  }
  form[field] = !form[field]
}
function applyToggle() {
  if (confirm.field) form[confirm.field] = false
  cancelToggle()
}
function cancelToggle() { confirm.open = false; confirm.field = null; confirm.message = '' }

async function load() {
  loading.value = true
  try {
    const [storeRes, settingsRes] = await Promise.all([
      api.get('/api/core/store/'),
      api.get('/api/core/settings/'),
    ])
    storeType.value = storeRes.data.store_type || 'GENERAL'
    Object.assign(form, {
      multi_unit_enabled:      settingsRes.data.multi_unit_enabled ?? true,
      expiry_tracking_enabled: settingsRes.data.expiry_tracking_enabled ?? false,
      expired_sale_policy:     settingsRes.data.expired_sale_policy || 'WARN',
      expiry_alert_days:       settingsRes.data.expiry_alert_days ?? 60,
      weight_selling_enabled:  settingsRes.data.weight_selling_enabled ?? false,
    })
  } finally { loading.value = false }
}

async function save() {
  saving.value = true
  saved.value  = false
  try {
    await api.patch('/api/core/settings/', {
      multi_unit_enabled:      form.multi_unit_enabled,
      expiry_tracking_enabled: form.expiry_tracking_enabled,
      expired_sale_policy:     form.expired_sale_policy,
      expiry_alert_days:       form.expiry_alert_days || 60,
      weight_selling_enabled:  form.weight_selling_enabled,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    const data = e.response?.data
    alert(data ? (typeof data === 'string' ? data : JSON.stringify(data)) : t('settings.policies.err_save'))
  } finally { saving.value = false }
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
.skeleton-card { height:300px; border-radius:12px; background:var(--border); animation:shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

.cap-grid { display:flex; flex-direction:column; gap:14px; }

.type-banner { display:flex; align-items:center; gap:14px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 20px; }
.type-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--accent-soft); color:var(--accent); flex-shrink:0; }
.type-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
.type-value { font-size:15px; font-weight:700; color:var(--text-primary); }
.type-hint { margin-left:auto; font-size:12px; color:var(--text-muted); max-width:340px; text-align:right; line-height:1.45; }

.cap-card { display:flex; gap:16px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px; transition:box-shadow 120ms; }
.cap-card:hover { box-shadow:0 2px 12px rgba(0,0,0,.07); }
.cap-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cap-body { flex:1; min-width:0; }
.cap-head { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
.cap-title { font-size:14px; font-weight:700; color:var(--text-primary); }
.cap-desc  { font-size:13px; color:var(--text-muted); line-height:1.5; margin-bottom:14px; }

.info-btn { width:22px; height:22px; border-radius:50%; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0; transition:all 120ms; }
.info-btn:hover, .info-btn.on { border-color:var(--accent); color:var(--accent); }
.info-box { font-size:12.5px; line-height:1.55; color:var(--text-primary); background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:10px 12px; margin-bottom:14px; }

.affect-flag { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:#b91c1c; background:#fee2e2; border-radius:999px; padding:2px 8px; }
.soon-flag { font-size:11px; font-weight:600; color:#6b7280; background:#f3f4f6; border-radius:999px; padding:2px 8px; }

.cap-footer { display:flex; align-items:center; justify-content:space-between; }
.cap-status { font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px; }
.status-on  { background:var(--success-soft); color:#166534; }
.status-off { background:#f3f4f6; color:#6b7280; }

.toggle-btn  { width:44px; height:24px; border-radius:12px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--accent); }
.toggle-knob { position:absolute; width:18px; height:18px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:23px; }

.sub-block { border-top:1px solid var(--border); margin-top:14px; padding-top:14px; }
.sub-label { font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:8px; }
.mode-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.days-row { display:flex; align-items:center; gap:8px; margin-top:14px; }
.sub-muted { font-size:12px; color:var(--text-muted); }
.num-input { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 120ms; }
.num-input:focus { border-color:var(--accent); }
.mode-btn { padding:6px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:12.5px; font-weight:600; cursor:pointer; transition:background 100ms,border-color 100ms,color 100ms; }
.mode-btn:hover { border-color:var(--accent); color:var(--accent); }
.mode-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }

.save-bar { display:flex; align-items:center; gap:12px; margin-top:24px; }
.save-confirm { display:inline-flex; align-items:center; gap:5px; font-size:13px; color:var(--success); font-weight:500; }

.confirm-text { font-size:14px; color:var(--text-primary); line-height:1.55; margin:0 0 10px; }
.confirm-note { font-size:12.5px; color:var(--text-muted); line-height:1.5; margin:0; }
.btn-ghost { padding:8px 16px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:13px; font-weight:600; cursor:pointer; }
.btn-ghost:hover { color:var(--text-primary); }
.btn-danger { padding:8px 16px; border-radius:8px; border:none; background:#dc2626; color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-danger:hover { background:#b91c1c; }
</style>
