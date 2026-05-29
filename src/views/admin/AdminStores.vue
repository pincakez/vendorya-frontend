<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Stores</h1>
        <p class="page-sub">All Vendorya stores across the platform</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search store or owner…" @input="onSearch" />
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Code</th>
            <th>Owner</th>
            <th>Plan</th>
            <th>Currency</th>
            <th>Branches</th>
            <th>Staff</th>
            <th>Status</th>
            <th style="width:90px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!stores.length">
            <td colspan="9" class="table-empty">
              <Store :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No stores yet</div>
            </td>
          </tr>
          <tr v-for="s in stores" :key="s.id" class="table-row" :class="{ inactive: !s.is_active }">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="store-mini-avatar">{{ s.name.charAt(0).toUpperCase() }}</div>
                <span style="font-weight:600;">{{ s.name }}</span>
              </div>
            </td>
            <td>
              <span v-if="s.store_code" class="code-badge">{{ s.store_code }}</span>
              <span v-else style="color:var(--text-muted);font-size:12px;">—</span>
            </td>
            <td style="color:var(--text-secondary);font-size:12.5px;">{{ s.owner_username }}</td>
            <td><span class="plan-pill" :class="'plan-' + s.plan.toLowerCase()">{{ s.plan }}</span></td>
            <td style="font-variant-numeric:tabular-nums;">{{ s.currency?.symbol || '—' }}</td>
            <td style="font-variant-numeric:tabular-nums;">{{ s.branches_count }}</td>
            <td style="font-variant-numeric:tabular-nums;">{{ s.staff_count }}</td>
            <td>
              <span v-if="s.is_active" class="status-active">Active</span>
              <span v-else class="status-inactive">Inactive</span>
            </td>
            <td>
              <button class="row-action" title="Enter store" @click="enterStore(s)">
                <LogIn :size="13" />
              </button>
              <button class="row-action" title="Edit" @click="openEdit(s)">
                <Pencil :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit modal (single store) -->
    <AppModal :open="editModal.open" title="Edit Store" @close="closeEdit">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Store Name</label>
          <input v-model="editModal.name" class="form-input" placeholder="e.g. Trenda Fashion" />
        </div>
        <div>
          <label class="form-label">Store Code <span class="hint">(3 digits — part of every SKU)</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input
              v-model="editModal.store_code"
              class="form-input"
              placeholder="e.g. 120"
              maxlength="3"
              style="width:100px;"
              @input="codeCheck = null"
            />
            <button class="btn-check" :disabled="!editModal.store_code || editModal.store_code.length !== 3 || checkingCode" @click="checkStoreCode">
              {{ checkingCode ? '…' : 'Check' }}
            </button>
            <span v-if="codeCheck === true" class="check-ok">Available</span>
            <span v-else-if="codeCheck === false" class="check-taken">Already taken</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Plan</label>
            <select v-model="editModal.plan" class="form-input">
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <div>
            <label class="form-label">Currency</label>
            <select v-model="editModal.currency_id" class="form-input">
              <option v-for="c in currencies" :key="c.id" :value="c.id">
                {{ c.symbol }} — {{ c.name }} ({{ c.code }})
              </option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Default Language</label>
            <select v-model="editModal.default_language" class="form-input">
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label class="form-label">Timezone</label>
            <select v-model="editModal.timezone" class="form-input">
              <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding-top:4px;">
          <label class="form-label" style="margin:0;">Active</label>
          <button class="toggle-btn" :class="{ on: editModal.is_active }" @click="editModal.is_active = !editModal.is_active">
            <span class="toggle-knob" />
          </button>
          <span style="font-size:12px;color:var(--text-muted);">{{ editModal.is_active ? 'Store is open for use' : 'Store deactivated' }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeEdit">Cancel</button>
        <button class="btn-admin" :disabled="!editModal.name.trim() || saving" @click="saveEdit">
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </template>
    </AppModal>

    <!-- Create Store modal (compound: owner + store + branch) -->
    <AppModal :open="createModal.open" title="New Store" @close="closeCreate">
      <!-- Stepper -->
      <div class="stepper">
        <div v-for="(s, i) in steps" :key="s.key"
             class="step" :class="{ active: step === i, done: step > i }"
             @click="step > i && (step = i)">
          <span class="step-dot">{{ step > i ? '✓' : (i + 1) }}</span>
          <span class="step-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Step 1 — Owner -->
      <div v-show="step === 0" style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">First Name</label>
            <input v-model="form.owner.first_name" class="form-input" placeholder="Ahmed" />
          </div>
          <div>
            <label class="form-label">Last Name</label>
            <input v-model="form.owner.last_name" class="form-input" placeholder="Hassan" />
          </div>
        </div>
        <div>
          <label class="form-label">Email</label>
          <input v-model="form.owner.email" class="form-input" placeholder="owner@example.com" type="email" />
        </div>
        <div>
          <label class="form-label">Username <span class="req">*</span></label>
          <input v-model="form.owner.username" class="form-input" placeholder="ahmedh" autocomplete="off" />
        </div>
        <div>
          <label class="form-label">Password <span class="req">*</span> <span class="hint">(min 8 chars)</span></label>
          <input v-model="form.owner.password" class="form-input" type="password" autocomplete="new-password" />
        </div>
        <p class="step-help">
          This account becomes the store OWNER — full access to all features in the new tenant.
        </p>
      </div>

      <!-- Step 2 — Store -->
      <div v-show="step === 1" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Store Name <span class="req">*</span></label>
          <input v-model="form.store.name" class="form-input" placeholder="Trenda Fashion" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Plan</label>
            <select v-model="form.store.plan" class="form-input">
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <div>
            <label class="form-label">Currency</label>
            <select v-model="form.store.currency" class="form-input">
              <option v-for="c in currencies" :key="c.id" :value="c.id">
                {{ c.symbol }} — {{ c.name }} ({{ c.code }})
              </option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Default Language</label>
            <select v-model="form.store.default_language" class="form-input">
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label class="form-label">Timezone</label>
            <select v-model="form.store.timezone" class="form-input">
              <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Step 3 — Main Branch -->
      <div v-show="step === 2" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Branch Name</label>
          <input v-model="form.branch.name" class="form-input" placeholder="Main Branch" />
        </div>
        <div>
          <label class="form-label">Street Address <span class="req">*</span></label>
          <input v-model="form.branch.street_1" class="form-input" placeholder="1 Tahrir Square" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">City <span class="req">*</span></label>
            <input v-model="form.branch.city" class="form-input" placeholder="Cairo" />
          </div>
          <div>
            <label class="form-label">Country</label>
            <input v-model="form.branch.country" class="form-input" placeholder="Egypt" />
          </div>
        </div>
        <p class="step-help">
          Every store needs at least one branch to record sales. You can add more after onboarding.
        </p>
      </div>

      <!-- Error surface -->
      <div v-if="createErrors.length" class="error-box">
        <div v-for="(e, i) in createErrors" :key="i">{{ e }}</div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeCreate">Cancel</button>
        <button v-if="step > 0" class="btn-ghost" @click="step--">Back</button>
        <button v-if="step < steps.length - 1" class="btn-admin" :disabled="!canAdvance" @click="step++">Next</button>
        <button v-else class="btn-admin" :disabled="!canSubmit || saving" @click="submitCreate">
          {{ saving ? 'Creating…' : 'Create Store' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Store, Pencil, LogIn } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppModal from '@/components/ui/AppModal.vue'

const router = useRouter()
const auth = useAuthStore()
const qab = useQABStore()

const stores = ref([])
const currencies = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')

const timezones = [
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Tripoli',
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Baghdad', 'Asia/Beirut',
  'Asia/Amman', 'Asia/Damascus', 'Asia/Jerusalem',
  'Europe/London', 'Europe/Paris', 'Europe/Istanbul',
  'America/New_York', 'America/Los_Angeles',
  'UTC',
]

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchStores, 350)
}

