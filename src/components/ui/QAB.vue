<template>
  <Teleport to="body">
    <div class="qab-root" :style="{ bottom: positionY + 'px' }">
      <!-- Action pills (expand up from toggle) -->
      <Transition name="qab-pills">
        <div v-if="qab.isOpen && qab.hasActions" class="qab-pills">
          <button
            v-for="action in qab.actions"
            :key="action.id"
            class="qab-pill btn-press"
            @click="handleAction(action)"
            :title="action.label"
          >
            <component v-if="action.icon" :is="resolveIcon(action.icon)" :size="14" />
            {{ action.label }}
          </button>
        </div>
      </Transition>

      <!-- Red toggle button -->
      <button
        v-if="qab.hasActions"
        class="qab-toggle btn-press"
        :class="{ open: qab.isOpen }"
        @click="qab.toggle()"
        title="Quick actions"
      >
        <Plus :size="20" class="qab-toggle-icon" />
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import * as LucideIcons from 'lucide-vue-next'
import { useQABStore } from '@/stores/qab'

const qab = useQABStore()

function resolveIcon(name) {
  const pascal = name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
  return LucideIcons[pascal] || LucideIcons.Circle
}

function handleAction(action) {
  action.handler?.()
  qab.close()
}

// Auto-collapse on scroll
const positionY = ref(32)
let lastScroll = 0
let hideTimer = null

function onScroll() {
  const content = document.querySelector('.app-content')
  if (!content) return
  const delta = content.scrollTop - lastScroll
  lastScroll = content.scrollTop
  if (delta > 8 && qab.isOpen) qab.close()
}

onMounted(() => {
  const content = document.querySelector('.app-content')
  content?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  const content = document.querySelector('.app-content')
  content?.removeEventListener('scroll', onScroll)
  clearTimeout(hideTimer)
})
</script>

<style scoped>
.qab-root {
  position: fixed;
  right: 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 100;
}

.qab-pills {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.qab-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  background: #16a34a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(22,163,74,0.35);
  white-space: nowrap;
  transition: background 120ms, transform 80ms, box-shadow 80ms;
}

.qab-pill:hover {
  background: #15803d;
  box-shadow: 0 4px 16px rgba(22,163,74,0.45);
}

.qab-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(220,38,38,0.4);
  transition: background 120ms, transform 150ms, box-shadow 80ms;
}

.qab-toggle:hover {
  background: #b91c1c;
  box-shadow: 0 4px 18px rgba(220,38,38,0.5);
}

.qab-toggle-icon {
  transition: transform 220ms cubic-bezier(0.34,1.56,0.64,1);
}

.qab-toggle.open .qab-toggle-icon {
  transform: rotate(45deg);
}

/* Animate pills in/out */
.qab-pills-enter-active {
  transition: opacity 160ms ease, transform 160ms cubic-bezier(0.34,1.56,0.64,1);
}
.qab-pills-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.qab-pills-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.92);
}
.qab-pills-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}
</style>
