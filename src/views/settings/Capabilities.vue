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
          <!-- Default tier names, used to seed new products. Biggest→smallest:
               Pack = unit_tier_names[1], Strip = unit_tier_names[0], Unit = base_unit_name. -->
          <template v-if="form.multi_unit_enabled">
            <div class="sub-block">
              <div class="sub-label">{{ t('settings.capabilities.tier_names_label') }}</div>
              <div class="tier-names-row">
                <label class="tier-field">
                  <span class="tier-cap">{{ t('settings.capabilities.tier_pack') }}</span>
                  <input v-model="form.unit_tier_names[1]" type="text" maxlength="20" class="num-input tier-input"
                    :placeholder="t('settings.capabilities.tier2_ph')" />
                </label>
                <label class="tier-field">
                  <span class="tier-cap">{{ t('settings.capabilities.tier_strip') }}</span>
                  <input v-model="form.unit_tier_names[0]" type="text" maxlength="20" class="num-input tier-input"
                    :placeholder="t('settings.capabilities.tier1_ph')" />
                </label>
                <label class="tier-field">
                  <span class="tier-cap">{{ t('settings.capabilities.tier_unit') }}</span>
                  <input v-model="form.base_unit_name" type="text" maxlength="20" class="num-input tier-input"
                    :placeholder="t('settings.capabilities.tier_unit_ph')" />
                </label>
              </div>
              <div class="sub-muted">{{ t('settings.capabilities.tier_names_hint') }}</div>
            </div>

            <!-- Respect Memory Base packaging -->
            <div class="sub-block">
              <label class="check-row">
                <input type="checkbox" v-model="form.pos_respect_mb_units" class="check-input" />
                <span class="check-label">{{ t('settings.capabilities.respect_mb_label') }}</span>
              </label>
              <div class="sub-muted" style="margin-top:4px;">{{ t('settings.capabilities.respect_mb_hint') }}</div>
            </div>

            <!-- Store-wide tier count -->
            <div class="sub-block">
              <div class="sub-label">{{ t('settings.capabilities.tier_count_label') }}</div>
              <div class="mode-row" style="margin-top:6px;">
                <button class="mode-btn" :class="{ active: form.pos_tier_count === 3 }"
                  @click="form.pos_tier_count = 3">{{ t('settings.capabilities.tier_count_3') }}</button>
                <button class="mode-btn" :class="{ active: form.pos_tier_count === 2 }"
                  @click="form.pos_tier_count = 2">{{ t('settings.capabilities.tier_count_2') }}</button>
              </div>
              <div class="sub-muted" style="margin-top:8px;">{{ t('settings.capabilities.tier_count_hint') }}</div>
              <div class="sub-muted tier-count-override">{{ t('settings.capabilities.tier_count_override') }}</div>
            </div>
          </template>
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
          <!-- Default weight unit (§WT) — display only; stock stays kg to the gram -->
          <template v-if="form.weight_selling_enabled">
            <div class="sub-block">
              <div class="sub-label">{{ t('settings.capabilities.weight_unit_label') }}</div>
              <div class="mode-row">
                <button v-for="opt in weightUnitOptions" :key="opt.value"
                  class="mode-btn" :class="{ active: form.default_weight_unit === opt.value }"
                  @click="form.default_weight_unit = opt.value"
                >{{ opt.label }}</button>
              </div>
              <div class="sub-muted unit-hint">{{ t('settings.capabilities.weight_unit_hint', { example: weightUnitExample }) }}</div>
            </div>
          </template>
        </div>
      </div>

      <!-- Treasury (money boxes) — s169c. Off = today's Vendorya exactly; on = the server makes one drawer box per branch. -->
      <div class="cap-card">
        <div class="cap-icon" style="background:var(--info-soft);color:var(--info);"><Vault :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.treasury_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='treasury' }" @click="toggleInfo('treasury')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.treasury_desc') }}</div>
          <div v-if="openInfo==='treasury'" class="info-box">
            <p class="info-p">{{ t('settings.capabilities.treasury_info_on') }}</p>
            <p class="info-p">{{ t('settings.capabilities.treasury_info_off') }}</p>
            <p class="info-p">{{ t('settings.capabilities.treasury_info_start') }}</p>
          </div>
          <div class="cap-footer">
            <span class="cap-status" :class="form.treasury_enabled ? 'status-on' : 'status-off'">
              {{ form.treasury_enabled ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.treasury_enabled }" @click="requestToggle('treasury_enabled', true)">
              <span class="toggle-knob" />
            </button>
          </div>
          <div v-if="form.treasury_enabled && !treasuryWasOn" class="sub-block">
            <div class="sub-muted">{{ t('settings.capabilities.treasury_on_note') }}</div>
          </div>
        </div>
      </div>

      <!-- Owner level (Treasury Wave 2, s170) — a SECOND switch that rides on the Treasury: other businesses + personal
           money, seen only by the owner. Disabled while the Treasury is off (the server answers `treasury_off`). -->
      <div class="cap-card" :class="{ 'cap-card--off': !form.treasury_enabled }">
        <div class="cap-icon" style="background:var(--accent-soft);color:var(--accent);"><PiggyBank :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.owner_level_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='owner_level' }" @click="toggleInfo('owner_level')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.owner_level_desc') }}</div>
          <div v-if="openInfo==='owner_level'" class="info-box">
            <p class="info-p">{{ t('settings.capabilities.owner_level_info_on') }}</p>
            <p class="info-p">{{ t('settings.capabilities.owner_level_info_private') }}</p>
            <p class="info-p">{{ t('settings.capabilities.owner_level_info_off') }}</p>
          </div>
          <div class="cap-footer">
            <span class="cap-status" :class="form.treasury_enabled && form.treasury_owner_level ? 'status-on' : 'status-off'">
              {{ form.treasury_enabled && form.treasury_owner_level ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.treasury_enabled && form.treasury_owner_level }" :disabled="!form.treasury_enabled"
                    :title="!form.treasury_enabled ? t('settings.capabilities.owner_level_needs_treasury') : ''"
                    @click="requestToggle('treasury_owner_level', true)">
              <span class="toggle-knob" />
            </button>
          </div>
          <div v-if="!form.treasury_enabled" class="sub-block">
            <div class="sub-muted">{{ t('settings.capabilities.owner_level_needs_treasury') }}</div>
          </div>
          <div v-else-if="form.treasury_owner_level && !ownerLevelWasOn" class="sub-block">
            <div class="sub-muted">{{ t('settings.capabilities.owner_level_on_note') }}</div>
          </div>
        </div>
      </div>

      <!-- Reservations with a deposit — s172 (RESERVATIONS.md). Off = no menu, no NEW reservation; open ones stay reachable. -->
      <div class="cap-card">
        <div class="cap-icon" style="background:var(--accent-soft);color:var(--accent);"><BookmarkCheck :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.reservations_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='reservations' }" @click="toggleInfo('reservations')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.reservations_desc') }}</div>
          <div v-if="openInfo==='reservations'" class="info-box">
            <p class="info-p">{{ t('settings.capabilities.reservations_info_on') }}</p>
            <p class="info-p">{{ t('settings.capabilities.reservations_info_off') }}</p>
          </div>
          <div class="cap-footer">
            <span class="cap-status" :class="form.reservations_enabled ? 'status-on' : 'status-off'">
              {{ form.reservations_enabled ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.reservations_enabled }" @click="requestToggle('reservations_enabled', false)">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <!-- Payment due dates — s173 (PAYMENT-DUES.md). Off = no menu, no NEW due date, no reminders; written ones are kept. -->
      <div class="cap-card">
        <div class="cap-icon" style="background:var(--accent-soft);color:var(--accent);"><CalendarClock :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.dues_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='dues' }" @click="toggleInfo('dues')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.dues_desc') }}</div>
          <div v-if="openInfo==='dues'" class="info-box">
            <p class="info-p">{{ t('settings.capabilities.dues_info_on') }}</p>
            <p class="info-p">{{ t('settings.capabilities.dues_info_off') }}</p>
          </div>
          <div class="cap-footer">
            <span class="cap-status" :class="form.payment_dues_enabled ? 'status-on' : 'status-off'">
              {{ form.payment_dues_enabled ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.payment_dues_enabled }" @click="requestToggle('payment_dues_enabled', false)">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <!-- Search & Autocomplete -->
      <div class="cap-card">
        <div class="cap-icon" style="background:#ede9fe;color:#7c3aed;"><Search :size="20" /></div>
        <div class="cap-body">
          <div class="cap-head">
            <span class="cap-title">{{ t('settings.capabilities.search_title') }}</span>
            <button class="info-btn" :class="{ on: openInfo==='search' }" @click="toggleInfo('search')" :aria-label="t('common.help')"><HelpCircle :size="15" /></button>
          </div>
          <div class="cap-desc">{{ t('settings.capabilities.search_desc') }}</div>
          <div v-if="openInfo==='search'" class="info-box">{{ t('settings.capabilities.search_info') }}</div>

          <!-- Source toggle -->
          <div class="sub-block" style="border-top:none;margin-top:0;padding-top:0;">
            <div class="sub-label">{{ t('settings.capabilities.ac_source_label') }}</div>
            <div class="mode-row" style="margin-top:6px;">
              <button class="mode-btn" :class="{ active: form.autocomplete_source === 'memory_base' }"
                @click="form.autocomplete_source = 'memory_base'">
                {{ t('settings.capabilities.ac_source_mb') }}
              </button>
              <button class="mode-btn" :class="{ active: form.autocomplete_source === 'store_history' }"
                @click="form.autocomplete_source = 'store_history'">
                {{ t('settings.capabilities.ac_source_store') }}
              </button>
            </div>
            <div class="sub-muted" style="margin-top:8px;">
              {{ t(`settings.capabilities.ac_source_hint_${form.autocomplete_source}`) }}
            </div>
          </div>

          <!-- Auto-register checkbox -->
          <div class="sub-block">
            <label class="check-row">
              <input type="checkbox" v-model="form.mb_auto_register" class="check-input" />
              <span class="check-label">{{ t('settings.capabilities.mb_auto_label') }}</span>
            </label>
            <div class="sub-muted" style="margin-top:4px;">{{ t('settings.capabilities.mb_auto_hint') }}</div>
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
import { ArrowDownUp, CalendarClock, Scale, CheckCircle, HelpCircle, AlertTriangle, Building2, Search, Vault, PiggyBank, BookmarkCheck
} from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import api from '@/api/axios'
import { useFormatStore } from '@/stores/format'
import { formatWeight } from '@/utils/format'
import { showErrorToast } from '@/utils/toast'
import { treasuryError } from '@/utils/treasury'

const { t } = useI18n()
const fmt = useFormatStore()

const loading   = ref(false)
const saving    = ref(false)
const saved     = ref(false)
const openInfo  = ref(null)
const storeType = ref('GENERAL')

const form = reactive({
  multi_unit_enabled:      true,
  unit_tier_names:         ['Strip', 'Pack'],
  base_unit_name:          'Unit',
  pos_respect_mb_units:    true,
  pos_tier_count:          3,
  expiry_tracking_enabled: false,
  expired_sale_policy:     'WARN',
  expiry_alert_days:       60,
  weight_selling_enabled:  false,
  default_weight_unit:     'KG',
  autocomplete_source:     'memory_base',
  mb_auto_register:        true,
  treasury_enabled:        false,
  treasury_owner_level:    false,
  reservations_enabled:    false,
  payment_dues_enabled:    false,
})
// What the server had when the page loaded — the "boxes are made when you save" note shows only on a fresh switch-on.
const treasuryWasOn = ref(false)
const ownerLevelWasOn = ref(false)

// Switch → translation key for its store-type label
const storeTypeLabel = computed(() => t(`settings.capabilities.types.${storeType.value}`))

const weightUnitOptions = computed(() => [
  { value: 'KG', label: t('settings.capabilities.weight_unit_kg') },
  { value: 'G',  label: t('settings.capabilities.weight_unit_g') },
])
// Live example of the choice: a 250 g sale as it will read on stock, POS and receipts.
const weightUnitExample = computed(() => formatWeight(0.25, form.default_weight_unit))

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
      unit_tier_names:         settingsRes.data.unit_tier_names || ['Strip', 'Pack'],
      base_unit_name:          settingsRes.data.base_unit_name || 'Unit',
      pos_respect_mb_units:    settingsRes.data.pos_respect_mb_units ?? true,
      pos_tier_count:          settingsRes.data.pos_tier_count ?? 3,
      expiry_tracking_enabled: settingsRes.data.expiry_tracking_enabled ?? false,
      expired_sale_policy:     settingsRes.data.expired_sale_policy || 'WARN',
      expiry_alert_days:       settingsRes.data.expiry_alert_days ?? 60,
      weight_selling_enabled:  settingsRes.data.weight_selling_enabled ?? false,
      default_weight_unit:     settingsRes.data.default_weight_unit === 'G' ? 'G' : 'KG',
      autocomplete_source:     settingsRes.data.autocomplete_source || 'memory_base',
      mb_auto_register:        settingsRes.data.mb_auto_register ?? true,
      treasury_enabled:        !!settingsRes.data.treasury_enabled,
      treasury_owner_level:    !!settingsRes.data.treasury_owner_level,
      reservations_enabled:    !!settingsRes.data.reservations_enabled,
      payment_dues_enabled:    !!settingsRes.data.payment_dues_enabled,
    })
    treasuryWasOn.value = !!settingsRes.data.treasury_enabled
    ownerLevelWasOn.value = !!settingsRes.data.treasury_owner_level
  } finally { loading.value = false }
}

