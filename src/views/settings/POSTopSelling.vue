<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Top Selling Config</h1>
        <p class="page-sub">Configure what appears in the POS Top Selling panel</p>
      </div>
      <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
    </div>

    <div class="settings-card" style="margin-top:24px; max-width:560px;">
      <div class="field">
        <label>Period</label>
        <div class="period-tabs">
          <button
            v-for="p in periods" :key="p.value"
            :class="['period-tab', { active: form.pos_top_selling_period === p.value }]"
            @click="form.pos_top_selling_period = p.value"
          >{{ p.label }}</button>
        </div>
      </div>

      <div class="field">
        <label>Category filter (optional)</label>
        <select v-model="form.pos_top_selling_category" class="form-input">
          <option :value="null">All Categories</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="field">
        <label>Number of items shown</label>
        <select v-model="form.pos_top_selling_limit" class="form-input">
          <option :value="4">4</option>
          <option :value="6">6</option>
          <option :value="8">8</option>
          <option :value="10">10</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const form = ref({ pos_top_selling_period: 'month', pos_top_selling_category: null, pos_top_selling_limit: 8 })
const categories = ref([])
const saving = ref(false)
const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all',   label: 'All Time' },
]

onMounted(async () => {
  const [setRes, catRes] = await Promise.all([
    api.get('/api/core/settings/'),
    api.get('/api/inventory/categories/'),
  ])
  const s = setRes.data
  form.value = {
    pos_top_selling_period:   s.pos_top_selling_period   || 'month',
    pos_top_selling_category: s.pos_top_selling_category || null,
    pos_top_selling_limit:    s.pos_top_selling_limit    || 8,
  }
  categories.value = catRes.data.results || catRes.data
})

async function save() {
  saving.value = true
  try {
    await api.patch('/api/core/settings/', form.value)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.settings-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.field label { font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.period-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.period-tab {
  padding: 8px 16px; border-radius: 10px; border: 2px solid var(--border);
  background: var(--bg-app); cursor: pointer; font-size: 13px; font-weight: 700;
  color: var(--text-secondary); transition: all 150ms;
}
.period-tab.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
</style>
