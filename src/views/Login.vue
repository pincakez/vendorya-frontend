<template>
  <!-- Support Modal -->
  <Transition name="modal-fade">
    <div v-if="showSupportModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">
        <h3 class="modal-title">Lost your access info?</h3>
        <p class="modal-body">
          The only way to recover your access is to contact our support team to verify your identity.
          We will help you restore your access securely.
        </p>
        <p class="modal-phone">+201552500526</p>
        <button @click="closeModal" class="modal-btn">Okay, I understand</button>
      </div>
    </div>
  </Transition>

  <div class="login-root">
    <!-- Animated background — large soft glows + faint wave lines -->
    <div class="wave-bg" aria-hidden="true">
      <!-- Soft glow orbs -->
      <div class="glow-orb glow-orb-a"></div>
      <div class="glow-orb glow-orb-b"></div>
      <div class="glow-orb glow-orb-c"></div>
      <!-- Faint wave lines: wave-1 = orange, wave-2 = light grey -->
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" class="wave wave-1">
        <path d="M0,200 C300,350 400,50 600,200 C800,350 900,50 1000,200" fill="none" style="stroke: var(--accent)" stroke-width="2" opacity="0.40"/>
      </svg>
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" class="wave wave-2">
        <path d="M0,200 C200,50 400,350 700,200 C900,100 950,250 1000,200" fill="none" stroke="#c0c0c8" stroke-width="1.5" opacity="0.22"/>
      </svg>
    </div>

    <!-- Main layout -->
    <div class="login-layout">

      <!-- LEFT: glass form pane -->
      <div class="form-pane">
        <div class="form-inner">

          <!-- Logo — swap logoSrc to '/logo.png' when Yakot provides the file -->
          <div class="logo-wrap">
            <img :src="logoSrc" alt="Vendorya" class="logo-img" />
          </div>

          <!-- Language toggle (pre-login, client-side only) -->
          <div class="lang-toggle">
            <button
              class="lang-btn" :class="{ active: locale === 'en' }"
              @click="toggleLocale" :disabled="locale === 'en'"
            >EN</button>
            <span class="lang-sep">|</span>
            <button
              class="lang-btn" :class="{ active: locale === 'ar' }"
              @click="toggleLocale" :disabled="locale === 'ar'"
            >AR</button>
          </div>

          <!-- Security notice -->
          <div class="security-notice">
            <ShieldCheck :size="14" class="notice-icon" />
            <span class="notice-label">Auth Gateway Active</span>
            <span class="notice-sub">Secure tunnel connected to primary node. Clearance required.</span>
          </div>

          <!-- Form area -->
          <form @submit.prevent="onSubmit">
            <div class="form-fields">
              <Transition name="field-switch" mode="out-in">

                <!-- Credentials view -->
                <div v-if="step === 'credentials'" key="creds" class="fields-inner">
                  <div class="field-group">
                    <div class="field-header">
                      <label class="field-label">Email or username</label>
                      <button type="button" class="link-btn" @click="handleUseAuthenticator">USE AUTHENTICATOR</button>
                    </div>
                    <div class="input-wrap">
                      <Mail :size="18" class="input-icon" />
                      <input
                        v-model="form.username"
                        type="text"
                        class="login-input"
                        placeholder="Ex: ops@company.com"
                        autocomplete="username"
                        :disabled="loading"
                      />
                    </div>
                  </div>

                  <div class="field-group">
                    <div class="field-header">
                      <label class="field-label">Access Password</label>
                      <button type="button" class="link-btn link-muted" @click="showSupportModal = true">Recover</button>
                    </div>
                    <div class="input-wrap">
                      <Lock :size="18" class="input-icon" />
                      <input
                        v-model="form.password"
                        :type="showPassword ? 'text' : 'password'"
                        class="login-input login-input-pw"
                        placeholder="••••••••"
                        autocomplete="current-password"
                        :disabled="loading"
                      />
                      <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                        <Eye v-if="!showPassword" :size="16" />
                        <EyeOff v-else :size="16" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- s174: an OWNER's one-time authenticator setup (required for owners) -->
                <div v-else-if="step === 'setup'" key="setup" class="fields-inner">
                  <div class="setup-title">Protect your owner account</div>
                  <p class="setup-text">Owner accounts sign in with Google Authenticator. Open it on your phone, tap <b>+</b>, scan this code, then type the 6-digit code it shows.</p>
                  <img v-if="setup.qr" :src="setup.qr" class="setup-qr" alt="Authenticator QR code" />
                  <Loader2 v-else :size="22" class="spin setup-wait" />
                  <div v-if="setup.secret" class="setup-secret">Can't scan? Type this key: <code>{{ setup.secret }}</code></div>
                  <div class="input-wrap">
                    <Key :size="18" class="input-icon" />
                    <input v-model="otp" type="text" inputmode="numeric" class="login-input login-input-otp setup-code"
                           placeholder="000000" maxlength="6" autocomplete="one-time-code" :disabled="loading" />
                  </div>
                </div>

                <!-- s174: the 10 backup codes, shown once -->
                <div v-else-if="step === 'backup'" key="backup" class="fields-inner">
                  <div class="setup-title">Save your backup codes</div>
                  <p class="setup-text">Each code works once, if your phone is lost or broken. Write them down or keep them somewhere safe — they are not shown again.</p>
                  <div class="backup-grid"><code v-for="c in backupCodes" :key="c">{{ c }}</code></div>
                  <button type="button" class="link-btn" @click="copyCodes">{{ copied ? 'Copied ✓' : 'Copy all' }}</button>
                </div>

                <!-- Authenticator / OTP view -->
                <div v-else key="otp" class="fields-inner">
                  <div class="otp-back-row">
                    <button type="button" class="link-btn" @click="resetToCredentials">Try another way?</button>
                  </div>
                  <div class="field-group field-group-center">
                    <label class="field-label">Enter your Authenticator code</label>
                    <div class="input-wrap">
                      <Key :size="18" class="input-icon" />
                      <input
                        v-model="otp"
                        type="text"
                        inputmode="numeric"
                        class="login-input login-input-otp"
                        placeholder="000 000"
                        maxlength="7"
                        autocomplete="one-time-password"
                        :disabled="loading"
                        autofocus
                      />
                    </div>
                  </div>
                </div>

              </Transition>
            </div>

            <!-- Error -->
            <div v-if="error" class="login-error">
              <AlertCircle :size="14" />
              <span>{{ error }}</span>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="submit-btn"
              :disabled="loading || (step === 'credentials' && (!form.username || !form.password)) || (step === 'otp' && !otp) || (step === 'setup' && otp.length < 6)"
            >
              <div class="btn-shimmer" aria-hidden="true"></div>
              <Loader2 v-if="loading" :size="18" class="spin" />
              <span>{{ loading ? 'Verifying...' : step === 'backup' ? "I saved them — continue" : step === 'setup' ? 'Turn on and sign in' : 'Authenticate' }}</span>
              <ArrowRight v-if="!loading" :size="18" class="btn-arrow" />
            </button>
          </form>


        </div>
      </div>

      <!-- RIGHT: slideshow -->
      <div class="slide-pane">
        <div class="slide-track">
          <TransitionGroup name="slide-fade">
            <div
              v-for="(slide, i) in slides"
              :key="i"
              v-show="currentSlide === i"
              class="slide"
            >
              <h2 class="slide-title">{{ slide.title }}</h2>
              <p class="slide-body">{{ slide.desc }}</p>
            </div>
          </TransitionGroup>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, Key, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'