// "My money" shows only when this login IS the owner (settings `treasury_is_owner`). Take it from the save answer when
// the server sends it there, else read the settings once more (turning the owner level on makes the personal part).
async function refreshIsOwner(data) {
  if (data && data.treasury_is_owner !== undefined) { fmt.apply({ treasury_is_owner: data.treasury_is_owner }); return }
  try {
    const r = await api.get('/api/core/settings/')
    fmt.apply({ treasury_owner_level: !!r.data?.treasury_owner_level, treasury_is_owner: !!r.data?.treasury_is_owner })
  } catch { /* keep what we have */ }
}

async function save() {
  saving.value = true
  saved.value  = false
  let res = null
  try {
    res = await api.patch('/api/core/settings/', {
      multi_unit_enabled:      form.multi_unit_enabled,
      unit_tier_names:         form.unit_tier_names,
      base_unit_name:          form.base_unit_name || 'Unit',
      pos_respect_mb_units:    form.pos_respect_mb_units,
      pos_tier_count:          form.pos_tier_count,
      expiry_tracking_enabled: form.expiry_tracking_enabled,
      expired_sale_policy:     form.expired_sale_policy,
      expiry_alert_days:       form.expiry_alert_days || 60,
      weight_selling_enabled:  form.weight_selling_enabled,
      default_weight_unit:     form.default_weight_unit,
      autocomplete_source:     form.autocomplete_source,
      mb_auto_register:        form.mb_auto_register,
      treasury_enabled:        form.treasury_enabled,
      treasury_owner_level:    form.treasury_owner_level,
      reservations_enabled:    form.reservations_enabled,
      payment_dues_enabled:    form.payment_dues_enabled,
    })
    fmt.apply({ default_weight_unit: form.default_weight_unit, treasury_enabled: form.treasury_enabled, treasury_owner_level: form.treasury_owner_level,
                reservations_enabled: form.reservations_enabled, payment_dues_enabled: form.payment_dues_enabled })
    treasuryWasOn.value = form.treasury_enabled
    ownerLevelWasOn.value = form.treasury_owner_level
    refreshIsOwner(res?.data)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    const data = e.response?.data
    // Nothing was saved — put both Treasury switches back to what the server still has (e.g. `shifts_open`, `treasury_off`).
    form.treasury_enabled = treasuryWasOn.value
    form.treasury_owner_level = ownerLevelWasOn.value
    if (data?.code === 'treasury_off') showErrorToast(t('settings.capabilities.owner_level_needs_treasury'), 4000)
    else if (data?.code) showErrorToast(treasuryError(t, e, t('settings.policies.err_save')), 4000)
    else alert(data ? (typeof data === 'string' ? data : JSON.stringify(data)) : t('settings.policies.err_save'))
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
.info-p { margin:0 0 6px; }
.info-p:last-child { margin-bottom:0; }
.info-box { font-size:12.5px; line-height:1.55; color:var(--text-primary); background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:10px 12px; margin-bottom:14px; }

.affect-flag { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:#b91c1c; background:#fee2e2; border-radius:999px; padding:2px 8px; }
.soon-flag { font-size:11px; font-weight:600; color:#6b7280; background:#f3f4f6; border-radius:999px; padding:2px 8px; }

.cap-footer { display:flex; align-items:center; justify-content:space-between; }
.cap-status { font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px; }
.status-on  { background:var(--success-soft); color:#166534; }
.status-off { background:#f3f4f6; color:#6b7280; }

.toggle-btn  { width:44px; height:24px; border-radius:12px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--accent); }
.toggle-btn:disabled { cursor:not-allowed; opacity:.5; }
.cap-card--off .cap-desc { opacity:.75; }
.toggle-knob { position:absolute; width:18px; height:18px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:23px; }

.sub-block { border-top:1px solid var(--border); margin-top:14px; padding-top:14px; }
.sub-label { font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:8px; }
.mode-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.days-row { display:flex; align-items:center; gap:8px; margin-top:14px; }
.tier-names-row { display:flex; gap:12px; margin:10px 0 6px; flex-wrap:wrap; }
.tier-field { display:flex; flex-direction:column; gap:5px; }
.tier-cap { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); }
.tier-input { width:150px; }
.tier-count-override { color:var(--danger); margin-top:4px; }
.sub-muted { font-size:12px; color:var(--text-muted); }
.unit-hint { margin-top:8px; }
.num-input { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 120ms; }
.num-input:focus { border-color:var(--accent); }
.mode-btn { padding:6px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:12.5px; font-weight:600; cursor:pointer; transition:background 100ms,border-color 100ms,color 100ms; }
.mode-btn:hover { border-color:var(--accent); color:var(--accent); }
.mode-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }

.check-row   { display:flex; align-items:center; gap:8px; cursor:pointer; }
.check-input { width:16px; height:16px; accent-color:var(--accent); cursor:pointer; flex-shrink:0; }
.check-label { font-size:13px; font-weight:600; color:var(--text-primary); }

.save-bar { display:flex; align-items:center; gap:12px; margin-top:24px; }
.save-confirm { display:inline-flex; align-items:center; gap:5px; font-size:13px; color:var(--success); font-weight:500; }

.confirm-text { font-size:14px; color:var(--text-primary); line-height:1.55; margin:0 0 10px; }
.confirm-note { font-size:12.5px; color:var(--text-muted); line-height:1.5; margin:0; }
.btn-ghost { padding:8px 16px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:13px; font-weight:600; cursor:pointer; }
.btn-ghost:hover { color:var(--text-primary); }
.btn-danger { padding:8px 16px; border-radius:8px; border:none; background:#dc2626; color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-danger:hover { background:#b91c1c; }
</style>
