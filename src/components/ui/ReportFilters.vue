<template>
  <div class="report-filters">
    <div class="filter-presets">
      <button v-for="p in presets" :key="p.id" class="preset-btn"
              :class="{ active: activePreset === p.id }" @click="applyPreset(p)">
        {{ p.label }}
      </button>
    </div>
    <div class="filter-row">
      <label class="filter-field">
        <span>{{ t('reports.filters.from') }}</span>
        <input type="date" v-model="dateFrom" class="filter-input" @change="onManual" />
      </label>
      <label class="filter-field">
        <span>{{ t('reports.filters.to') }}</span>
        <input type="date" v-model="dateTo" class="filter-input" @change="onManual" />
      </label>
      <label v-if="showBranch" class="filter-field">
        <span>{{ t('reports.filters.branch') }}</span>
        <select v-model="branch" class="filter-input" @change="emitChange">
          <option value="">{{ t('reports.filters.all_branches') }}</option>
          <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </label>
      <label v-if="showGranularity" class="filter-field">
        <span>{{ t('reports.filters.group_by') }}</span>
        <select v-model="granularity" class="filter-input" @change="emitChange">
          <option value="day">{{ t('reports.filters.daily') }}</option>
          <option value="week">{{ t('reports.filters.weekly') }}</option>
          <option value="month">{{ t('reports.filters.monthly') }}</option>
        </select>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'

const { t } = useI18n()

const props = defineProps({
  showBranch:      { type: Boolean, default: true },
  showGranularity: { type: Boolean, default: false },
  defaultGranularity: { type: String, default: 'month' },
})
const emit = defineEmits(['change'])

function iso(d) { return d.toISOString().slice(0, 10) }
const today = new Date()
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

const dateFrom = ref(iso(monthStart))
const dateTo = ref(iso(today))
const branch = ref('')
const granularity = ref(props.defaultGranularity)
const branches = ref([])
const activePreset = ref('month')

const presets = computed(() => [
  { id: 'today', label: t('reports.filters.presets.today'), from: () => today, to: () => today },
  { id: 'week',  label: t('reports.filters.presets.week'), from: () => new Date(Date.now() - 6 * 864e5), to: () => today },
  { id: '30',    label: t('reports.filters.presets.d30'), from: () => new Date(Date.now() - 29 * 864e5), to: () => today },
  { id: 'month', label: t('reports.filters.presets.month'), from: () => monthStart, to: () => today },
  { id: 'year',  label: t('reports.filters.presets.year'), from: () => new Date(today.getFullYear(), 0, 1), to: () => today },
])

function applyPreset(p) {
  activePreset.value = p.id
  dateFrom.value = iso(p.from())
  dateTo.value = iso(p.to())
  emitChange()
}
function onManual() {
  activePreset.value = null
  emitChange()
}
function emitChange() {
  emit('change', {
    date_from: dateFrom.value,
    date_to: dateTo.value,
    branch: branch.value || undefined,
    granularity: props.showGranularity ? granularity.value : undefined,
  })
}

defineExpose({
  current: () => ({
    date_from: dateFrom.value, date_to: dateTo.value,
    branch: branch.value || undefined,
    granularity: props.showGranularity ? granularity.value : undefined,
  }),
})

onMounted(async () => {
  if (props.showBranch) {
    try {
      const res = await api.get('/api/core/branches/')
      branches.value = res.data.results ?? res.data
    } catch { branches.value = [] }
  }
  emitChange()
})
</script>

<style scoped>
.report-filters { margin-bottom: 18px; }
.filter-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.preset-btn {
  padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-muted); font-size: 12.5px;
  cursor: pointer; transition: all 120ms;
}
.preset-btn:hover { color: var(--text-primary); }
.preset-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.filter-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
.filter-field { display: flex; flex-direction: column; gap: 4px; }
.filter-field span { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); }
.filter-input {
  padding: 7px 10px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-card); color: var(--text-primary); font-size: 13px; outline: none;
  transition: border-color 120ms;
}
.filter-input:focus { border-color: var(--accent); }
</style>
