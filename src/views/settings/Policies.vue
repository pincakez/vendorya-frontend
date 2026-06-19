<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.policies.title') }}</h1>
        <p class="page-sub">{{ t('settings.policies.sub') }}</p>
      </div>
    </div>

    <div v-if="loading" class="skeleton-card" />
    <div v-else class="policies-grid">

      <!-- Stock Policy -->
      <div class="policy-card">
        <div class="policy-icon" style="background:var(--accent-soft);color:var(--accent);"><Package :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.neg_stock_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.neg_stock_desc') }}</div>
          <div class="policy-footer">
            <span class="policy-status" :class="form.allow_negative_stock ? 'status-on' : 'status-off'">
              {{ form.allow_negative_stock ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.allow_negative_stock }" @click="toggle('allow_negative_stock')">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <!-- Expiry / Batch Tracking -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#fef3c7;color:#d97706;"><CalendarClock :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.expiry_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.expiry_desc') }}</div>
          <div class="policy-footer">
            <span class="policy-status" :class="form.expiry_tracking_enabled ? 'status-on' : 'status-off'">
              {{ form.expiry_tracking_enabled ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.expiry_tracking_enabled }" @click="toggle('expiry_tracking_enabled')">
              <span class="toggle-knob" />
            </button>
          </div>
          <!-- Sub-options only when tracking is on -->
          <template v-if="form.expiry_tracking_enabled">
            <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:14px;">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">{{ t('settings.policies.expiry_sale_policy') }}</div>
              <div class="policy-footer" style="gap:8px;flex-wrap:wrap;justify-content:flex-start;">
                <button v-for="opt in expiredPolicyOptions" :key="opt.value"
                  class="mode-btn" :class="{ active: form.expired_sale_policy === opt.value }"
                  @click="form.expired_sale_policy = opt.value"
                >{{ opt.label }}</button>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:14px;">
                <span style="font-size:13px;color:var(--text-muted);">{{ t('settings.policies.expiry_alert_days') }}</span>
                <input v-model.number="form.expiry_alert_days" type="number" min="1" max="365" step="1" class="num-input" style="width:90px;" />
                <span style="font-size:12px;color:var(--text-muted);">{{ t('settings.policies.days') }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Credit Policy -->
      <div class="policy-card">
        <div class="policy-icon" style="background:var(--success-soft);color:var(--success);"><CreditCard :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.agel_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.agel_desc') }}</div>
          <div class="policy-footer">
            <span class="policy-status" :class="form.enable_agel_selling ? 'status-on' : 'status-off'">
              {{ form.enable_agel_selling ? t('settings.policies.enabled') : t('settings.policies.disabled') }}
            </span>
            <button class="toggle-btn" :class="{ on: form.enable_agel_selling }" @click="toggle('enable_agel_selling')">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <!-- Credit Limit Policy -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#ede9fe;color:#7c3aed;"><AlertCircle :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.credit_limit_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.credit_limit_desc') }}</div>
          <div class="policy-footer" style="gap:8px;flex-wrap:wrap;">
            <button v-for="opt in creditPolicyOptions" :key="opt.value"
              class="mode-btn" :class="{ active: form.credit_policy === opt.value }"
              @click="form.credit_policy = opt.value"
            >{{ opt.label }}</button>
            <template v-if="form.credit_policy !== 'ALLOW'">
              <span style="margin-left:8px;font-size:13px;color:var(--text-muted);">{{ t('settings.policies.default_limit') }}</span>
              <input v-model.number="form.default_credit_limit" type="number" min="0" step="100" class="num-input" placeholder="e.g. 5000" />
              <span style="font-size:12px;color:var(--text-muted);">{{ t('settings.policies.per_customer') }}</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Default Tax -->
      <div class="policy-card">
        <div class="policy-icon" style="background:var(--warning-soft);color:var(--warning);"><Percent :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.default_tax_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.default_tax_desc') }}</div>
          <div class="policy-footer" style="gap:12px;">
            <select v-model="form.default_tax" class="tax-select">
              <option value="">{{ t('settings.policies.none_exempt') }}</option>
              <option v-for="tx in taxes" :key="tx.id" :value="tx.id">{{ tx.name }} — {{ tx.rate }}%</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Product Numbering Mode -->
      <div class="policy-card">
        <div class="policy-icon" style="background:var(--success-soft);color:var(--success);"><Hash :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.numbering_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.numbering_desc') }}</div>
          <div class="policy-footer" style="gap:8px;">
            <button
              class="mode-btn"
              :class="{ active: form.product_numbering_mode === 'PROGRESSIVE' }"
              @click="form.product_numbering_mode = 'PROGRESSIVE'"
            >
              {{ t('settings.policies.progressive') }}
            </button>
            <button
              class="mode-btn"
              :class="{ active: form.product_numbering_mode === 'RANDOM' }"
              @click="form.product_numbering_mode = 'RANDOM'"
            >
              {{ t('settings.policies.random') }}
            </button>
            <span style="font-size:12px;color:var(--text-muted);margin-left:4px;">
              {{ form.product_numbering_mode === 'PROGRESSIVE' ? '0001, 0002, 0003…' : t('settings.policies.random_slot') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Section: Security -->
      <div class="section-heading">{{ t('settings.policies.security') }}</div>

      <!-- Note: 2FA is opt-in per user (Settings › Profile › Two-Factor Authentication). -->

      <!-- Session Timeout -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#e0e7ff;color:#4f46e5;"><Clock :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.session_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.session_desc') }}</div>
          <div class="policy-footer" style="gap:12px;">
            <input v-model.number="form.session_timeout_minutes" type="number" min="0" max="1440" class="num-input" />
            <span style="font-size:13px;color:var(--text-muted);">{{ t('settings.policies.minutes') }}</span>
          </div>
        </div>
      </div>

      <!-- IP Allowlist -->
      <div class="policy-card">
        <div class="policy-icon" style="background:var(--success-soft);color:var(--success);"><Globe :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">{{ t('settings.policies.ip_title') }}</div>
          <div class="policy-desc">{{ t('settings.policies.ip_desc') }}</div>
          <textarea v-model="form.login_ip_allowlist" class="ip-area" rows="3"
            placeholder="e.g. 197.45.0.0/16&#10;102.40.21.7"></textarea>
        </div>
      </div>

    </div>

    <div class="save-bar">
      <button class="btn-primary" :disabled="saving" @click="save">
        {{ saving ? t('common.saving') : t('settings.policies.save_btn') }}
      </button>
      <span v-if="saved" class="save-confirm"><CheckCircle :size="14" /> {{ t('settings.policies.saved') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Package, CreditCard, Percent, CheckCircle, Clock, Globe, Hash, AlertCircle, CalendarClock } from 'lucide-vue-next'
import api from '@/api/axios'

const { t } = useI18n()

const loading = ref(false)
const saving  = ref(false)
const saved   = ref(false)
const taxes   = ref([])
const form    = reactive({
  allow_negative_stock: false, enable_agel_selling: true, default_tax: '',
  expiry_tracking_enabled: false, expired_sale_policy: 'WARN', expiry_alert_days: 60,
  credit_policy: 'ALLOW', default_credit_limit: null,
  product_numbering_mode: 'PROGRESSIVE',
  force_2fa_managers: false, session_timeout_minutes: 0, login_ip_allowlist: '',
})

const creditPolicyOptions = computed(() => [
  { value: 'ALLOW', label: t('settings.policies.allow') },
  { value: 'WARN',  label: t('settings.policies.warn') },
  { value: 'BLOCK', label: t('settings.policies.block') },
])

const expiredPolicyOptions = computed(() => [
  { value: 'ALLOW', label: t('settings.policies.exp_allow') },
  { value: 'WARN',  label: t('settings.policies.exp_warn') },
  { value: 'BLOCK', label: t('settings.policies.exp_block') },
])

function toggle(field) { form[field] = !form[field] }

async function load() {
  loading.value = true
  try {
    const [settingsRes, taxRes] = await Promise.all([
      api.get('/api/core/settings/'),
      api.get('/api/inventory/taxes/'),
    ])
    Object.assign(form, {
      allow_negative_stock:    settingsRes.data.allow_negative_stock,
      enable_agel_selling:     settingsRes.data.enable_agel_selling,
      expiry_tracking_enabled: settingsRes.data.expiry_tracking_enabled ?? false,
      expired_sale_policy:     settingsRes.data.expired_sale_policy || 'WARN',
      expiry_alert_days:       settingsRes.data.expiry_alert_days ?? 60,
      credit_policy:           settingsRes.data.credit_policy || 'ALLOW',
      default_credit_limit:    settingsRes.data.default_credit_limit ?? null,
      default_tax:             settingsRes.data.default_tax || '',
      product_numbering_mode:  settingsRes.data.product_numbering_mode || 'PROGRESSIVE',
      force_2fa_managers:      settingsRes.data.force_2fa_managers ?? false,
      session_timeout_minutes: settingsRes.data.session_timeout_minutes ?? 0,
      login_ip_allowlist:      settingsRes.data.login_ip_allowlist || '',
    })
    taxes.value = taxRes.data.results ?? taxRes.data
  } finally { loading.value = false }
}

async function save() {
  saving.value = true
  saved.value  = false
  try {
    await api.patch('/api/core/settings/', {
      allow_negative_stock:    form.allow_negative_stock,
      enable_agel_selling:     form.enable_agel_selling,
      expiry_tracking_enabled: form.expiry_tracking_enabled,
      expired_sale_policy:     form.expired_sale_policy,
      expiry_alert_days:       form.expiry_alert_days || 60,
      credit_policy:           form.credit_policy,
      default_credit_limit:    (form.credit_policy !== 'ALLOW' && form.default_credit_limit) ? form.default_credit_limit : null,
      default_tax:             form.default_tax || null,
      product_numbering_mode:  form.product_numbering_mode,
      force_2fa_managers:      form.force_2fa_managers,
      session_timeout_minutes: form.session_timeout_minutes || 0,
      login_ip_allowlist:      form.login_ip_allowlist || '',
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

.policies-grid { display:flex; flex-direction:column; gap:14px; }

.policy-card { display:flex; gap:16px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px; transition:box-shadow 120ms; }
.policy-card:hover { box-shadow:0 2px 12px rgba(0,0,0,.07); }
.policy-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.policy-body { flex:1; min-width:0; }
.policy-title { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px; }
.policy-desc  { font-size:13px; color:var(--text-muted); line-height:1.5; margin-bottom:14px; }
.policy-footer { display:flex; align-items:center; justify-content:space-between; }

.policy-status { font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px; }
.status-on  { background:var(--success-soft); color:#166534; }
.status-off { background:#f3f4f6; color:#6b7280; }

.toggle-btn  { width:44px; height:24px; border-radius:12px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--accent); }
.toggle-knob { position:absolute; width:18px; height:18px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:23px; }

.tax-select { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; min-width:220px; transition:border-color 120ms; }
.tax-select:focus { border-color:var(--accent); }

.section-heading { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin:18px 0 -4px; }

.num-input { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:90px; transition:border-color 120ms; }
.num-input:focus { border-color:var(--accent); }

.ip-area { width:100%; box-sizing:border-box; margin-top:6px; padding:9px 11px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; font-family:monospace; outline:none; resize:vertical; transition:border-color 120ms; }
.ip-area:focus { border-color:var(--accent); }

.save-bar { display:flex; align-items:center; gap:12px; margin-top:24px; }
.save-confirm { display:inline-flex; align-items:center; gap:5px; font-size:13px; color:var(--success); font-weight:500; }


.mode-btn { padding:6px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:12.5px; font-weight:600; cursor:pointer; transition:background 100ms,border-color 100ms,color 100ms; }
.mode-btn:hover { border-color:var(--accent); color:var(--accent); }
.mode-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }
</style>
