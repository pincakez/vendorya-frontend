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
          <RouterView />
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
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import QAB from '@/components/ui/QAB.vue'
import AdminChatPanel from '@/components/admin/AdminChatPanel.vue'

const CHAT_WIDTH_KEY    = 'vendorya_chat_width'
const SIDEBAR_STATE_KEY = 'vendorya_sidebar'

const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_STATE_KEY) === 'collapsed')
const chatOpen         = ref(false)
const chatWidth        = ref(parseInt(localStorage.getItem(CHAT_WIDTH_KEY) || '380', 10))

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
