<template>
  <div class="app-shell admin-shell">
    <AppSidebar
      admin
      :collapsed="sidebarCollapsed"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />

    <div class="app-main">
      <AppHeader
        admin
        :sidebarCollapsed="sidebarCollapsed"
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
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import QAB from '@/components/ui/QAB.vue'

const SIDEBAR_STATE_KEY = 'vendorya_sidebar'

const router           = useRouter()
const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_STATE_KEY) === 'collapsed')

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
</script>

<style scoped>
.page-wrap { max-width: 1500px; margin: 0 auto; width: 100%; padding-top: 24px; }
</style>
