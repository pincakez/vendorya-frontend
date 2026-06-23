<!--
  Update banner — shown when a newer build is waiting in the service worker.
  Replaces the old silent auto-reload (which blinked the page and wiped the cart
  mid-sale). Now the cashier decides WHEN to refresh.

  Behaviour (per Yakot):
   • Stays put at the top until clicked — it is a banner, not an auto-dismiss toast.
   • Pulses ("shines") every 5s to keep nagging.
   • Survives close/reopen/refresh/hard-refresh: a waiting SW stays waiting, so
     useRegisterSW re-fires needRefresh on every load until the user updates.
   • Checks for a new build every 60s so a long-open POS notices a deploy.
-->
<template>
  <Transition name="upd-drop">
    <div v-if="needRefresh" class="upd-banner" role="alert">
      <span class="upd-dot" />
      <span class="upd-text">{{ t('update.available') }}</span>
      <button class="upd-btn" @click="refresh">{{ t('update.refresh') }}</button>
    </div>
  </Transition>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(_url, r) {
    if (r) setInterval(() => r.update().catch(() => {}), 60_000)
  },
})

function refresh() {
  // Activates the waiting SW and reloads onto the new build.
  updateServiceWorker(true)
}
</script>

<style scoped>
.upd-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 9px 16px;
  background: var(--accent); color: #fff;
  font-size: 13px; font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  animation: upd-shine 5s ease-in-out infinite;
}
.upd-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #fff; flex-shrink: 0;
  animation: upd-pulse 5s ease-in-out infinite;
}
.upd-text { white-space: nowrap; }
.upd-btn {
  padding: 4px 14px; border-radius: 999px;
  background: #fff; color: var(--accent);
  font-size: 12px; font-weight: 800; border: none; cursor: pointer;
  transition: transform var(--press-back, 0.2s) var(--ease-spring, ease);
}
.upd-btn:hover  { filter: brightness(0.96); }
.upd-btn:active { transform: scale(0.94); }

/* "Shine" sweep every 5s to keep drawing the eye until clicked. */
@keyframes upd-shine {
  0%, 88%, 100% { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25); }
  93%           { box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.06), 0 2px 14px rgba(0, 0, 0, 0.3); }
}
@keyframes upd-pulse {
  0%, 80%, 100% { transform: scale(1);   opacity: 1; }
  90%           { transform: scale(1.9); opacity: 0.5; }
}

.upd-drop-enter-active { transition: transform 0.35s var(--ease-spring, cubic-bezier(.2,1.3,.4,1)), opacity 0.2s ease; }
.upd-drop-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.upd-drop-enter-from,
.upd-drop-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