const { locale } = useI18n()

function toggleLocale() {
  const next = locale.value === 'en' ? 'ar' : 'en'
  locale.value = next
  localStorage.setItem('vendorya_locale', next)
}

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const logoSrc = '/logo-text-dark-mode.png'

// ── form state ───────────────────────────────────────────
const form         = ref({ username: '', password: '' })
const showPassword = ref(false)
const loading      = ref(false)
const error        = ref('')
const step         = ref('credentials') // 'credentials' | 'otp' | 'setup' | 'backup' (s174: owner's authenticator setup)
const otp          = ref('')

// ── support modal + USE AUTHENTICATOR counter ────────────
const showSupportModal      = ref(false)
const useAuthenticatorCount = ref(0)

function handleUseAuthenticator() {
  if (useAuthenticatorCount.value >= 1) {
    showSupportModal.value = true
  } else {
    useAuthenticatorCount.value++
    step.value  = 'otp'
    error.value = ''
  }
}

function closeModal() {
  showSupportModal.value      = false
  useAuthenticatorCount.value = 0   // reset so the full flow can restart
}

// ── slideshow ────────────────────────────────────────────
const slides = [
  {
    title: 'Money you can trust, down to the last pound',
    desc:  'Split a payment between cash, card and store credit at the till. Print a customer or supplier statement in one click. Every return is checked against what was really sold and paid, so your drawer, your stock and every balance stay right — without an accountant chasing the numbers.'
  },
  {
    title: 'Built for the Egyptian store, down to the last detail',
    desc:  'Vendorya was made to suit every Egyptian store — from the corner shop in Port Said to the showroom in Cairo. Arabic-friendly, EGP-native, and tuned to how business is actually done here. No more bending a foreign system to fit your reality; this one already speaks your market.'
  },
  {
    title: 'Inventory that never lies to you',
    desc:  'Every laptop, every accessory, every spare part — tracked the moment it moves. Stock only changes through purchase, sale, or a logged correction, so your numbers are always real. Dynamic attributes let you organize by RAM, storage, brand, or anything your catalog needs.'
  },
  {
    title: 'One system for every kind of shop in Egypt',
    desc:  'Whether you sell electronics, clothes, or groceries, Vendorya bends to your store — because it was built to suit every Egyptian store, not just one. Custom product attributes, flexible roles, and a point-of-sale that\'s fast at the counter. Your business is unique; your system finally is too.'
  },
  {
    title: 'Sell, invoice, and stay in control',
    desc:  'Ring up a sale at the POS and the invoice, the stock, and the books all update together in one breath. Sequential, human-readable invoice numbers keep everything clean for you and your customers. Role-based access means cashiers, managers, and owners each see exactly what they should — nothing more.'
  }
]
const currentSlide = ref(0)
let   slideTimer   = null

