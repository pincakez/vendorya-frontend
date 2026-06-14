<template>
  <div class="app-shell admin-shell" :style="chatOpen ? { paddingRight: chatWidth + 'px' } : {}">
    <AppSidebar
      admin
      :collapsed="sidebarCollapsed"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />

    <div class="app-main">
      <AppHeader
        admin
        :sidebarCollapsed="sidebarCollapsed"
        :chatOpen="chatOpen"
        @toggleChat="toggleChat"
      />

      <main class="app-content">
        <div class="page-wrap">
          <RouterView v-slot="{ Component, route }">
            <Transition :name="transitionName" mode="out-in">
              <!-- Single-element wrapper so the out-in Transition always has one
                   element root to animate (see DefaultLayout for the full why). -->
              <div :key="route.path" class="route-view">
                <component :is="Component" />
              </div>
            </Transition>
          </RouterView>
        </div>
      </main>

      <AppFooter />
    </div>

    <QAB />

    <!-- AI Chat Panel -->
    <Transition name="chat-panel">
      <AdminChatPanel
        v-if="chatOpen"
        :width="chatWidth"
        @close="chatOpen = false"
        @resize="chatWidth = $event"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import QAB from '@/components/ui/QAB.vue'
import AdminChatPanel from '@/components/admin/AdminChatPanel.vue'

const CHAT_WIDTH_KEY    = 'vendorya_chat_width'
const SIDEBAR_STATE_KEY = 'vendorya_sidebar'

const router           = useRouter()
const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_STATE_KEY) === 'collapsed')
const chatOpen         = ref(false)
const chatWidth        = ref(parseInt(localStorage.getItem(CHAT_WIDTH_KEY) || '380', 10))

// Page transition direction
const navDir = ref('forward')
let isBack = false
const onPopState = () => { isBack = true }
onMounted(()   => window.addEventListener('popstate', onPopState))
onUnmounted(() => window.removeEventListener('popstate', onPopState))
const unguard = router.beforeEach(() => { navDir.value = isBack ? 'back' : 'forward'; isBack = false })
onUnmounted(unguard)
const transitionName = computed(() => navDir.value === 'back' ? 'slide-back' : 'slide-forward')

watch(sidebarCollapsed, val => {
  localStorage.setItem(SIDEBAR_STATE_KEY, val ? 'collapsed' : 'open')
})
watch(chatWidth, val => {
  localStorage.setItem(CHAT_WIDTH_KEY, String(val))
})

function toggleChat() {
  if (!chatOpen.value) {
    // Opening the assistant auto-collapses the nav to make room —
    // but it's only a starting state, the user can re-expand it freely.
    sidebarCollapsed.value = true
    chatOpen.value         = true
  } else {
    chatOpen.value = false
  }
}
</script>

<style scoped>
.page-wrap { max-width: 1500px; margin: 0 auto; width: 100%; padding-top: 24px; }

.app-shell { transition: padding-right 200ms ease; }

.chat-panel-enter-active,
.chat-panel-leave-active { transition: transform 200ms ease, opacity 200ms ease; }
.chat-panel-enter-from,
.chat-panel-leave-to { transform: translateX(100%); opacity: 0; }
</style>
