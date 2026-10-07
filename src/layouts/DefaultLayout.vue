<template>
  <div class="app-shell">
    <AppSidebar :collapsed="ui.sidebarCollapsed" @toggle-collapse="ui.toggleSidebar()" />

    <div class="app-main">
      <AppHeader
        :sidebarCollapsed="ui.sidebarCollapsed"
        @toggleSidebar="ui.toggleSidebar()"
      />

      <main class="app-content">
        <div class="page-wrap">
          <RouterView v-slot="{ Component, route }">
            <Transition :name="transitionName" mode="out-in">
              <!-- Single-element wrapper: guarantees the Transition always has one
                   element root to animate. Without it, any view whose root is a
                   fragment/comment node stalls the out-in leave callback, leaving
                   the next page permanently blank (and every nav after it). -->
              <div :key="route.path" class="route-view">
                <component :is="Component" />
              </div>
            </Transition>
          </RouterView>
        </div>
      </main>

      <AppFooter />
    </div>

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useIdleTimeout } from '@/composables/useIdleTimeout'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

useIdleTimeout()

const auth   = useAuthStore()
const ui     = useUIStore()
const router = useRouter()

// Page transition direction: popstate = browser back/forward, everything else = forward
const navDir = ref('forward')
let isBack = false
const onPopState = () => { isBack = true }
onMounted(()   => window.addEventListener('popstate', onPopState))
onUnmounted(() => window.removeEventListener('popstate', onPopState))
const unguard = router.beforeEach(() => { navDir.value = isBack ? 'back' : 'forward'; isBack = false })
onUnmounted(unguard)
const transitionName = computed(() => navDir.value === 'back' ? 'slide-back' : 'slide-forward')

// Dynamic global shortcuts: read open_pos / open_srv from user pos_settings
// Falls back to F5 / F6 (matching UX Settings defaults) if not configured.
const posKey = computed(() => auth.user?.pos_settings?.shortcuts?.open_pos ?? 'F5')
const srvKey = computed(() => auth.user?.pos_settings?.shortcuts?.open_srv ?? 'F6')

function matchesKey(e, shortcut) {
  if (!shortcut) return false
  if (shortcut.startsWith('Ctrl+')) return e.ctrlKey && e.key.toUpperCase() === shortcut.slice(5).toUpperCase()
  if (shortcut.startsWith('Alt+')) return e.altKey && e.key.toUpperCase() === shortcut.slice(4).toUpperCase()
  return e.key === shortcut
}

function onGlobalKey(e) {
  if (matchesKey(e, posKey.value)) { e.preventDefault(); router.push('/pos'); return }
  if (matchesKey(e, srvKey.value)) { e.preventDefault(); router.push('/services') }
}

onMounted(()   => window.addEventListener('keydown', onGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<style scoped>
/* Wide, but not wiiide — cap content on ultra-wide screens. */
.page-wrap { max-width: 1500px; margin: 0 auto; width: 100%; padding-top: 24px; }
</style>