async function fetchStores() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/stores/', {
      params: search.value ? { search: search.value } : {},
    })
    stores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch (e) {
    stores.value = []
  } finally {
    loading.value = false
  }
}

async function fetchCurrencies() {
  try {
    const res = await api.get('/api/core/currencies/')
    const list = Array.isArray(res.data) ? res.data : (res.data.results || [])
    currencies.value = list.filter(c => c.is_active)
  } catch { currencies.value = [] }
}

function defaultCurrencyId() {
  return currencies.value.find(c => c.code === 'EGP')?.id || currencies.value[0]?.id || ''
}

// --- Edit modal ---
const editModal = reactive({
  open: false, id: null,
  name: '', store_code: '', plan: 'FREE', currency_id: '', default_language: 'ar',
  timezone: 'Africa/Cairo', is_active: true,
})
const codeCheck = ref(null)   // null = unchecked, true = available, false = taken
const checkingCode = ref(false)

function openEdit(s) {
  codeCheck.value = null
  Object.assign(editModal, {
    open: true, id: s.id,
    name: s.name, store_code: s.store_code || '',
    plan: s.plan,
    currency_id: s.currency?.id || defaultCurrencyId(),
    default_language: s.default_language,
    timezone: s.timezone || 'Africa/Cairo',
    is_active: s.is_active,
  })
}

