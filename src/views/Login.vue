<template>
  <div class="login-bg">
    <div class="login-card">
      <!-- Logo -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-weight:800;font-size:18px;">V</span>
        </div>
        <div>
          <div style="font-weight:700;font-size:17px;color:var(--text-primary);">Vendorya</div>
          <div style="font-size:11px;color:var(--text-muted);">ERP System</div>
        </div>
      </div>

      <!-- ============ STEP 1: CREDENTIALS ============ -->
      <template v-if="step === 'credentials'">
        <h1 class="login-h1">Welcome back</h1>
        <p class="login-sub">Sign in to your store account</p>

        <form @submit.prevent="handleLogin">
          <div style="margin-bottom:14px;">
            <label class="login-label">Username</label>
            <div style="position:relative;">
              <User :size="15" class="login-icon" />
              <input v-model="form.username" type="text" class="form-input" style="padding-left:36px;"
                placeholder="Enter your username" autocomplete="username" :disabled="loading" />
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label class="login-label">Password</label>
            <div style="position:relative;">
              <Lock :size="15" class="login-icon" />
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-input"
                style="padding-left:36px;padding-right:40px;" placeholder="Enter your password"
                autocomplete="current-password" :disabled="loading" />
              <button type="button" @click="showPassword = !showPassword" class="login-eye">
                <Eye v-if="!showPassword" :size="15" />
                <EyeOff v-else :size="15" />
              </button>
            </div>
          </div>

          <div v-if="error" class="login-error">
            <AlertCircle :size="15" style="color:#ef4444;margin-top:1px;flex-shrink:0;" />
            <span>{{ error }}</span>
          </div>

          <button type="submit" :disabled="loading || !form.username || !form.password" class="login-submit"
            :style="{ opacity: (loading || !form.username || !form.password) ? '0.6' : '1' }">
            <Loader2 v-if="loading" :size="16" style="animation:spin 0.8s linear infinite;" />
            <LogIn v-else :size="16" />
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>
      </template>

      <!-- ============ STEP 2: OTP ============ -->
      <template v-else-if="step === 'otp'">
        <h1 class="login-h1">Two-factor authentication</h1>
        <p class="login-sub">Enter the 6-digit code from your authenticator app, or a backup code.</p>

        <form @submit.prevent="handleOtp">
          <div style="margin-bottom:20px;">
            <label class="login-label">Verification code</label>
            <div style="position:relative;">
              <ShieldCheck :size="15" class="login-icon" />
              <input v-model="otp" type="text" inputmode="numeric" class="form-input" style="padding-left:36px;letter-spacing:3px;"
                placeholder="123456" autocomplete="one-time-password" :disabled="loading" autofocus />
            </div>
          </div>

          <div v-if="error" class="login-error">
            <AlertCircle :size="15" style="color:#ef4444;margin-top:1px;flex-shrink:0;" />
            <span>{{ error }}</span>
          </div>

          <button type="submit" :disabled="loading || !otp" class="login-submit" :style="{ opacity: (loading || !otp) ? '0.6' : '1' }">
            <Loader2 v-if="loading" :size="16" style="animation:spin 0.8s linear infinite;" />
            <ShieldCheck v-else :size="16" />
            {{ loading ? 'Verifying…' : 'Verify & Sign In' }}
          </button>
          <button type="button" class="login-back" @click="resetToCredentials">← Back to login</button>
        </form>
      </template>

      <!-- ============ STEP 3: ENROLLMENT ============ -->
      <template v-else-if="step === 'enroll'">
        <h1 class="login-h1">Set up two-factor auth</h1>
        <p class="login-sub">Your account requires 2FA. Scan the QR code with Google Authenticator, Authy, or similar.</p>

        <template v-if="!backupCodes">
          <div v-if="qr" style="display:flex;justify-content:center;margin-bottom:16px;">
            <img :src="qr" alt="2FA QR code" style="width:180px;height:180px;border:1px solid var(--border);border-radius:10px;" />
          </div>
          <div v-else style="text-align:center;margin-bottom:16px;color:var(--text-muted);">
            <Loader2 :size="20" style="animation:spin 0.8s linear infinite;" />
          </div>

          <form @submit.prevent="handleEnroll">
            <div style="margin-bottom:20px;">
              <label class="login-label">Enter the 6-digit code to confirm</label>
              <div style="position:relative;">
                <ShieldCheck :size="15" class="login-icon" />
                <input v-model="otp" type="text" inputmode="numeric" class="form-input"
                  style="padding-left:36px;letter-spacing:3px;" placeholder="123456" :disabled="loading" />
              </div>
            </div>

            <div v-if="error" class="login-error">
              <AlertCircle :size="15" style="color:#ef4444;margin-top:1px;flex-shrink:0;" />
              <span>{{ error }}</span>
            </div>

            <button type="submit" :disabled="loading || !otp || !qr" class="login-submit" :style="{ opacity: (loading || !otp || !qr) ? '0.6' : '1' }">
              <Loader2 v-if="loading" :size="16" style="animation:spin 0.8s linear infinite;" />
              <ShieldCheck v-else :size="16" />
              {{ loading ? 'Confirming…' : 'Confirm & Enable' }}
            </button>
            <button type="button" class="login-back" @click="resetToCredentials">← Cancel</button>
          </form>
        </template>

        <!-- Backup codes shown once after enrollment -->
        <template v-else>
          <div class="backup-box">
            <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
              <KeyRound :size="15" /> Save your backup codes
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin:0 0 12px;">
              Each code works once if you lose your authenticator. Store them somewhere safe — they won't be shown again.
            </p>
            <div class="backup-grid">
              <code v-for="c in backupCodes" :key="c">{{ c }}</code>
            </div>
          </div>
          <button type="button" class="login-submit" @click="step = 'otp'; otp = ''; error = ''">
            <ShieldCheck :size="16" /> I've saved them — Continue
          </button>
        </template>
      </template>

      <!-- Theme toggle -->
      <div style="margin-top:24px;display:flex;justify-content:center;">
        <button @click="theme.toggle()" class="login-theme">
          <Sun v-if="theme.dark" :size="13" />
          <Moon v-else :size="13" />
          {{ theme.dark ? 'Light mode' : 'Dark mode' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, LogIn, Sun, Moon, ShieldCheck, KeyRound } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()

const form = ref({ username: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const step = ref('credentials')   // credentials | otp | enroll
const otp = ref('')
const qr = ref('')
const preAuthToken = ref('')
const backupCodes = ref(null)

onMounted(() => {
  if (route.query.idle) error.value = 'You were signed out due to inactivity.'
})

function resetToCredentials() {
  step.value = 'credentials'
  otp.value = ''
  qr.value = ''
  preAuthToken.value = ''
  backupCodes.value = null
  error.value = ''
}

function mapError(err, fallback) {
  const status = err.response?.status
  if (status === 401) return 'Invalid username or password.'
  if (status === 429) return err.response?.data?.detail || 'Too many attempts. Please try again later.'
  if (status === 403) return err.response?.data?.detail || 'Login not allowed.'
  if (!navigator.onLine) return 'No internet connection.'
  return fallback
}

function goHome() {
  router.push(auth.isSuperadmin ? '/admin/dashboard' : '/dashboard')
}

async function handleLogin() {
  if (!form.value.username || !form.value.password) return
  error.value = ''
  loading.value = true
  try {
    const res = await auth.login(form.value.username, form.value.password)
    if (res.status === 'ok') return goHome()
    if (res.status === 'requires_2fa') { step.value = 'otp'; return }
    if (res.status === 'enroll_2fa') {
      preAuthToken.value = res.preAuthToken
      step.value = 'enroll'
      await startEnroll()
    }
  } catch (err) {
    error.value = mapError(err, 'Server error. Please try again.')
  } finally {
    loading.value = false
  }
}

async function handleOtp() {
  if (!otp.value) return
  error.value = ''
  loading.value = true
  try {
    const res = await auth.login(form.value.username, form.value.password, otp.value.trim())
    if (res.status === 'ok') return goHome()
    error.value = 'Invalid code. Please try again.'
  } catch (err) {
    error.value = mapError(err, err.response?.data?.detail || 'Invalid code.')
  } finally {
    loading.value = false
  }
}

const preAuthCfg = () => ({ headers: { Authorization: `Bearer ${preAuthToken.value}` } })

async function startEnroll() {
  qr.value = ''
  try {
    const { data } = await api.post('/api/auth/2fa/setup/', {}, preAuthCfg())
    qr.value = data.qr
  } catch (err) {
    error.value = err.response?.data?.detail || 'Could not start 2FA setup.'
  }
}

async function handleEnroll() {
  if (!otp.value) return
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/api/auth/2fa/verify-setup/', { token: otp.value.trim() }, preAuthCfg())
    backupCodes.value = data.backup_codes
    otp.value = ''
  } catch (err) {
    error.value = err.response?.data?.detail || 'Invalid code. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }

.login-h1  { font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px; }
.login-sub { font-size:13.5px;color:var(--text-muted);margin:0 0 24px;line-height:1.5; }
.login-label { display:block;font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:6px; }
.login-icon { position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted); }
.login-eye { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);padding:0;display:flex; }

.login-error { display:flex;align-items:flex-start;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;margin-bottom:16px; }
.login-error span { font-size:13px;color:#dc2626; }

.login-submit {
  width:100%;height:42px;background:linear-gradient(135deg,#1d4ed8,#1e40af);color:#fff;border:none;
  border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;
  justify-content:center;gap:8px;transition:opacity 150ms,transform 80ms;
}
.login-submit:active { transform:scale(0.97); }
.login-back { width:100%;margin-top:12px;background:none;border:none;color:var(--text-muted);font-size:12.5px;cursor:pointer;padding:6px; }
.login-theme { display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:8px;transition:background 120ms; }
.login-theme:hover { background:var(--border); }

.backup-box { background:var(--bg-app);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px; }
.backup-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px; }
.backup-grid code { font-family:monospace;font-size:13px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:6px 8px;text-align:center;color:var(--text-primary);letter-spacing:1px; }
</style>
