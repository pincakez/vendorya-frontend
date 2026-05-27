<template>
  <div class="app-shell admin-shell">
    <AdminSidebar :collapsed="sidebarCollapsed" />

    <div class="app-main">
      <AdminHeader
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
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import AdminHeader from '@/components/layout/AdminHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import QAB from '@/components/ui/QAB.vue'

const sidebarCollapsed = ref(
  localStorage.getItem('vendorya_sidebar') === 'collapsed'
)
watch(sidebarCollapsed, val => {
  localStorage.setItem('vendorya_sidebar', val ? 'collapsed' : 'open')
})
</script>
