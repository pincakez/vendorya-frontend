<template>
  <div class="settings-card">
    <div class="section-label">Two-Factor Authentication</div>

    <div class="tfa-row">
      <div>
        <div class="tfa-state">
          <ShieldCheck v-if="status.enrolled" :size="16" style="color:#16a34a;" />
          <ShieldAlert v-else :size="16" style="color:#d97706;" />
          <span>{{ status.enrolled ? 'Enabled' : 'Not enabled' }}</span>
          <span v-if="status.required && !status.enrolled" class="tfa-req">Required for your role</span>
        </div>
        <p class="tfa-hint">Protect your account with a time-based code from an authenticator app.</p>
      </div>
      <div class="tfa-actions">
        <button v-if="!status.enrolled" class="btn-primary" @click="openSetup">Enable 2FA</button>
        <template v-else>
          <button class="btn-ghost" @click="regenerate" :disabled="busy">Regenerate backup codes</button>
          <button v-if="!status.required" class="btn-danger" @click="openDisable">Disable</button>
        </template>
      </div>
    </div>

    <!-- Setup / enrollment modal -->
    <AppModal :open="setupOpen" title="Set up two-factor authentication" @close="closeSetup">
      <div v-if="!codes">
        <p class="modal-text">Scan this QR code with Google Authenticator, Authy, or a similar app, then enter the 6-digit code to confirm.</p>
        <div style="display:flex;justify-content:center;margin:14px 0;">
          <img v-if="qr" :src="qr" alt="2FA QR" style="width:170px;height:170px;border:1px solid var(--border);border-radius:10px;" />
          <Loader2 v-else :size="22" style="animation:spin .8s linear infinite;color:var(--text-muted);" />
        </div>
        <label class="form-label">Verification code</label>
        <input v-model="code" type="text" inputmode="numeric" class="form-input" placeholder="123456" style="letter-spacing:2px;" />
        <p v-if="err" class="error-text">{{ err }}</p>
      </div>
      <div v-else>
        <p class="modal-text"><strong>2FA is now enabled.</strong> Save these one-time backup codes somewhere safe — they won't be shown again.</p>
        <div class="backup-grid">
          <code v-for="c in codes" :key="c">{{ c }}</code>
        </div>
      </div>
      <template #footer>
        <button v-if="!codes" class="btn-ghost" @click="closeSetup">Cancel</button>
        <button v-if="!codes" class="btn-primary" :disabled="busy || !code || !qr" @click="confirmSetup">
          {{ busy ? 'Confirming…' : 'Confirm & Enable' }}
        </button>
        <button v-else class="btn-primary" @click="closeSetup">Done</button>
      </template>
    </AppModal>

    <!-- Disable modal -->
    <AppModal :open="disableOpen" title="Disable two-factor authentication" @close="disableOpen = false">
      <p class="modal-text">Enter your current password to confirm. Your authenticator and backup codes will be removed.</p>
      <input v-model="password" type="password" class="form-input" placeholder="Current password" />
      <p v-if="err" class="error-text">{{ err }}</p>
      <template #footer>
        <button class="btn-ghost" @click="disableOpen = false">Cancel</button>
        <button class="btn-danger" :disabled="busy || !password" @click="confirmDisable">
          {{ busy ? 'Disabling…' : 'Disable 2FA' }}
        </button>
      </template>
    </AppModal>

    <!-- Regenerated codes modal -->
    <AppModal :open="regenOpen" title="New backup codes" @close="regenOpen = false">
      <p class="modal-text">Your old backup codes are now invalid. Save these new ones.</p>
      <div class="backup-grid">
        <code v-for="c in codes" :key="c">{{ c }}</code>
      </div>
      <template #footer>
        <button class="btn-primary" @click="regenOpen = false">Done</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

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
    err.value = e.response?.data?.detail || 'Could not start setup.'
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
    err.value = e.response?.data?.detail || 'Invalid code.'
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
    err.value = e.response?.data?.detail || 'Could not disable 2FA.'
  } finally { busy.value = false }
}

async function regenerate() {
  busy.value = true
  try {
    const { data } = await api.post('/api/auth/2fa/backup-codes/regenerate/')
    codes.value = data.backup_codes
    regenOpen.value = true
  } catch (e) {
    alert(e.response?.data?.detail || 'Could not regenerate codes.')
  } finally { busy.value = false }
}

onMounted(loadStatus)
</script>

<style scoped>
.settings-card  { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.section-label  { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); }

.tfa-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.tfa-state { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:600; color:var(--text-primary); }
.tfa-req { font-size:11px; font-weight:700; color:#b45309; background:#fef3c7; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.04em; }
.tfa-hint { font-size:12.5px; color:var(--text-muted); margin:6px 0 0; }
.tfa-actions { display:flex; gap:8px; flex-wrap:wrap; }

.modal-text { font-size:13px; color:var(--text-secondary); margin:0 0 10px; line-height:1.5; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }
.error-text { font-size:12px; color:#dc2626; margin-top:8px; }

.backup-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
.backup-grid code { font-family:monospace; font-size:13px; background:var(--bg-app); border:1px solid var(--border); border-radius:6px; padding:6px 8px; text-align:center; color:var(--text-primary); letter-spacing:1px; }

.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,opacity 100ms; }
.btn-primary:hover { background:var(--accent-hover); }
.btn-primary:disabled { opacity:.5; cursor:default; }
.btn-ghost { padding:8px 14px; border-radius:8px; font-size:13px; font-weight:600; border:1px solid var(--border); background:transparent; color:var(--text-secondary); cursor:pointer; }
.btn-ghost:hover { background:var(--border); }
.btn-danger { padding:8px 14px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#dc2626; color:#fff; cursor:pointer; }
.btn-danger:hover { background:#b91c1c; }
.btn-danger:disabled { opacity:.5; cursor:default; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
