<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Billing Settings</h1>
        <p class="page-sub">Platform-wide billing lifecycle timing and quota enforcement. Per-plan limits live on the Plans page — this controls how they behave.</p>
      </div>
    </div>

    <!-- Lifecycle timing -->
    <div class="settings-card">
      <div class="card-section-title">
        <CalendarClock :size="15" style="flex-shrink:0;" />
        Lifecycle Timing
      </div>

      <div v-if="loading" class="skeleton-row" style="height:120px;border-radius:8px;max-width:480px;" />
      <template v-else>
        <div class="field-grid">
          <div>
            <label class="form-label">Default trial length (days)</label>
            <input v-model.number="form.trial_length_days" class="form-input" type="number" min="0" />
            <p class="field-hint">Applied to new stores when a trial is started.</p>
          </div>
          <div>
            <label class="form-label">Grace days before suspend</label>
            <input v-model.number="form.grace_days" class="form-input" type="number" min="0" />
            <p class="field-hint">How long a past-due store keeps working before auto-suspend.</p>
          </div>
          <div>
            <label class="form-label">Invoice due window (days)</label>
            <input v-model.number="form.invoice_due_days" class="form-input" type="number" min="0" />
            <p class="field-hint">Days after issue before an invoice counts as overdue.</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Quota enforcement -->
    <div v-if="!loading" class="settings-card">
      <div class="card-section-title">
        <Gauge :size="15" style="flex-shrink:0;" />
        Quota Enforcement
      </div>
      <div style="max-width:420px;">
        <label class="form-label">Enforcement mode</label>
        <select v-model="form.quota_mode" class="form-input">
          <option value="WARN">Warn — allow but flag when over limit</option>
          <option value="BLOCK">Block — reject the action when over limit</option>
          <option value="OFF">Off — quotas stored but ignored</option>
        </select>
        <p class="field-hint">Applies to users, branches, products and monthly invoices against each store's plan limits.</p>
      </div>
    </div>

    <!-- Nightly job -->
    <div v-if="!loading" class="settings-card">
      <div class="card-section-title">
        <Repeat :size="15" style="flex-shrink:0;" />
        Nightly Job
      </div>

      <p class="field-hint" style="margin-top:0;margin-bottom:14px;">
        The billing cycle runs <strong>manually</strong> — press the button below whenever you want to process trials, overdue invoices and suspensions.
      </p>

      <label class="toggle-row">
        <input type="checkbox" v-model="form.nightly_job_enabled" />
        <span>Allow automatic nightly runs (only if a scheduler is set up later)</span>
      </label>
      <p class="field-hint" style="margin-top:6px;">
        Last run:
        <strong>{{ lastRunDisplay }}</strong>
      </p>

      <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn-secondary" :disabled="running" @click="runCycle">
          <span v-if="running">Running…</span>
          <span v-else>Run cycle now</span>
        </button>
        <span v-if="runOk" class="save-ok">Cycle completed.</span>
      </div>
    </div>

    <!-- Save bar -->
    <div v-if="!loading" style="display:flex;gap:12px;align-items:center;margin-top:4px;">
      <button class="btn-admin" :disabled="saving" @click="save">
        <span v-if="saving">Saving…</span>
        <span v-else>Save changes</span>
      </button>
      <span v-if="saveError" class="field-error">{{ saveError }}</span>
      <span v-if="saveSuccess" class="save-ok">Settings saved.</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { CalendarClock, Gauge, Repeat } from 'lucide-vue-next'
import api from '@/api/axios'

const loading     = ref(true)
const saving      = ref(false)
const running     = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)
const runOk       = ref(false)
const lastRunAt   = ref(null)

const form = reactive({
  trial_length_days: 14,
  grace_days: 7,
  invoice_due_days: 7,
  quota_mode: 'WARN',
  nightly_job_enabled: false,
})

const lastRunDisplay = computed(() => {
  if (!lastRunAt.value) return 'never'
  return new Date(lastRunAt.value).toLocaleString()
})

function apply(data) {
  form.trial_length_days   = data.trial_length_days
  form.grace_days          = data.grace_days
  form.invoice_due_days    = data.invoice_due_days
  form.quota_mode          = data.quota_mode
  form.nightly_job_enabled = data.nightly_job_enabled
  lastRunAt.value          = data.last_run_at
}

async function load() {
  try {
    const { data } = await api.get('/api/admin/billing/settings/')
    apply(data)
  } catch {
    // non-fatal
  } finally {
    loading.value = false
  }
}

async function save() {
  saveError.value = ''
  saveSuccess.value = false
  saving.value = true
  try {
    const { data } = await api.patch('/api/admin/billing/settings/', { ...form })
    apply(data)
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 2500)
  } catch (e) {
    saveError.value = e.response?.data?.detail || 'Failed to save. Try again.'
  } finally {
    saving.value = false
  }
}

async function runCycle() {
  runOk.value = false
  running.value = true
  try {
    const { data } = await api.post('/api/admin/billing/settings/run-cycle/')
    apply(data)
    runOk.value = true
    setTimeout(() => (runOk.value = false), 3000)
  } catch (e) {
    saveError.value = e.response?.data?.detail || 'Failed to run cycle.'
  } finally {
    running.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.settings-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px 24px;
  margin-bottom: 16px;
  max-width: 700px;
}

.card-section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 16px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.field-hint {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 5px;
  line-height: 1.4;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  color: var(--text-secondary);
  cursor: pointer;
}

.save-ok {
  font-size: 12.5px;
  color: var(--success, var(--success));
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.form-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.field-error {
  font-size: 12.5px;
  color: var(--danger, var(--danger));
}

.skeleton-row {
  background: linear-gradient(90deg, var(--border) 25%, var(--surface-2, var(--surface)) 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.3s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

</style>
