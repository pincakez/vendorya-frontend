<template>
  <div class="settings-card">
    <div class="section-label">{{ t('settings.tfa.title') }}</div>

    <div class="tfa-row">
      <div>
        <div class="tfa-state">
          <ShieldCheck v-if="status.enrolled" :size="16" style="color:var(--success);" />
          <ShieldAlert v-else :size="16" style="color:var(--warning);" />
          <span>{{ status.enrolled ? t('settings.tfa.enabled') : t('settings.tfa.not_enabled') }}</span>
          <span v-if="status.required && !status.enrolled" class="tfa-req">{{ t('settings.tfa.required') }}</span>
        </div>
        <p class="tfa-hint">{{ t('settings.tfa.hint') }}</p>
      </div>
      <div class="tfa-actions">
        <button v-if="!status.enrolled" class="btn-primary" @click="openSetup">{{ t('settings.tfa.enable_btn') }}</button>
        <template v-else>
          <button class="btn-ghost" @click="regenerate" :disabled="busy">{{ t('settings.tfa.regen_btn') }}</button>
          <button v-if="!status.required" class="btn-danger" @click="openDisable">{{ t('settings.tfa.disable') }}</button>
        </template>
      </div>
    </div>

    <!-- Setup / enrollment modal -->
    <AppModal :open="setupOpen" :title="t('settings.tfa.setup_title')" @close="closeSetup">
      <div v-if="!codes">
        <p class="modal-text">{{ t('settings.tfa.setup_text') }}</p>
        <div style="display:flex;justify-content:center;margin:14px 0;">
          <img v-if="qr" :src="qr" alt="2FA QR" style="width:170px;height:170px;border:1px solid var(--border);border-radius:10px;" />
          <Loader2 v-else :size="22" style="animation:spin .8s linear infinite;color:var(--text-muted);" />
        </div>
        <label class="form-label">{{ t('settings.tfa.verify_code') }}</label>
        <input v-model="code" type="text" inputmode="numeric" class="form-input" placeholder="123456" style="letter-spacing:2px;" />
        <p v-if="err" class="error-text">{{ err }}</p>
      </div>
      <div v-else>
        <p class="modal-text"><strong>{{ t('settings.tfa.enabled_strong') }}</strong> {{ t('settings.tfa.enabled_rest') }}</p>
        <div class="backup-grid">
          <code v-for="c in codes" :key="c">{{ c }}</code>
        </div>
      </div>
      <template #footer>
        <button v-if="!codes" class="btn-ghost" @click="closeSetup">{{ t('common.cancel') }}</button>
        <button v-if="!codes" class="btn-primary" :disabled="busy || !code || !qr" @click="confirmSetup">
          {{ busy ? t('settings.tfa.confirming') : t('settings.tfa.confirm_enable') }}
        </button>
        <button v-else class="btn-primary" @click="closeSetup">{{ t('common.dt.done') }}</button>
      </template>
    </AppModal>

    <!-- Disable modal -->
    <AppModal :open="disableOpen" :title="t('settings.tfa.disable_title')" @close="disableOpen = false">
      <p class="modal-text">{{ t('settings.tfa.disable_text') }}</p>
      <input v-model="password" type="password" class="form-input" :placeholder="t('settings.tfa.current_password')" />
      <p v-if="err" class="error-text">{{ err }}</p>
      <template #footer>
        <button class="btn-ghost" @click="disableOpen = false">{{ t('common.cancel') }}</button>
        <button class="btn-danger" :disabled="busy || !password" @click="confirmDisable">
          {{ busy ? t('settings.tfa.disabling') : t('settings.tfa.disable_btn') }}
        </button>
      </template>
    </AppModal>

    <!-- Regenerated codes modal -->
    <AppModal :open="regenOpen" :title="t('settings.tfa.regen_title')" @close="regenOpen = false">
      <p class="modal-text">{{ t('settings.tfa.regen_text') }}</p>
      <div class="backup-grid">
        <code v-for="c in codes" :key="c">{{ c }}</code>
      </div>
      <template #footer>
        <button class="btn-primary" @click="regenOpen = false">{{ t('common.dt.done') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const { t } = useI18n()

const status = reactive({ enrolled: false, required: false })
const setupOpen = ref(false)
const disableOpen = ref(false)
const regenOpen = ref(false)
const qr = ref('')
const code = ref('')
const password = ref('')
const codes = ref(null)
const err = ref('')
const busy = ref(false)

async function loadStatus() {
  try {
    const { data } = await api.get('/api/auth/2fa/status/')
    status.enrolled = data.enrolled
    status.required = data.required
  } catch { /* ignore */ }
}

async function openSetup() {
  err.value = ''; code.value = ''; codes.value = null; qr.value = ''
  setupOpen.value = true
  try {
    const { data } = await api.post('/api/auth/2fa/setup/')
    qr.value = data.qr
  } catch (e) {
    err.value = e.response?.data?.detail || t('settings.tfa.err_setup')
  }
}
function closeSetup() {
  setupOpen.value = false
  if (codes.value) loadStatus()   // enrolled successfully
}

async function confirmSetup() {
  err.value = ''; busy.value = true
  try {
    const { data } = await api.post('/api/auth/2fa/verify-setup/', { token: code.value.trim() })
    codes.value = data.backup_codes
    status.enrolled = true
  } catch (e) {
    err.value = e.response?.data?.detail || t('settings.tfa.err_invalid')
  } finally { busy.value = false }
}

function openDisable() { err.value = ''; password.value = ''; disableOpen.value = true }
async function confirmDisable() {
  err.value = ''; busy.value = true
  try {
    await api.post('/api/auth/2fa/disable/', { password: password.value })
    disableOpen.value = false
    await loadStatus()
  } catch (e) {
    err.value = e.response?.data?.detail || t('settings.tfa.err_disable')
  } finally { busy.value = false }
}

async function regenerate() {
  busy.value = true
  try {
    const { data } = await api.post('/api/auth/2fa/backup-codes/regenerate/')
    codes.value = data.backup_codes
    regenOpen.value = true
  } catch (e) {
    alert(e.response?.data?.detail || t('settings.tfa.err_regen'))
  } finally { busy.value = false }
}

onMounted(loadStatus)
</script>

<style scoped>
.settings-card  { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.section-label  { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); }

.tfa-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.tfa-state { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:600; color:var(--text-primary); }
.tfa-req { font-size:11px; font-weight:700; color:var(--warning-hover); background:var(--warning-soft); padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.04em; }
.tfa-hint { font-size:12.5px; color:var(--text-muted); margin:6px 0 0; }
.tfa-actions { display:flex; gap:8px; flex-wrap:wrap; }

.modal-text { font-size:13px; color:var(--text-secondary); margin:0 0 10px; line-height:1.5; }
.form-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }
.error-text { font-size:12px; color:var(--danger); margin-top:8px; }

.backup-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
.backup-grid code { font-family:monospace; font-size:13px; background:var(--bg-app); border:1px solid var(--border); border-radius:6px; padding:6px 8px; text-align:center; color:var(--text-primary); letter-spacing:1px; }


@keyframes spin { to { transform: rotate(360deg); } }
</style>