onMounted(() => {
  if (route.query.idle) error.value = 'You were signed out due to inactivity.'
  slideTimer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 12000)
})

onUnmounted(() => clearInterval(slideTimer))

// ── auth logic (unchanged) ───────────────────────────────
function resetToCredentials() {
  pendingLogin = null; backupCodes.value = []
  step.value  = 'credentials'
  otp.value   = ''
  error.value = ''
}

function mapError(err, fallback) {
  const status = err.response?.status
  if (!navigator.onLine)  return 'No internet connection.'
  if (status === 400)     return err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid username or password.'
  if (status === 401)     return 'Invalid username or password.'
  if (status === 403)     return err.response?.data?.detail || 'Login not allowed from this location.'
  if (status === 429)     return err.response?.data?.detail || 'Too many attempts. Please wait and try again.'
  if (status >= 500)      return 'The server encountered an error. Please try again in a moment.'
  if (!status)            return 'Cannot reach the server. Check your connection.'
  return fallback
}

function goHome() {
  router.push(auth.isSuperadmin ? '/admin/dashboard' : '/dashboard')
}

async function handleLogin() {
  if (!form.value.username || !form.value.password) return
  error.value   = ''
  loading.value = true
  try {
    const res = await auth.login(form.value.username, form.value.password)
    if (res.status === 'requires_2fa') { step.value = 'otp'; return }
    if (res.status === 'requires_setup') { await startSetup(res.preAuth); return }
    return goHome()
  } catch (err) {
    error.value = mapError(err, 'Server error. Please try again.')
  } finally {
    loading.value = false
  }
}

function onSubmit() {
  if (step.value === 'otp') return handleOtp()
  if (step.value === 'setup') return verifySetup()
  if (step.value === 'backup') return finishSetup()
  return handleLogin()
}

// ── s174: owners must use an authenticator — the one-time setup, with the short pass the login gave ──
const setup       = ref({ preAuth: '', qr: '', secret: '' })
const backupCodes = ref([])
const copied      = ref(false)
let   pendingLogin = null
const preAuthHeaders = () => ({ headers: { Authorization: `Bearer ${setup.value.preAuth}` } })