function closeEdit() { editModal.open = false }

async function checkStoreCode() {
  checkingCode.value = true
  codeCheck.value = null
  try {
    const res = await api.get('/api/admin/stores/check-code/', { params: { code: editModal.store_code } })
    codeCheck.value = res.data.available
  } catch { codeCheck.value = false }
  finally { checkingCode.value = false }
}

async function saveEdit() {
  saving.value = true
  try {
    const payload = {
      name: editModal.name,
      plan: editModal.plan,
      currency_id: editModal.currency_id || null,
      default_language: editModal.default_language,
      timezone: editModal.timezone,
      is_active: editModal.is_active,
    }
    if (editModal.store_code) payload.store_code = editModal.store_code
    await api.patch(`/api/admin/stores/${editModal.id}/`, payload)
    closeEdit()
    fetchStores()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving store')
  } finally {
    saving.value = false
  }
}

// --- Create modal (compound) ---
const steps = [
  { key: 'owner',  label: 'Owner' },
  { key: 'store',  label: 'Store' },
  { key: 'branch', label: 'Main Branch' },
]
const step = ref(0)
const createErrors = ref([])

const form = reactive({
  owner:  { first_name: '', last_name: '', email: '', username: '', password: '' },
  store:  { name: '', plan: 'FREE', currency: '', default_language: 'ar', timezone: 'Africa/Cairo' },
  branch: { name: 'Main Branch', street_1: '', city: '', country: 'Egypt' },
})

const createModal = reactive({ open: false })

function openCreate() {
  step.value = 0
  createErrors.value = []
  Object.assign(form.owner,  { first_name: '', last_name: '', email: '', username: '', password: '' })
  Object.assign(form.store,  { name: '', plan: 'FREE', currency: defaultCurrencyId(), default_language: 'ar', timezone: 'Africa/Cairo' })
  Object.assign(form.branch, { name: 'Main Branch', street_1: '', city: '', country: 'Egypt' })
  createModal.open = true
}

function closeCreate() {
  createModal.open = false
}

const canAdvance = computed(() => {
  if (step.value === 0) {
    return form.owner.username.trim().length > 0 && form.owner.password.trim().length >= 8
  }
  if (step.value === 1) {
    return form.store.name.trim().length > 0
  }
  return true
})

const canSubmit = computed(() => {
  return form.owner.username.trim() && form.owner.password.length >= 8
      && form.store.name.trim()
      && form.branch.street_1.trim() && form.branch.city.trim()
})

