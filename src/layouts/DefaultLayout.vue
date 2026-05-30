<template>
  <div class="app-shell">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle-collapse="sidebarCollapsed = !sidebarCollapsed" />

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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Eye } from 'lucide-vue-next'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useIdleTimeout } from '@/composables/useIdleTimeout'
import { useAuthStore } from '@/stores/auth'

useIdleTimeout()

const auth   = useAuthStore()
const router = useRouter()

const sidebarCollapsed = ref(
  localStorage.getItem('vendorya_sidebar') === 'collapsed'
)

watch(sidebarCollapsed, val => {
  localStorage.setItem('vendorya_sidebar', val ? 'collapsed' : 'open')
})

function exitPreview() {
  auth.exitPreview()
  router.push('/admin/dashboard')
}
</script>

<style scoped>
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