async function startSetup(preAuth) {
  setup.value = { preAuth, qr: '', secret: '' }
  otp.value = ''; error.value = ''; step.value = 'setup'
  const res = await api.post('/api/auth/2fa/setup/', {}, preAuthHeaders())
  let secret = ''
  try { secret = new URL(res.data.otpauth_url).searchParams.get('secret') || '' } catch { /* the QR is enough */ }
  setup.value = { preAuth, qr: res.data.qr, secret: secret.replace(/(.{4})/g, '$1 ').trim() }
}

async function verifySetup() {
  if (otp.value.length < 6) return
  error.value = ''; loading.value = true
  try {
    const res = await api.post('/api/auth/2fa/verify-setup/', { token: otp.value.trim() }, preAuthHeaders())
    pendingLogin = res.data
    backupCodes.value = res.data.backup_codes || []
    step.value = 'backup'
  } catch (err) {
    error.value = err.response?.status === 401
      ? 'The setup took too long — sign in again.'
      : (err.response?.data?.detail || 'Wrong code — try the newest one in the app.')
    otp.value = ''
  } finally { loading.value = false }
}

function finishSetup() {
  if (!pendingLogin?.access) return resetToCredentials()
  auth.completeLogin(pendingLogin)
  pendingLogin = null
  goHome()
}

async function copyCodes() {
  try { await navigator.clipboard.writeText(backupCodes.value.join('\n')); copied.value = true } catch { copied.value = false }
}

async function handleOtp() {
  if (!otp.value) return
  error.value   = ''
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
/* s174: the owner's authenticator setup + backup codes */
.setup-title { font-size: 17px; font-weight: 800; color: #fff; }
.setup-text { margin: 0; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.7); }
.setup-qr { width: 168px; height: 168px; align-self: center; border-radius: 12px; background: #fff; padding: 8px; }
.setup-wait { align-self: center; color: rgba(255, 255, 255, 0.6); }
.setup-secret { font-size: 12px; color: rgba(255, 255, 255, 0.6); text-align: center; }
.setup-secret code { color: #fff; letter-spacing: 0.06em; user-select: all; }
.backup-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 14px; }
.backup-grid code { font-size: 14px; letter-spacing: 0.08em; color: #fff; text-align: center; padding: 6px; border-radius: 8px;
  background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.12); user-select: all; }
/* ── root & background ──────────────────────────────────── */
.login-root {
  position: fixed;
  inset: 0;
  background: #0F0F12;
  /* clip-path instead of overflow:hidden — overflow:hidden kills backdrop-filter */
  clip-path: inset(0);
  display: flex;
  flex-direction: column;
}

.wave-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(135deg, #0F0F12 0%, #121216 60%, #0A0A0C 100%);
  opacity: 0.6;
}

/* Large soft glowing orbs — wide spread, very low opacity */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}
.glow-orb-a {
  width: 700px;
  height: 700px;
  background: radial-gradient(ellipse, rgba(247,143,30,0.22) 0%, transparent 70%);
  top: -200px;
  right: -100px;
  animation: orbDrift1 22s ease-in-out infinite alternate;
}
.glow-orb-b {
  width: 600px;
  height: 600px;
  background: radial-gradient(ellipse, rgba(247,143,30,0.16) 0%, transparent 70%);
  bottom: -150px;
  left: 10%;
  animation: orbDrift2 28s ease-in-out infinite alternate-reverse;
}
.glow-orb-c {
  width: 500px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%);
  top: 40%;
  left: 30%;
  animation: orbDrift3 18s ease-in-out infinite alternate;
}

@keyframes orbDrift1 {
  0%   { transform: translate(0,    0)    scale(1);    }
  50%  { transform: translate(-60px, 80px) scale(1.1); }
  100% { transform: translate(40px, -40px) scale(0.95); }
}
@keyframes orbDrift2 {
  0%   { transform: translate(0,    0)    scale(1);    }
  50%  { transform: translate(80px, -60px) scale(1.15); }
  100% { transform: translate(-30px, 50px) scale(0.9);  }
}
@keyframes orbDrift3 {
  0%   { transform: translate(0, 0)    scale(1);   }
  100% { transform: translate(40px, 30px) scale(1.2); }
}

