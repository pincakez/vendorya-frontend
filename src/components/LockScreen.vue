<template>
  <Teleport to="body">
    <Transition name="ls">
      <div v-if="visible" class="ls-backdrop" @click.self="handleBackdropClick">
        <div class="ls-card" :class="{ 'ls-card--exit': exiting }">

          <!-- Lock / unlock icon -->
          <div class="ls-icon-wrap" :class="{ 'ls-icon--shake': shake }">
            <component :is="pinMode ? LockOpen : Lock" :size="20" class="ls-icon" />
          </div>

          <!-- Logo + animated shadow -->
          <div class="ls-logo-area">
            <div class="ls-logo-shadow" />
            <img v-if="logoUrl" :src="logoUrl" class="ls-logo" alt="Store logo" />
            <div v-else class="ls-logo-fallback">
              <Store :size="52" />
            </div>
          </div>

          <!-- PIN hint -->
          <div class="ls-hint">
            <span v-if="!pinMode" class="ls-hint-text">{{ t('lockscreen.press_enter') }}</span>
            <span v-else class="ls-hint-text ls-hint-text--active">
              {{ t('lockscreen.entering_pin') }}
              <span class="ls-dots">
                <span v-for="_ in pinBuffer.length" :key="_" class="ls-dot" />
              </span>
            </span>
            <span v-if="pinError" class="ls-error">{{ t('lockscreen.wrong_pin') }}</span>
          </div>

          <!-- Fun fact -->
          <div v-if="fact" class="ls-fact">
            <span class="ls-fact-star">✦</span>
            <p class="ls-fact-text">{{ isAr ? fact.ar : fact.en }}</p>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Lock, LockOpen, Store } from 'lucide-vue-next'
import { useLockscreen } from '@/composables/useLockscreen'
import api from '@/api/axios'

const { locale, t } = useI18n()
const route = useRoute()
const { isLocked, settings, unlock, pickFact } = useLockscreen()

const isAr     = computed(() => locale.value === 'ar')
const logoUrl  = computed(() => settings.value.lock_logo_url)

// Only show on non-login pages
const visible = computed(() => isLocked.value && route.path !== '/login')

// PIN state
const pinMode   = ref(false)   // true = accepting digits
const pinBuffer = ref('')
const shake     = ref(false)
const pinError  = ref(false)
const exiting   = ref(false)
const fact      = ref(null)

watch(visible, (v) => {
  if (v) {
    pinMode.value   = false
    pinBuffer.value = ''
    shake.value     = false
    pinError.value  = false
    exiting.value   = false
    fact.value      = pickFact(null)  // null storeId = no seen-tracking needed for now
  }
})

function handleBackdropClick() { /* lock screen doesn't dismiss on backdrop click */ }

async function submitPin() {
  const pin = pinBuffer.value
  pinBuffer.value = ''

  // No PIN set on server → just unlock
  if (!settings.value.lock_pin_set) {
    doUnlock(); return
  }

  try {
    const res = await api.post('/api/core/lockscreen/pin/', { action: 'verify', pin })
    if (res.data.valid) {
      doUnlock()
    } else {
      triggerShake()
    }
  } catch {
    triggerShake()
  }
}

function doUnlock() {
  exiting.value = true
  setTimeout(() => {
    unlock()
    exiting.value   = false
    pinMode.value   = false
    pinBuffer.value = ''
  }, 500)
}

function triggerShake() {
  pinError.value = true
  shake.value    = true
  setTimeout(() => { shake.value = false; pinError.value = false; pinMode.value = false }, 800)
}

function onKeydown(e) {
  if (!visible.value) return
  e.stopPropagation()

  if (!pinMode.value) {
    if (e.key === 'Enter') { pinMode.value = true; pinBuffer.value = '' }
    return
  }

  if (e.key === 'Enter') {
    if (pinBuffer.value.length >= 4) submitPin()
    else triggerShake()
    return
  }
  if (e.key === 'Escape') { pinMode.value = false; pinBuffer.value = ''; return }
  if (e.key === 'Backspace') { pinBuffer.value = pinBuffer.value.slice(0, -1); return }
  if (/^\d$/.test(e.key) && pinBuffer.value.length < 6) {
    pinBuffer.value += e.key
    if (pinBuffer.value.length === 6) submitPin()  // auto-submit at max length
  }
}

