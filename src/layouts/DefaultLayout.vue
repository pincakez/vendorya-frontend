<template>
  <div class="app-shell">
    <AppSidebar :collapsed="sidebarCollapsed" />

    <div class="app-main">
      <AppHeader
        :sidebarCollapsed="sidebarCollapsed"
        @toggleSidebar="sidebarCollapsed = !sidebarCollapsed"
      />

      <main class="app-content">
        <RouterView />
      </main>

      <AppFooter />
    </div>
    <QAB />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import QAB from '@/components/ui/QAB.vue'

const sidebarCollapsed = ref(
  localStorage.getItem('vendorya_sidebar') === 'collapsed'
)

// Persist sidebar state
import { watch } from 'vue'
watch(sidebarCollapsed, val => {
  localStorage.setItem('vendorya_sidebar', val ? 'collapsed' : 'open')
})
</script>