/* Faint wave lines */
.wave {
  position: absolute;
  width: 220vw;
  height: 140vh;
  top: -20vh;
  left: -60vw;
}
.wave-1 { animation: waveMotion1 20s cubic-bezier(.4,0,.2,1) infinite alternate; }
.wave-2 { width: 180vw; height: 120vh; animation: waveMotion2 25s cubic-bezier(.4,0,.2,1) infinite alternate-reverse; }

@keyframes waveMotion1 {
  0%   { transform: translateY(5%)  scaleY(1)    scaleX(1.1) translateX(-5%); }
  50%  { transform: translateY(-5%) scaleY(1.05) scaleX(1.05) translateX(2%); }
  100% { transform: translateY(5%)  scaleY(0.95) scaleX(1.1) translateX(-5%); }
}
@keyframes waveMotion2 {
  0%   { transform: translateY(-8%) scaleY(1)   scaleX(1.1) translateX(5%); }
  50%  { transform: translateY(4%)  scaleY(1.1) scaleX(1)   translateX(-2%); }
  100% { transform: translateY(-8%) scaleY(0.9) scaleX(1.1) translateX(5%); }
}

/* ── layout ─────────────────────────────────────────────── */
.login-layout {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* ── left form pane ─────────────────────────────────────── */
.form-pane {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  /* Enough transparency to let glow show through, strong blur for glass feel */
  background: rgba(10,10,12,0.55);
  backdrop-filter: blur(48px) saturate(140%);
  -webkit-backdrop-filter: blur(48px) saturate(140%);
  border-right: 1px solid rgba(247,143,30,0.08);
  box-shadow: inset -1px 0 0 rgba(247,143,30,0.06), 20px 0 80px rgba(0,0,0,0.5);
  z-index: 20;
}
.form-inner {
  width: 100%;
  max-width: 440px;
}

/* ── logo ───────────────────────────────────────────────── */
.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  min-height: 56px;
  align-items: center;
}
.logo-img {
  max-height: 56px;
  max-width: 240px;
  object-fit: contain;
}

/* ── language toggle ────────────────────────────────────── */
.lang-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 20px;
}
.lang-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-family: ui-monospace, monospace;
  color: #71717a;
  padding: 2px 0;
  transition: color 120ms;
}
.lang-btn:hover:not(:disabled) { color: var(--accent); }
.lang-btn.active { color: var(--accent); cursor: default; }
.lang-sep { font-size: 11px; color: #3f3f46; }

/* ── security notice ────────────────────────────────────── */
.security-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(247,143,30,0.08);
  border: 1px solid rgba(247,143,30,0.18);
  margin-bottom: 36px;
  cursor: default;
  transition: background 150ms;
}
.security-notice:hover { background: rgba(247,143,30,0.14); }
.notice-icon  { color: var(--accent); }
.notice-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  font-family: ui-monospace, monospace;
}
.notice-sub {
  font-size: 12.5px;
  color: #a1a1aa;
  line-height: 1.5;
}

/* ── form fields ────────────────────────────────────────── */
.form-fields {
  min-height: 190px;
  position: relative;
  margin-bottom: 24px;
}
.fields-inner { display: flex; flex-direction: column; gap: 22px; }

.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-group-center { align-items: center; text-align: center; }

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #a1a1aa;
}

.otp-back-row {
  display: flex;
  justify-content: center;
  padding-bottom: 8px;
}

/* ── inputs ─────────────────────────────────────────────── */
.input-wrap { position: relative; }
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a1a1aa;
  pointer-events: none;
}
.login-input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  border-radius: 12px;
  background: rgba(10,10,12,0.80);
  border: 1px solid #27272A;
  color: #fafafa;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
}
.login-input::placeholder { color: rgba(161,161,170,0.45); }
.login-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 20px rgba(247,143,30,0.35);
}
.login-input:disabled { opacity: 0.55; cursor: not-allowed; }
.login-input-pw  { padding-right: 44px; }
.login-input-otp {
  padding-left: 44px;
  font-size: 22px;
  letter-spacing: 0.35em;
  font-family: ui-monospace, monospace;
  text-align: center;
}

