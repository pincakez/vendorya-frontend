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

    <!-- Floating admin preview badge -->
    <Transition name="preview-badge">
      <div v-if="auth.isSuperadmin && auth.previewMode" class="preview-badge">
        <Eye :size="13" />
        <span>Store View · {{ auth.activeStore?.name }}</span>
        <button class="preview-exit" @click="exitPreview">Admin →</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye } from 'lucide-vue-next'
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

function exitPreview() {
  auth.exitPreview()
  router.push('/admin/dashboard')
}

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

.preview-badge {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1e293b;
  color: #f1f5f9;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0,0,0,0.35);
  z-index: 9999;
  white-space: nowrap;
}

.preview-exit {
  background: none;
  border: none;
  color: #f97316;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  transition: opacity 120ms;
}
.preview-exit:hover { opacity: 0.75; }

.preview-badge-enter-active, .preview-badge-leave-active {
  transition: opacity 200ms, transform 200ms;
}
.preview-badge-enter-from, .preview-badge-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
