<template>
  <Teleport to="body">
    <Transition name="ols">
      <div v-if="prompt" class="ols-backdrop" @click.self="close">
        <form class="ols-card" :class="{ 'ols-card--exit': exiting }" @submit.prevent="submit">

          <div class="ols-icon" :class="{ 'ols-icon--shake': shake }">
            <component :is="exiting ? LockOpen : Lock" :size="22" />
          </div>
          <div class="ols-title">{{ t('finance.owner.lock.title') }}</div>

          <template v-if="status && !status.enrolled">
            <p class="ols-text">{{ t('finance.owner.lock.setup_first') }}</p>
            <button type="button" class="ols-btn" @click="goSetup">{{ t('finance.owner.lock.setup_btn') }}</button>
          </template>
          <template v-else>
            <p class="ols-text">{{ t('finance.owner.lock.hint') }}</p>
            <input
              ref="input" v-model="code" class="ols-input" dir="ltr"
              inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="••••••"
              :aria-label="t('finance.owner.lock.hint')"
              @input="code = code.replace(/\D/g, '')"
            />
            <span v-if="error" class="ols-error">{{ error }}</span>
            <button type="submit" class="ols-btn" :disabled="busy || code.length < 6">{{ t('finance.owner.lock.open_btn') }}</button>
          </template>

          <button type="button" class="ols-cancel" @click="close">{{ t('finance.owner.lock.cancel') }}</button>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// s174: the code prompt for "My private accounts" — the same blurred glass as the app's lock screen (LockScreen.vue), but
// it asks the OWNER's authenticator code (never the shop PIN the staff know) and can be cancelled.
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Lock, LockOpen } from 'lucide-vue-next'
import { useOwnerLock } from '@/composables/useOwnerLock'

const { t } = useI18n()
const router = useRouter()
const { status, prompt, pending, cancel, openWithCode } = useOwnerLock()

const code    = ref('')
const error   = ref('')
const busy    = ref(false)
const shake   = ref(false)
const exiting = ref(false)
const input   = ref(null)

watch(prompt, async (v) => {
  if (!v) return
  code.value = ''; error.value = ''; exiting.value = false
  await nextTick(); input.value?.focus()
})

async function submit() {
  if (busy.value || code.value.length < 6) return
  busy.value = true; error.value = ''
  const go = pending.value
  const result = await openWithCode(code.value)
  busy.value = false
  if (result === 'ok') {
    exiting.value = true
    if (go) router.push(go).catch(() => {})
    return
  }
  error.value = t(result === 'paused' ? 'finance.owner.lock.paused' : 'finance.owner.lock.wrong')
  code.value = ''
  shake.value = true
  setTimeout(() => { shake.value = false }, 450)
  input.value?.focus()
}

function close() { cancel() }
function goSetup() { cancel(); router.push('/settings/security').catch(() => {}) }

function onKeydown(e) { if (prompt.value && e.key === 'Escape') { e.stopPropagation(); close() } }
onMounted(()   => window.addEventListener('keydown', onKeydown, { capture: true }))
onUnmounted(() => window.removeEventListener('keydown', onKeydown, { capture: true }))
</script>

<style scoped>
.ols-backdrop {
  position: fixed; inset: 0; z-index: 9998;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(22px) saturate(1.2); -webkit-backdrop-filter: blur(22px) saturate(1.2);
}
.ols-card {
  width: min(420px, 90vw); padding: 40px 36px 28px; border-radius: 28px;
  background: rgba(24, 24, 27, 0.62); border: 1px solid rgba(255, 255, 255, 0.14);   /* darker glass: white text stays readable on a light page */
  backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease;
}
.ols-card--exit { transform: scale(0.9); opacity: 0; }
.ols-icon { color: #e7c08a; display: flex; }   /* the tree's sand gold */
.ols-icon--shake { animation: olsShake 0.4s ease; }
@keyframes olsShake {
  0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
}
.ols-title { font-size: 20px; font-weight: 800; color: #fff; text-align: center; }
.ols-text { margin: 0; font-size: 13.5px; color: rgba(255, 255, 255, 0.7); text-align: center; line-height: 1.6; }
.ols-input {
  width: 220px; text-align: center; font-size: 26px; letter-spacing: 0.35em; font-variant-numeric: tabular-nums;
  padding: 10px 12px; border-radius: 14px; color: #fff; outline: none;
  background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.22);
}
.ols-input:focus { border-color: #e7c08a; box-shadow: 0 0 0 3px rgba(231, 192, 138, 0.25); }
.ols-error { font-size: 12.5px; color: #ff8a8a; }
.ols-btn {
  min-width: 220px; padding: 10px 18px; border-radius: 12px; border: none; cursor: pointer;
  font: inherit; font-weight: 700; color: #3b2a12; background: #e7c08a;
}
.ols-btn:disabled { opacity: 0.5; cursor: default; }
.ols-cancel { background: none; border: none; color: rgba(255, 255, 255, 0.6); font: inherit; font-size: 13px; cursor: pointer; }
.ols-cancel:hover { color: #fff; }
.ols-enter-active, .ols-leave-active { transition: opacity 0.25s ease; }
.ols-enter-from, .ols-leave-to { opacity: 0; }
</style>
