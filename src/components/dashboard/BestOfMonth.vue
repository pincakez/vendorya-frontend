<template>
  <div class="b-head">
    <span class="b-title">{{ t('core.dash.best_of_month') }}</span>
    <div class="bom-dots">
      <button
        v-for="(_, i) in slides"
        :key="i"
        class="bom-dot"
        :class="{ active: i === idx }"
        @click="jumpTo(i)"
      />
    </div>
  </div>

  <div class="bom-stage">
    <Transition name="bom">
      <div :key="idx" class="bom-panel">
        <div class="bom-icon-wrap" :style="{ background: slides[idx].color + '22', color: slides[idx].color }">
          <component :is="slides[idx].icon" :size="26" />
        </div>
        <div class="bom-label">{{ slides[idx].label }}</div>
        <div class="bom-value" :title="slides[idx].value || '—'">{{ slides[idx].value || '—' }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tag, FolderOpen, Calendar, Clock } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  attribute: { type: String, default: null },
  category:  { type: String, default: null },
  day:       { type: String, default: null },
  hours:     { type: String, default: null },
})

const idx = ref(0)
let timer = null

const slides = computed(() => [
  { icon: Tag,        label: t('core.dash.best_attribute'), value: props.attribute, color: '#f78f1e' },
  { icon: FolderOpen, label: t('core.dash.best_category'),  value: props.category,  color: '#3772ff' },
  { icon: Calendar,   label: t('core.dash.best_day'),       value: props.day,       color: '#ba2d0b' },
  { icon: Clock,      label: t('core.dash.peak_hours'),     value: props.hours,     color: '#0e4749' },
])

function jumpTo(i) {
  idx.value = i
  clearInterval(timer)
  timer = setInterval(advance, 4000)
}

function advance() {
  idx.value = (idx.value + 1) % slides.value.length
}

onMounted(() => { timer = setInterval(advance, 4000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.bom-stage {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.bom-panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  text-align: center;
}

.bom-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  flex-shrink: 0;
}

.bom-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: var(--text-muted);
}

.bom-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bom-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.bom-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 200ms, transform 200ms;
}

.bom-dot.active {
  background: var(--accent);
  transform: scale(1.3);
}

.bom-enter-active { transition: opacity .35s ease, transform .35s ease; }
.bom-leave-active { transition: opacity .25s ease, transform .25s ease; position: absolute; width: 100%; }
.bom-enter-from  { opacity: 0; transform: translateX(18px); }
.bom-leave-to    { opacity: 0; transform: translateX(-18px); }
</style>
