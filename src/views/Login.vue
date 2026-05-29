<template>
  <div class="auth">
    <!-- ============ LEFT BRAND PANEL ============ -->
    <div class="auth-brand">
      <div class="brand-glow glow-a"></div>
      <div class="brand-glow glow-b"></div>
      <div class="brand-grid"></div>

      <div class="brand-content">
        <img src="/favicon.svg" alt="" class="brand-mark" />
        <img src="/logo-text.png" alt="Vendorya" class="brand-word" />
        <p class="brand-tag">Run your entire store from one place.</p>
        <div class="brand-pills">
          <span>Inventory</span><span>Sales</span><span>Finance</span><span>Insights</span>
        </div>
      </div>

      <div class="brand-foot">© 2026 Vendorya · Built for retail.</div>
    </div>

    <!-- ============ RIGHT FORM PANEL ============ -->
    <div class="auth-form">
      <div class="auth-card">
        <!-- Mobile logo -->
        <div class="auth-logo-m">
          <img src="/favicon.svg" alt="" />
          <span>Vendorya</span>
        </div>

        <!-- STEP 1: CREDENTIALS -->
        <template v-if="step === 'credentials'">
          <h1 class="auth-h1">Welcome back</h1>
          <p class="auth-sub">Sign in to your store account</p>

          <form @submit.prevent="handleLogin">
            <div class="auth-field">
              <label class="auth-label">Username or email</label>
              <div class="auth-input-wrap">
                <User :size="15" class="auth-icon" />
                <input v-model="form.username" type="text" class="form-input auth-input"
                  placeholder="Enter your username or email" autocomplete="username" :disabled="loading" />
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-label">Password</label>
              <div class="auth-input-wrap">
                <Lock :size="15" class="auth-icon" />
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-input auth-input auth-input-pw"
                  placeholder="Enter your password" autocomplete="current-password" :disabled="loading" />
                <button type="button" @click="showPassword = !showPassword" class="auth-eye">
                  <Eye v-if="!showPassword" :size="15" />
                  <EyeOff v-else :size="15" />
                </button>
              </div>
            </div>

            <div v-if="error" class="auth-error">
              <AlertCircle :size="15" class="auth-error-icon" />
              <span>{{ error }}</span>
            </div>

            <button type="submit" :disabled="loading || !form.username || !form.password" class="auth-submit btn-press">
              <Loader2 v-if="loading" :size="16" class="spin" />
              <LogIn v-else :size="16" />
              {{ loading ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>
        </template>

        <!-- STEP 2: OTP -->
        <template v-else-if="step === 'otp'">
          <h1 class="auth-h1">Two-factor authentication</h1>
          <p class="auth-sub">Enter the 6-digit code from your authenticator app, or a backup code.</p>

          <form @submit.prevent="handleOtp">
            <div class="auth-field">
              <label class="auth-label">Verification code</label>
              <div class="auth-input-wrap">
                <ShieldCheck :size="15" class="auth-icon" />
                <input v-model="otp" type="text" inputmode="numeric" class="form-input auth-input auth-otp"
                  placeholder="123456" autocomplete="one-time-password" :disabled="loading" autofocus />
              </div>
            </div>

            <div v-if="error" class="auth-error">
              <AlertCircle :size="15" class="auth-error-icon" />
              <span>{{ error }}</span>
            </div>

            <button type="submit" :disabled="loading || !otp" class="auth-submit btn-press">
              <Loader2 v-if="loading" :size="16" class="spin" />
              <ShieldCheck v-else :size="16" />
              {{ loading ? 'Verifying…' : 'Verify & Sign In' }}
            </button>
            <button type="button" class="auth-back" @click="resetToCredentials">← Back to login</button>
          </form>
        </template>

        <!-- Theme toggle -->
        <div class="auth-theme-row">
          <button @click="theme.toggle()" class="auth-theme">
            <Sun v-if="theme.dark" :size="13" />
            <Moon v-else :size="13" />
            {{ theme.dark ? 'Light mode' : 'Dark mode' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, LogIn, Sun, Moon, ShieldCheck } from 'lucide-vue-next'
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

const step = ref('credentials')   // credentials | otp
const otp = ref('')

onMounted(() => {
  if (route.query.idle) error.value = 'You were signed out due to inactivity.'
})

function resetToCredentials() {
  step.value = 'credentials'
  otp.value = ''
  error.value = ''
}

function mapError(err, fallback) {
  const status = err.response?.status
  if (!navigator.onLine) return 'No internet connection.'
  if (status === 400) return err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid username or password.'
  if (status === 401) return 'Invalid username or password.'
  if (status === 403) return err.response?.data?.detail || 'Login not allowed from this location.'
  if (status === 429) return err.response?.data?.detail || 'Too many attempts. Please wait and try again.'
  if (status >= 500) return 'The server encountered an error. Please try again in a moment.'
  if (!status) return 'Cannot reach the server. Check your connection.'
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
    if (res.status === 'requires_2fa') { step.value = 'otp'; return }
    return goHome()
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
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

.auth {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  background: var(--bg-app);
}

/* ── BRAND PANEL ─────────────────────────────── */
.auth-brand {
  position: relative;
  overflow: hidden;
  background: radial-gradient(120% 120% at 0% 0%, #1a1340 0%, #0c0a1f 55%, #07060f 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px;
  color: #fff;
}
.brand-glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; pointer-events: none; }
.glow-a { width: 420px; height: 420px; background: #7e14ff; top: -120px; left: -80px; }
.glow-b { width: 360px; height: 360px; background: #f78f1e; bottom: -120px; right: -60px; opacity: 0.35; }
.brand-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(100% 100% at 30% 30%, #000 0%, transparent 75%);
}
.brand-content { position: relative; z-index: 1; max-width: 420px; }
.brand-mark { width: 52px; height: 52px; margin-bottom: 28px; filter: drop-shadow(0 6px 20px rgba(126,20,255,0.5)); }
.brand-word { height: 38px; display: block; margin-bottom: 22px; }
.brand-tag { font-size: 19px; line-height: 1.5; font-weight: 500; color: #c9c4e0; margin: 0 0 26px; }
.brand-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.brand-pills span {
  font-size: 12px; font-weight: 600; letter-spacing: 0.02em;
  padding: 6px 13px; border-radius: 999px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: #e8e5f5;
  backdrop-filter: blur(4px);
}
.brand-foot { position: relative; z-index: 1; margin-top: auto; font-size: 12px; color: rgba(255,255,255,0.4); padding-top: 40px; }

/* ── FORM PANEL ──────────────────────────────── */
.auth-form { display: flex; align-items: center; justify-content: center; padding: 24px; }
.auth-card { width: 100%; max-width: 380px; }

.auth-logo-m { display: none; align-items: center; gap: 10px; margin-bottom: 28px; }
.auth-logo-m img { width: 36px; height: 36px; }
.auth-logo-m span { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); }

.auth-h1  { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin: 0 0 6px; }
.auth-sub { font-size: 14px; color: var(--text-muted); margin: 0 0 28px; line-height: 1.5; }

.auth-field { margin-bottom: 16px; }
.auth-label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 7px; }
.auth-input-wrap { position: relative; }
.auth-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
.auth-input { padding-left: 36px; }
.auth-input-pw { padding-right: 40px; }
.auth-otp { letter-spacing: 4px; font-size: 16px; }
.auth-eye {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0; display: flex;
}

.auth-error {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(239,68,68,0.10); border: 1px solid rgba(239,68,68,0.28);
  border-radius: 10px; padding: 10px 12px; margin-bottom: 18px;
}
.auth-error span { font-size: 13px; color: #ef4444; }
.auth-error-icon { color: #ef4444; margin-top: 1px; flex-shrink: 0; }

.auth-submit {
  width: 100%; height: 44px; margin-top: 4px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: #1a1208; border: none; border-radius: 11px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 6px 18px rgba(247,143,30,0.28);
  transition: opacity 150ms, transform 80ms, box-shadow 150ms;
}
.auth-submit:disabled { opacity: 0.55; box-shadow: none; cursor: not-allowed; }
.auth-back { width: 100%; margin-top: 12px; background: none; border: none; color: var(--text-muted); font-size: 12.5px; cursor: pointer; padding: 6px; }

.auth-theme-row { margin-top: 26px; display: flex; justify-content: center; }
.auth-theme { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 6px 10px; border-radius: 8px; transition: background 120ms; }
.auth-theme:hover { background: var(--border); }

/* ── RESPONSIVE ──────────────────────────────── */
@media (max-width: 900px) {
  .auth { grid-template-columns: 1fr; }
  .auth-brand { display: none; }
  .auth-logo-m { display: flex; }
}
</style>