function flattenErrors(data, prefix = '') {
  const out = []
  if (!data) return out
  if (typeof data === 'string') { out.push(prefix ? `${prefix}: ${data}` : data); return out }
  if (Array.isArray(data)) { data.forEach(x => out.push(...flattenErrors(x, prefix))); return out }
  if (typeof data === 'object') {
    for (const k of Object.keys(data)) {
      out.push(...flattenErrors(data[k], prefix ? `${prefix}.${k}` : k))
    }
  }
  return out
}

async function submitCreate() {
  createErrors.value = []
  saving.value = true
  try {
    await api.post('/api/admin/stores/', {
      owner: { ...form.owner },
      store: { ...form.store },
      branch: { ...form.branch },
    })
    closeCreate()
    fetchStores()
  } catch (e) {
    const errs = flattenErrors(e.response?.data)
    createErrors.value = errs.length ? errs : ['Error creating store']
  } finally {
    saving.value = false
  }
}

function enterStore(store) {
  auth.setActiveStore(store)
  router.push('/dashboard')
}

onMounted(() => {
  fetchStores()
  fetchCurrencies()
  qab.setActions([{ id: 'new-store', label: 'New Store', icon: 'plus', handler: openCreate }])
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right { display:flex; align-items:center; gap:10px; }

.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding:7px 12px 7px 30px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; width:220px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:var(--admin-accent); }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody tr.table-row.inactive { opacity:.55; }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.store-mini-avatar { width:28px; height:28px; border-radius:7px; background:var(--admin-accent-soft); color:var(--admin-accent); font-weight:700; display:flex; align-items:center; justify-content:center; font-size:12px; }

.plan-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.plan-free    { background:#f3f4f6; color:#6b7280; }
.plan-premium { background:rgba(249,115,22,0.15); color:var(--admin-accent); }

.status-active   { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#16a34a; }
.status-active::before  { content:''; width:6px; height:6px; border-radius:50%; background:#16a34a; }
.status-inactive { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#9ca3af; }
.status-inactive::before { content:''; width:6px; height:6px; border-radius:50%; background:#9ca3af; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; margin-right:4px; }
.row-action:hover { background:var(--admin-accent-soft); color:var(--admin-accent); }

.toggle-btn { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--admin-accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--admin-accent); }
.req { color:#dc2626; font-weight:700; }
.hint { color:var(--text-muted); font-weight:400; font-size:11px; }

.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }

/* Stepper */
.stepper { display:flex; align-items:center; gap:6px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border); }
.step    { display:flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:500; color:var(--text-muted); cursor:default; }
.step.done { cursor:pointer; }
.step-dot{ width:20px; height:20px; border-radius:50%; background:var(--border); color:var(--text-muted); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; transition:background 150ms,color 150ms; }
.step.active .step-dot { background:var(--admin-accent); color:#fff; }
.step.active .step-label{ color:var(--text-primary); font-weight:600; }
.step.done .step-dot { background:#16a34a; color:#fff; }
.step.done .step-label { color:var(--text-secondary); }

.step-help { font-size:12px; color:var(--text-muted); margin:4px 0 0; line-height:1.5; }
.error-box { margin-top:12px; padding:10px 12px; border:1px solid #fecaca; background:rgba(220,38,38,0.08); border-radius:8px; color:#b91c1c; font-size:12.5px; display:flex; flex-direction:column; gap:3px; }

.code-badge { display:inline-block; padding:2px 8px; border-radius:6px; font-size:12px; font-weight:700; letter-spacing:.06em; font-variant-numeric:tabular-nums; background:rgba(249,115,22,0.12); color:var(--admin-accent); border:1px solid rgba(249,115,22,0.25); }

.btn-check { padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:12.5px; font-weight:600; cursor:pointer; white-space:nowrap; transition:background 100ms,border-color 100ms; }
.btn-check:hover:not(:disabled) { background:var(--admin-accent-soft); border-color:var(--admin-accent); color:var(--admin-accent); }
.btn-check:disabled { opacity:.5; cursor:default; }

.check-ok    { font-size:12px; font-weight:600; color:#16a34a; }
.check-taken { font-size:12px; font-weight:600; color:#dc2626; }
</style>