onMounted(()   => window.addEventListener('keydown', onKeydown, { capture: true }))
onUnmounted(() => window.removeEventListener('keydown', onKeydown, { capture: true }))
</script>

<style scoped>
/* ── Backdrop ─────────────────────────────────────────────────────── */
.ls-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(22px) saturate(1.2);
  -webkit-backdrop-filter: blur(22px) saturate(1.2);
}

/* ── Glass card ───────────────────────────────────────────────────── */
.ls-card {
  width: min(520px, 90vw);
  padding: 48px 40px 36px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
}

.ls-card--exit {
  transform: scale(0.88);
  opacity: 0;
  filter: blur(6px);
}

/* ── Lock icon ────────────────────────────────────────────────────── */
.ls-icon-wrap {
  color: rgba(255,255,255,0.7);
  display: flex;
  transition: color 0.2s;
}
.ls-icon-wrap:has(.lucide-lock-open) { color: rgba(255,255,255,0.95); }

@keyframes lsShake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
.ls-icon--shake { animation: lsShake 0.4s ease; }

/* ── Logo area ────────────────────────────────────────────────────── */
.ls-logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
}

.ls-logo {
  max-width: 160px;
  max-height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
}

.ls-logo-fallback {
  color: rgba(255,255,255,0.5);
  display: flex;
}

/* Wandering shadow */
@keyframes shadowWander {
  0%   { transform: translate(0px, 0px)   scale(1.00); }
  12%  { transform: translate(9px, 5px)   scale(1.06); }
  28%  { transform: translate(4px, -7px)  scale(0.96); }
  40%  { transform: translate(-8px, 3px)  scale(1.03); }
  52%  { transform: translate(-8px, 3px)  scale(1.03); } /* pause */
  66%  { transform: translate(6px, 9px)   scale(1.05); }
  79%  { transform: translate(-4px, -5px) scale(0.97); }
  88%  { transform: translate(-4px, -5px) scale(0.97); } /* pause */
  100% { transform: translate(0px, 0px)   scale(1.00); }
}

.ls-logo-shadow {
  width: 110px;
  height: 18px;
  background: rgba(0, 0, 0, 0.25);
  filter: blur(14px);
  border-radius: 50%;
  animation: shadowWander 9s ease-in-out infinite;
  order: 1; /* shows below logo in flex column */
}

.ls-logo-area .ls-logo,
.ls-logo-area .ls-logo-fallback { order: 0; }

/* ── PIN hint ─────────────────────────────────────────────────────── */
.ls-hint { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }

.ls-hint-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ls-hint-text--active { color: rgba(255,255,255,0.8); }

.ls-dots { display: flex; gap: 5px; }
.ls-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: rgba(255,255,255,0.75);
  animation: dotPop 0.15s ease;
}
@keyframes dotPop { from { transform: scale(0); } to { transform: scale(1); } }

.ls-error {
  font-size: 12px;
  color: #ff6b6b;
  animation: lsShake 0.4s ease;
}

/* ── Fact ─────────────────────────────────────────────────────────── */
.ls-fact {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px;
  max-width: 100%;
}

.ls-fact-star {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  flex-shrink: 0;
  padding-top: 2px;
}

.ls-fact-text {
  font-size: 12.5px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.62);
  margin: 0;
}

/* ── Transitions ──────────────────────────────────────────────────── */
.ls-enter-active { transition: opacity 0.3s ease, backdrop-filter 0.3s ease; }
.ls-leave-active { transition: opacity 0.5s ease; }
.ls-enter-from, .ls-leave-to { opacity: 0; }
.ls-enter-from .ls-card { transform: scale(0.96); }
</style>
