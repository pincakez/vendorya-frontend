<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.pos.title') }}</h1>
        <p class="page-sub">{{ t('settings.pos.sub') }}</p>
      </div>
    </div>

    <!-- Tab strip -->
    <div class="pos-set-tabs">
      <button
        v-for="tab in tabs" :key="tab.id"
        :class="['pst-tab', { active: active === tab.id }]"
        @click="active = tab.id"
      >
        <component :is="tab.icon" :size="15" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <div class="pos-set-body">
      <KeepAlive>
        <component :is="activeComp" :embedded="true" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrendingUp, Star, LayoutList, Keyboard } from 'lucide-vue-next'
import POSTopSelling from './POSTopSelling.vue'
import POSFavorites  from './POSFavorites.vue'
import PosCartDisplay from './PosCartDisplay.vue'
import PosUX         from './PosUX.vue'

const { t } = useI18n()

const tabs = computed(() => [
  { id: 'top',     label: t('settings.pos.tabs.top_selling'),  icon: TrendingUp, comp: POSTopSelling },
  { id: 'fav',     label: t('settings.pos.tabs.favorites'),    icon: Star,       comp: POSFavorites },
  { id: 'cart',    label: t('settings.pos.tabs.cart_display'), icon: LayoutList, comp: PosCartDisplay },
  { id: 'kb',      label: t('settings.pos.tabs.keyboard'),     icon: Keyboard,   comp: PosUX },
])

const active = ref('top')
const activeComp = computed(() => tabs.value.find(t => t.id === active.value)?.comp)
</script>

<style scoped>
.pos-set-tabs {
  display: flex; gap: 6px; margin: 20px 0 24px;
  border-bottom: 1px solid var(--border); padding-bottom: 0;
}
.pst-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 700; color: var(--text-muted);
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 140ms var(--ease-out), border-color 140ms var(--ease-out);
}
.pst-tab:hover { color: var(--text-secondary); }
.pst-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
</style>
