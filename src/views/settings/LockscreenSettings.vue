<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.lockscreen.title') }}</h1>
        <p class="page-sub">{{ t('settings.lockscreen.sub') }}</p>
      </div>
    </div>

    <div v-if="loading" class="skeleton-card" />
    <div v-else class="ls-settings-grid">

      <!-- ── Auto-Lock Timer ──────────────────────────────────────── -->
      <div class="settings-card">
        <div class="section-label">{{ t('settings.lockscreen.timer_title') }}</div>
        <p class="section-muted">{{ t('settings.lockscreen.timer_desc') }}</p>
        <div class="form-row">
          <BaseSelect
            v-model="form.lock_timeout_minutes"
            :options="timeoutOptions"
            :label="t('settings.lockscreen.timer_label')"
            @change="saveTimeout"
          />
        </div>
        <div v-if="savedTimeout" class="saved-msg">{{ t('common.saved') }}</div>
      </div>

      <!-- ── Store Type ───────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="section-label">{{ t('settings.lockscreen.store_type_title') }}</div>
        <p class="section-muted">{{ t('settings.lockscreen.store_type_desc') }}</p>
        <BaseSelect
          v-model="storeType"
          :options="storeTypeOptions"
          :label="t('settings.lockscreen.store_type_label')"
          @change="saveStoreType"
        />
        <div v-if="savedStoreType" class="saved-msg">{{ t('common.saved') }}</div>
      </div>

      <!-- ── Lock Screen Logo ─────────────────────────────────────── -->
      <div class="settings-card">
        <div class="section-label">{{ t('settings.lockscreen.logo_title') }}</div>
        <p class="section-muted">{{ t('settings.lockscreen.logo_desc') }}</p>
        <div class="logo-preview-area">
          <img v-if="logoUrl" :src="logoUrl" class="logo-preview" alt="Lock screen logo" />
          <div v-else class="logo-empty"><Lock :size="32" /></div>
        </div>
        <div class="logo-actions">
          <label class="btn-secondary btn-sm logo-upload-btn">
            {{ logoUploading ? t('common.uploading') : t('settings.lockscreen.logo_upload') }}
            <input type="file" accept="image/png,image/webp,image/svg+xml" @change="uploadLogo" :disabled="logoUploading" class="hidden-file" />
          </label>
          <button v-if="logoUrl" class="btn-ghost btn-sm" @click="clearLogo">
            {{ t('settings.lockscreen.logo_clear') }}
          </button>
        </div>
      </div>

      <!-- ── PIN Code ─────────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="section-label">{{ t('settings.lockscreen.pin_title') }}</div>
        <p class="section-muted">{{ t('settings.lockscreen.pin_desc') }}</p>

        <div class="form-col">
          <!-- Old PIN / password (only if PIN is already set) -->
          <div v-if="pinSet">
            <div class="ls-pin-mode-toggle">
              <button
                class="toggle-chip"
                :class="{ active: pinChangeMode === 'pin' }"
                @click="pinChangeMode = 'pin'"
              >{{ t('settings.lockscreen.use_old_pin') }}</button>
              <button
                class="toggle-chip"
                :class="{ active: pinChangeMode === 'password' }"
                @click="pinChangeMode = 'password'"
              >{{ t('settings.lockscreen.use_password') }}</button>
            </div>
            <BaseInput
              v-if="pinChangeMode === 'pin'"
              v-model="oldPin"
              type="password"
              inputmode="numeric"
              :label="t('settings.lockscreen.old_pin')"
              :placeholder="t('settings.lockscreen.pin_ph')"
              maxlength="6"
            />
            <BaseInput
              v-else
              v-model="accountPassword"
              type="password"
              :label="t('settings.lockscreen.account_password')"
              :placeholder="t('settings.lockscreen.password_ph')"
            />
          </div>

          <BaseInput
            v-model="newPin"
            type="password"
            inputmode="numeric"
            :label="pinSet ? t('settings.lockscreen.new_pin') : t('settings.lockscreen.set_pin')"
            :placeholder="t('settings.lockscreen.pin_ph')"
            maxlength="6"
            :error="pinError"
          />
          <BaseInput
            v-model="confirmPin"
            type="password"
            inputmode="numeric"
            :label="t('settings.lockscreen.confirm_pin')"
            :placeholder="t('settings.lockscreen.pin_ph')"
            maxlength="6"
          />
        </div>

        <div class="form-footer">
          <span v-if="pinSaved" class="saved-msg">{{ t('settings.lockscreen.pin_saved') }}</span>
          <div style="display:flex;gap:8px;">
            <button v-if="pinSet" class="btn-ghost btn-sm" :disabled="pinBusy" @click="clearPin">
              {{ t('settings.lockscreen.remove_pin') }}
            </button>
            <button class="btn-primary btn-sm" :disabled="pinBusy || !canSetPin" @click="setPin">
              {{ pinBusy ? t('common.saving') : (pinSet ? t('settings.lockscreen.change_pin') : t('settings.lockscreen.save_pin')) }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Facts Bank ───────────────────────────────────────────── -->
      <div class="settings-card ls-facts-card">
        <div class="section-label">{{ t('settings.lockscreen.facts_title') }}</div>
        <p class="section-muted">{{ t('settings.lockscreen.facts_desc') }}</p>

        <div class="facts-meta">
          <span class="facts-count">{{ form.lock_facts_bank.length }} {{ t('settings.lockscreen.facts_count') }}</span>
          <button class="btn-secondary btn-sm" :disabled="generatingFacts" @click="generateFacts">
            <span v-if="generatingFacts">{{ t('settings.lockscreen.generating') }}</span>
            <span v-else>{{ t('settings.lockscreen.generate_btn') }}</span>
          </button>
        </div>

        <div v-if="form.lock_facts_bank.length" class="facts-list">
          <div v-for="(fact, i) in form.lock_facts_bank" :key="i" class="fact-row">
            <span class="fact-num">{{ i + 1 }}</span>
            <div class="fact-texts">
              <p class="fact-en">{{ fact.en }}</p>
              <p class="fact-ar" dir="rtl">{{ fact.ar }}</p>
            </div>
          </div>
        </div>
        <p v-else class="section-muted" style="margin-top:8px;">{{ t('settings.lockscreen.facts_empty') }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock } from 'lucide-vue-next'
import api from '@/api/axios'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseInput  from '@/components/base/BaseInput.vue'
import { useLockscreen } from '@/composables/useLockscreen'

const { t } = useI18n()
const { refreshSettings } = useLockscreen()

const loading = ref(true)
const form = reactive({ lock_timeout_minutes: 0, lock_facts_bank: [] })
const logoUrl  = ref(null)
const pinSet   = ref(false)
const storeType = ref('GENERAL')

// Timer
const savedTimeout  = ref(false)
const savedStoreType = ref(false)

// Logo
const logoUploading = ref(false)

// PIN
const oldPin         = ref('')
const accountPassword = ref('')
const newPin         = ref('')
const confirmPin     = ref('')
const pinError       = ref('')
const pinBusy        = ref(false)
const pinSaved       = ref(false)
const pinChangeMode  = ref('pin')

// Facts
const generatingFacts = ref(false)

const timeoutOptions = [
  { value: 0,   label: t('settings.lockscreen.timeout_off') },
  { value: 5,   label: t('settings.lockscreen.timeout_5') },
  { value: 10,  label: t('settings.lockscreen.timeout_10') },
  { value: 20,  label: t('settings.lockscreen.timeout_20') },
  { value: 30,  label: t('settings.lockscreen.timeout_30') },
  { value: 60,  label: t('settings.lockscreen.timeout_1h') },
  { value: 120, label: t('settings.lockscreen.timeout_2h') },
  { value: 240, label: t('settings.lockscreen.timeout_4h') },
]

const storeTypeOptions = [
  { value: 'GENERAL',     label: t('settings.lockscreen.type_general') },
  { value: 'PHARMACY',    label: t('settings.lockscreen.type_pharmacy') },
  { value: 'GROCERY',     label: t('settings.lockscreen.type_grocery') },
  { value: 'ELECTRONICS', label: t('settings.lockscreen.type_electronics') },
  { value: 'CLOTHING',    label: t('settings.lockscreen.type_clothing') },
]

const canSetPin = computed(() => {
  if (!newPin.value || newPin.value.length < 4) return false
  if (newPin.value !== confirmPin.value) return false
  if (pinSet.value) {
    if (pinChangeMode.value === 'pin' && !oldPin.value) return false
    if (pinChangeMode.value === 'password' && !accountPassword.value) return false
  }
  return true
})

async function load() {
  loading.value = true
  try {
    const [storeRes, settingsRes] = await Promise.all([
      api.get('/api/core/store/'),
      api.get('/api/core/settings/'),
    ])
    storeType.value                  = storeRes.data.store_type || 'GENERAL'
    form.lock_timeout_minutes        = settingsRes.data.lock_timeout_minutes ?? 0
    form.lock_facts_bank             = settingsRes.data.lock_facts_bank ?? []
    logoUrl.value                    = settingsRes.data.lock_logo_url || null
    pinSet.value                     = settingsRes.data.lock_pin_set ?? false
  } finally {
    loading.value = false
  }
}

async function saveTimeout() {
  await api.patch('/api/core/settings/', { lock_timeout_minutes: form.lock_timeout_minutes })
  refreshSettings({ lock_timeout_minutes: form.lock_timeout_minutes })
  savedTimeout.value = true
  setTimeout(() => { savedTimeout.value = false }, 2000)
}

async function saveStoreType() {
  await api.patch('/api/core/store/', { store_type: storeType.value })
  savedStoreType.value = true
  setTimeout(() => { savedStoreType.value = false }, 2000)
}

async function uploadLogo(e) {
  const file = e.target.files[0]
  if (!file) return
  logoUploading.value = true
  try {
    const fd = new FormData()
    fd.append('lock_logo', file)
    const res = await api.patch('/api/core/lockscreen/logo/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    logoUrl.value = res.data.lock_logo_url
    refreshSettings({ lock_logo_url: res.data.lock_logo_url })
  } finally {
    logoUploading.value = false
    e.target.value = ''
  }
}

async function clearLogo() {
  logoUploading.value = true
  try {
    await api.patch('/api/core/lockscreen/logo/', { clear: true })
    logoUrl.value = null
    refreshSettings({ lock_logo_url: null })
  } finally {
    logoUploading.value = false
  }
}

async function setPin() {
  pinError.value = ''
  if (newPin.value !== confirmPin.value) { pinError.value = t('settings.lockscreen.pin_mismatch'); return }
  if (!/^\d{4,6}$/.test(newPin.value))  { pinError.value = t('settings.lockscreen.pin_format'); return }
  pinBusy.value = true
  try {
    await api.post('/api/core/lockscreen/pin/', {
      action:  'set',
      new_pin: newPin.value,
      old_pin: pinChangeMode.value === 'pin' ? oldPin.value : undefined,
      password: pinChangeMode.value === 'password' ? accountPassword.value : undefined,
    })
    pinSet.value  = true
    pinSaved.value = true
    newPin.value = confirmPin.value = oldPin.value = accountPassword.value = ''
    refreshSettings({ lock_pin_set: true })
    setTimeout(() => { pinSaved.value = false }, 2500)
  } catch (e) {
    pinError.value = e.response?.data?.error || t('common.error')
  } finally {
    pinBusy.value = false
  }
}

async function clearPin() {
  pinBusy.value = true
  try {
    await api.post('/api/core/lockscreen/pin/', {
      action:   'clear',
      old_pin:  pinChangeMode.value === 'pin' ? oldPin.value : undefined,
      password: pinChangeMode.value === 'password' ? accountPassword.value : undefined,
    })
    pinSet.value = false
    oldPin.value = accountPassword.value = ''
    refreshSettings({ lock_pin_set: false })
  } catch (e) {
    pinError.value = e.response?.data?.error || t('common.error')
  } finally {
    pinBusy.value = false
  }
}

async function generateFacts() {
  generatingFacts.value = true
  try {
    const res = await api.post('/api/core/lockscreen/facts/')
    form.lock_facts_bank = res.data.facts
    refreshSettings({ lock_facts_bank: res.data.facts })
  } catch (e) {
    console.error('Facts generation failed:', e.response?.data?.error)
  } finally {
    generatingFacts.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.ls-settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 900px) { .ls-settings-grid { grid-template-columns: 1fr; } }

.ls-facts-card { grid-column: 1 / -1; }

.section-muted { font-size: 13px; color: var(--text-muted); margin: 4px 0 12px; }
.form-row { max-width: 320px; }
.form-col { display: flex; flex-direction: column; gap: 14px; }
.form-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.saved-msg { font-size: 13px; color: var(--accent); }

/* Logo */
.logo-preview-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110px;
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: 12px;
  margin-bottom: 12px;
}
.logo-preview { max-height: 90px; max-width: 220px; object-fit: contain; }
.logo-empty { color: var(--text-muted); }
.logo-actions { display: flex; gap: 8px; }
.logo-upload-btn { cursor: pointer; position: relative; }
.hidden-file { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

/* PIN toggle */
.ls-pin-mode-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
.toggle-chip {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.toggle-chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* Facts */
.facts-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.facts-count { font-size: 13px; color: var(--text-muted); }
.facts-list { display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 4px; }
.fact-row { display: flex; gap: 12px; padding: 10px 12px; background: var(--bg-body); border-radius: 8px; }
.fact-num { font-size: 11px; color: var(--text-muted); min-width: 20px; padding-top: 2px; }
.fact-texts { display: flex; flex-direction: column; gap: 4px; }
.fact-en { font-size: 13px; color: var(--text-main); margin: 0; }
.fact-ar { font-size: 13px; color: var(--text-muted); margin: 0; }
</style>