.eye-btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #a1a1aa;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 120ms;
}
.eye-btn:hover { color: #fafafa; }

/* ── link buttons ───────────────────────────────────────── */
.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: ui-monospace, monospace;
  color: var(--accent);
  padding: 0;
  transition: color 120ms;
}
.link-btn:hover  { color: #ff9d2e; }
.link-muted      { color: #a1a1aa; font-weight: 600; text-transform: none; letter-spacing: 0; }
.link-muted:hover { color: #fafafa; }

/* ── error ──────────────────────────────────────────────── */
.login-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--danger-soft);
  border: 1px solid rgba(239,68,68,0.28);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 18px;
  color: var(--danger);
  font-size: 13px;
}

/* ── submit button ──────────────────────────────────────── */
.submit-btn {
  position: relative;
  width: 100%;
  padding: 15px;
  border-radius: 12px;
  background: var(--accent);
  border: none;
  color: #0F0F12;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: ui-monospace, monospace;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  box-shadow: 0 0 18px rgba(247,143,30,0.35);
  transition: background 150ms, box-shadow 150ms, transform 80ms, opacity 150ms;
}
.submit-btn:hover:not(:disabled) {
  background: #ff9d2e;
  box-shadow: 0 0 28px rgba(247,143,30,0.55);
}
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

.btn-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: translateX(-150%);
  transition: none;
  pointer-events: none;
}
.submit-btn:hover:not(:disabled) .btn-shimmer {
  transform: translateX(150%);
  transition: transform 900ms ease-in-out;
}
.btn-arrow { transition: transform 150ms; }
.submit-btn:hover:not(:disabled) .btn-arrow { transform: translateX(3px); }


/* ── right slideshow pane ───────────────────────────────── */
.slide-pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 64px;
  z-index: 10;
}
.slide-track {
  position: relative;
  width: 100%;
  max-width: 520px;
  height: 360px;
}
.slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.slide-title {
  font-size: clamp(28px, 3.5vw, 44px);
  font-weight: 500;
  color: #ffffff;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 28px;
  text-shadow: 0 4px 12px rgba(0,0,0,0.8);
}
.slide-body {
  font-size: clamp(15px, 1.6vw, 20px);
  color: rgba(255,255,255,0.92);
  line-height: 1.65;
  font-weight: 400;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
}

/* ── support modal ──────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15,15,18,0.80);
  backdrop-filter: blur(6px);
}
.modal-box {
  background: #18181A;
  border: 1px solid #27272A;
  border-radius: 20px;
  padding: 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 0 60px rgba(0,0,0,0.6);
}
.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #fafafa;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.modal-body {
  font-size: 14px;
  color: #a1a1aa;
  line-height: 1.6;
  margin: 0 0 20px;
}
.modal-phone {
  font-size: 18px;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  color: var(--accent);
  text-align: center;
  padding: 14px;
  border: 1px solid rgba(247,143,30,0.2);
  border-radius: 10px;
  background: rgba(10,10,12,0.5);
  margin: 0 0 24px;
}
.modal-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #18181A;
  border: 1px solid #27272A;
  color: #fafafa;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms, border-color 120ms;
}
.modal-btn:hover { background: #27272A; border-color: #3f3f46; }

/* ── spin ───────────────────────────────────────────────── */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

/* ── transitions ────────────────────────────────────────── */
.field-switch-enter-active,
.field-switch-leave-active  { transition: opacity 0.25s ease, transform 0.25s ease; }
.field-switch-enter-from    { opacity: 0; transform: translateY(10px); }
.field-switch-leave-to      { opacity: 0; transform: translateY(-10px); }

.slide-fade-enter-active,
.slide-fade-leave-active  { transition: opacity 0.8s ease, transform 0.8s ease; }
.slide-fade-enter-from    { opacity: 0; transform: translateY(20px) scale(0.98); }
.slide-fade-leave-to      { opacity: 0; transform: translateY(-20px) scale(0.98); }

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to     { opacity: 0; }

/* ── responsive ─────────────────────────────────────────── */
@media (max-width: 900px) {
  .form-pane  { width: 100%; border-right: none; backdrop-filter: blur(20px); }
  .slide-pane { display: none; }
}
</style>
