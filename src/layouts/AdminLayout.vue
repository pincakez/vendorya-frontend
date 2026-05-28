<template>
  <div class="app-shell admin-shell" :style="chatOpen ? { paddingRight: chatWidth + 'px' } : {}">
    <AdminSidebar :collapsed="sidebarCollapsed || chatOpen" />

    <div class="app-main">
      <AdminHeader
        :sidebarCollapsed="sidebarCollapsed || chatOpen"
        :chatOpen="chatOpen"
        @toggleSidebar="toggleSidebar"
        @toggleChat="toggleChat"
      />

      <main class="app-content">
        <RouterView />
      </main>

      <AppFooter />
    </div>

    <QAB />

    <!-- AI Chat Panel -->
    <Transition name="chat-panel">
      <AdminChatPanel
        v-if="chatOpen"
        :width="chatWidth"
        @close="chatOpen = false; restoreSidebar()"
        @resize="chatWidth = $event"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import AdminHeader from '@/components/layout/AdminHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import QAB from '@/components/ui/QAB.vue'
import AdminChatPanel from '@/components/admin/AdminChatPanel.vue'

const CHAT_WIDTH_KEY    = 'vendorya_chat_width'
const SIDEBAR_STATE_KEY = 'vendorya_sidebar'

const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_STATE_KEY) === 'collapsed')
const chatOpen         = ref(false)
const chatWidth        = ref(parseInt(localStorage.getItem(CHAT_WIDTH_KEY) || '380', 10))

let sidebarWasCollapsed = false

watch(sidebarCollapsed, val => {
  localStorage.setItem(SIDEBAR_STATE_KEY, val ? 'collapsed' : 'open')
})

watch(chatWidth, val => {
  localStorage.setItem(CHAT_WIDTH_KEY, String(val))
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleChat() {
  if (!chatOpen.value) {
    // Opening: remember sidebar state and collapse it.
    sidebarWasCollapsed    = sidebarCollapsed.value
    sidebarCollapsed.value = true
    chatOpen.value         = true
  } else {
    chatOpen.value = false
    restoreSidebar()
  }
}

function restoreSidebar() {
  sidebarCollapsed.value = sidebarWasCollapsed
}
</script>

<style scoped>
.app-shell {
  transition: padding-right 200ms ease;
}

.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: transform 200ms ease, opacity 200ms ease;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
