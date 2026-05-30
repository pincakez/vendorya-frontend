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
    <!-- Animated wave background -->
    <div class="wave-bg" aria-hidden="true">
      <div class="wave-base"></div>
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" class="wave wave-1">
        <defs>
          <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#f78f1e" stop-opacity="0" />
            <stop offset="50%"  stop-color="#f78f1e" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#f78f1e" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,200 C300,350 400,50 600,200 C800,350 900,50 1000,200 L1000,400 L0,400 Z" fill="url(#wg1)" opacity="0.3"/>
        <path d="M0,200 C300,350 400,50 600,200 C800,350 900,50 1000,200" fill="none" stroke="#f78f1e" stroke-width="3" opacity="0.9"/>
      </svg>
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" class="wave wave-2">
        <defs>
          <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#ffffff" stop-opacity="0" />
            <stop offset="50%"  stop-color="#f78f1e" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,200 C200,50 400,350 700,200 C900,100 950,250 1000,200 L1000,400 L0,400 Z" fill="url(#wg2)" opacity="0.2"/>
        <path d="M0,200 C200,50 400,350 700,200 C900,100 950,250 1000,200" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5"/>
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

          <!-- Security notice -->
          <div class="security-notice">
            <ShieldCheck :size="14" class="notice-icon" />
            <span class="notice-label">Auth Gateway Active</span>
            <span class="notice-sub">Secure tunnel connected to primary node. Clearance required.</span>
          </div>

          <!-- Form area -->
          <form @submit.prevent="step === 'otp' ? handleOtp() : handleLogin()">
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
              :disabled="loading || (step === 'credentials' && (!form.username || !form.password)) || (step === 'otp' && !otp)"
            >
              <div class="btn-shimmer" aria-hidden="true"></div>
              <Loader2 v-if="loading" :size="18" class="spin" />
              <span>{{ loading ? 'Verifying...' : 'Authenticate' }}</span>
              <ArrowRight v-if="!loading" :size="18" class="btn-arrow" />
            </button>
          </form>

          <!-- Theme toggle -->
          <div class="theme-row">
            <button @click="theme.toggle()" class="theme-btn">
              <Sun v-if="theme.dark" :size="12" />
              <Moon v-else :size="12" />
              {{ theme.dark ? 'Light mode' : 'Dark mode' }}
            </button>
          </div>

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
import { Mail, Lock, Eye, EyeOff, Key, ArrowRight, ShieldCheck, AlertCircle, Loader2, Sun, Moon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const theme  = useThemeStore()

const logoSrc = '/logo-text-dark-mode.png'

// ── form state ───────────────────────────────────────────
const form         = ref({ username: '', password: '' })
const showPassword = ref(false)
const loading      = ref(false)
const error        = ref('')
const step         = ref('credentials') // 'credentials' | 'otp'
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
    title: 'AI that runs the back office with you',
    desc:  'Vendorya ships with a built-in AI admin that understands your stock, your invoices, and your numbers. Ask it a question, give it a task, and watch it work — like having an accountant and an analyst on staff. It doesn\'t replace you; it makes one person move like a whole team.'
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
    return goHome()
  } catch (err) {
    error.value = mapError(err, 'Server error. Please try again.')
  } finally {
    loading.value = false
  }
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
/* ── root & background ──────────────────────────────────── */
.login-root {
  position: relative;
  min-height: 100vh;
  background: #0F0F12;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.wave-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.wave-base {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, #0F0F12, #121216, #0A0A0C);
}
.wave {
  position: absolute;
  width: 220vw;
  height: 140vh;
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
  background: rgba(15,15,18,0.40);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-right: 1px solid rgba(255,255,255,0.06);
  box-shadow: 20px 0 100px rgba(0,0,0,0.3);
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
.notice-icon  { color: #f78f1e; }
.notice-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f78f1e;
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
  border-color: #f78f1e;
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
  color: #f78f1e;
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
  background: rgba(239,68,68,0.10);
  border: 1px solid rgba(239,68,68,0.28);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 18px;
  color: #ef4444;
  font-size: 13px;
}

/* ── submit button ──────────────────────────────────────── */
.submit-btn {
  position: relative;
  width: 100%;
  padding: 15px;
  border-radius: 12px;
  background: #f78f1e;
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

/* ── theme toggle ───────────────────────────────────────── */
.theme-row { display: flex; justify-content: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.07); }
.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(161,161,170,0.6);
  font-size: 11px;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 8px;
  transition: color 120ms, background 120ms;
}
.theme-btn:hover { color: #a1a1aa; background: rgba(255,255,255,0.05); }

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
  color: #f78f1e;
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
