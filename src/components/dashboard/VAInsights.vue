<template>
  <div class="vai-card">

    <!-- Header -->
    <div class="vai-header">
      <div class="vai-brand">
        <span class="vai-logo">V</span>
        <div>
          <p class="vai-name">V-Agent</p>
          <p class="vai-sub">نصائح ذكية لمتجرك</p>
        </div>
      </div>
      <button class="vai-refresh" :class="{ spinning: loading }" @click="load" :disabled="loading" title="تحديث">
        <RefreshCw :size="15" />
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="vai-body">
      <div v-for="i in 4" :key="i" class="vai-skeleton">
        <div class="sk-icon" />
        <div class="sk-lines">
          <div class="sk-title" />
          <div class="sk-text" />
          <div class="sk-text sk-text--short" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="vai-error">
      <AlertTriangle :size="22" />
      <p>{{ error }}</p>
      <button class="btn-ghost btn-sm" @click="load">إعادة المحاولة</button>
    </div>

    <!-- Insights list -->
    <div v-else-if="insights.length" class="vai-body">
      <div
        v-for="(item, i) in insights"
        :key="i"
        class="vai-item"
        :class="`vai-item--${item.type}`"
      >
        <div class="vai-item-icon">
          <component :is="iconFor(item.type)" :size="17" />
        </div>
        <div class="vai-item-text">
          <p class="vai-item-title">{{ item.title }}</p>
          <p class="vai-item-body">{{ item.body }}</p>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="vai-empty">
      <Zap :size="24" />
      <p>اضغط تحديث لتحميل النصائح</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  RefreshCw, Star, Users, Package, Megaphone,
  AlertTriangle, Archive, TrendingUp, Lightbulb, Zap,
} from 'lucide-vue-next'
import api from '@/api/axios'

const loading  = ref(true)
const insights = ref([])
const error    = ref(null)

const TYPE_ICONS = {
  top_product:   Star,
  best_customer: Users,
  bundle_idea:   Package,
  marketing:     Megaphone,
  stock_alert:   AlertTriangle,
  slow_mover:    Archive,
  trend:         TrendingUp,
  insight:       Lightbulb,
}

function iconFor(type) {
  return TYPE_ICONS[type] || Lightbulb
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/admin-ai/vagent/insights/')
    insights.value = data.insights || []
  } catch (e) {
    error.value = e?.response?.data?.error || 'حدث خطأ، حاول مرة أخرى'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.vai-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Header ── */
.vai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.vai-brand { display: flex; align-items: center; gap: 10px; }
.vai-logo {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--accent) 0%, #f5a623 100%);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 16px; color: #fff;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent);
  flex-shrink: 0;
}
.vai-name { font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.vai-sub  { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

.vai-refresh {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border); border-radius: 6px;
  background: transparent; color: var(--text-muted);
  cursor: pointer; transition: all 120ms;
  flex-shrink: 0;
}
.vai-refresh:hover { background: var(--surface-hover); color: var(--accent); }
.vai-refresh.spinning svg { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Body / scroll ── */
.vai-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

/* ── Insight item ── */
.vai-item {
  display: flex;
  gap: 10px;
  padding: 10px 11px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: border-color 120ms;
}
.vai-item:hover { border-color: var(--accent-soft, color-mix(in srgb, var(--accent) 30%, transparent)); }

.vai-item-icon {
  width: 30px; height: 30px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.vai-item-title {
  font-size: 12px; font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 3px;
  line-height: 1.3;
}
.vai-item-body {
  font-size: 11.5px;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* Type colours */
.vai-item--top_product   .vai-item-icon { background: color-mix(in srgb, #f78f1e 12%, transparent); color: #f78f1e; }
.vai-item--best_customer .vai-item-icon { background: color-mix(in srgb, #3b82f6 12%, transparent); color: #3b82f6; }
.vai-item--bundle_idea   .vai-item-icon { background: color-mix(in srgb, #8b5cf6 12%, transparent); color: #8b5cf6; }
.vai-item--marketing     .vai-item-icon { background: color-mix(in srgb, #10b981 12%, transparent); color: #10b981; }
.vai-item--stock_alert   .vai-item-icon { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }
.vai-item--slow_mover    .vai-item-icon { background: color-mix(in srgb, #64748b 12%, transparent); color: #64748b; }
.vai-item--trend         .vai-item-icon { background: color-mix(in srgb, #06b6d4 12%, transparent); color: #06b6d4; }
.vai-item--insight       .vai-item-icon { background: color-mix(in srgb, #f78f1e 12%, transparent); color: #f78f1e; }

/* ── Skeleton ── */
.vai-skeleton {
  display: flex; gap: 10px; padding: 10px 11px;
  border-radius: 10px; background: var(--surface); border: 1px solid var(--border);
}
.sk-icon  { width: 30px; height: 30px; border-radius: 7px; background: var(--border); flex-shrink: 0; animation: pulse 1.4s ease-in-out infinite; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; justify-content: center; }
.sk-title { height: 11px; width: 55%; border-radius: 4px; background: var(--border); animation: pulse 1.4s ease-in-out infinite; }
.sk-text  { height: 9px; width: 100%; border-radius: 4px; background: var(--border); animation: pulse 1.4s ease-in-out 0.15s infinite; }
.sk-text--short { width: 70%; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }

/* ── Error / Empty ── */
.vai-error, .vai-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; color: var(--text-muted); font-size: 12px;
  text-align: center; padding: 16px;
}
.vai-error svg { color: var(--warning); }
.vai-empty svg { opacity: .35; }
</style>
