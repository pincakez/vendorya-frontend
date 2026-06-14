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
        <button class="btn-admin" @click="openCreate">
          <Plus :size="15" />
          New Store
        </button>
      </div>
    </div>

    <AppTable :loading="loading" :empty="!stores.length" empty-text="No stores yet" :cols="9">
      <template #head>
        <th class="dt-th">Store</th>
        <th class="dt-th">Code</th>
        <th class="dt-th">Owner</th>
        <th class="dt-th">Plan</th>
        <th class="dt-th">Currency</th>
        <th class="dt-th">Branches</th>
        <th class="dt-th">Staff</th>
        <th class="dt-th">Status</th>
        <th class="dt-th" style="width:90px;"></th>
      </template>
      <template #empty-icon><Store :size="32" class="dt-empty-icon" /></template>
      <tr v-for="s in stores" :key="s.id" class="dt-row" :class="{ inactive: !s.is_active }">
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
    </AppTable>


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
        <div v-if="editModal.originalActive && !editModal.is_active" style="border-top:1px solid var(--border);padding-top:12px;margin-top:2px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label class="form-label">Reason for suspending <span style="color:var(--admin-accent);">*</span></label>
            <textarea v-model="editModal.suspend_reason" class="form-input" rows="2" placeholder="e.g. Non-payment, terms violation, owner request…" />
          </div>
          <div>
            <label class="form-label">Grace period</label>
            <select v-model="editModal.suspend_grace_days" class="form-input" style="max-width:220px;">
              <option :value="0">Immediately</option>
              <option :value="7">7 days notice</option>
              <option :value="14">14 days notice</option>
              <option :value="30">30 days notice</option>
            </select>
            <p style="font-size:11.5px;color:var(--text-muted);margin:4px 0 0;">
              <span v-if="editModal.suspend_grace_days === 0">Store will be locked out immediately on save.</span>
              <span v-else>Store stays active for {{ editModal.suspend_grace_days }} days from today, then must be manually deactivated. Grace period is recorded in the activity log.</span>
            </p>
          </div>
          <p style="font-size:11.5px;color:var(--admin-accent);margin:0;">⚠ Immediate suspension locks out all staff until you reactivate.</p>
        </div>
        <!-- Danger Zone -->
        <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px;">
          <p style="font-size:11.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px;">Danger Zone</p>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid rgba(239,68,68,0.25);border-radius:10px;background:rgba(239,68,68,0.04);">
            <div>
              <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:0 0 2px;">Force Logout All Sessions</p>
              <p style="font-size:12px;color:var(--text-muted);margin:0;">Immediately invalidates every active session for all users in this store.</p>
            </div>
            <button class="btn-danger" :disabled="forcingLogout" @click="forceLogout">
              {{ forcingLogout ? 'Logging out…' : 'Force Logout' }}
            </button>
          </div>
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
          <label class="form-label">Username <span class="req">*</span> <span class="hint">(min 6 chars, unique)</span></label>
          <input v-model="form.owner.username" class="form-input" placeholder="ahmedh" autocomplete="off" />
          <span v-if="form.owner.username && form.owner.username.length < 6" style="font-size:11.5px;color:var(--danger);margin-top:3px;display:block;">At least 6 characters required</span>
        </div>
        <div>
          <label class="form-label">Password <span class="req">*</span> <span class="hint">(min 8 chars)</span></label>
          <input v-model="form.owner.password" class="form-input" type="password" autocomplete="new-password" />
        </div>
        <div>
          <label class="form-label">Confirm Password <span class="req">*</span></label>
          <input v-model="form.owner.password_confirm" class="form-input" type="password" autocomplete="new-password" />
          <span v-if="form.owner.password_confirm && form.owner.password !== form.owner.password_confirm" style="font-size:11.5px;color:var(--danger);margin-top:3px;display:block;">Passwords do not match</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Phone Number</label>
            <input v-model="form.owner.phone_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div>
            <label class="form-label">WhatsApp</label>
            <input v-model="form.owner.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
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
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Phone Number</label>
            <input v-model="form.store.phone_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div>
            <label class="form-label">WhatsApp</label>
            <input v-model="form.store.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">City</label>
            <select v-model="form.store.city" class="form-input">
              <option value="">— Select city —</option>
              <option v-for="c in egyptCities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Country</label>
            <input value="Egypt" class="form-input" disabled style="opacity:.55;cursor:not-allowed;" />
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
            <select v-model="form.branch.city" class="form-input">
              <option value="">— Select city —</option>
              <option v-for="c in egyptCities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Country</label>
            <input value="Egypt" class="form-input" disabled style="opacity:.55;cursor:not-allowed;" />
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Phone <span class="req">*</span></label>
            <input v-model="form.branch.phone_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div>
            <label class="form-label">WhatsApp</label>
            <input v-model="form.branch.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
        </div>
        <div>
          <label class="form-label">Email <span class="req">*</span></label>
          <input v-model="form.branch.email" class="form-input" placeholder="branch@example.com" type="email" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Store, Pencil, LogIn, Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'
import AppTable from '@/components/ui/AppTable.vue'

const router = useRouter()
const auth = useAuthStore()

const stores = ref([])
const currencies = ref([])
const loading = ref(false)
const saving = ref(false)
const forcingLogout = ref(false)
const search = ref('')

const timezones = [
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Tripoli',
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Baghdad', 'Asia/Beirut',
  'Asia/Amman', 'Asia/Damascus', 'Asia/Jerusalem',
  'Europe/London', 'Europe/Paris', 'Europe/Istanbul',
  'America/New_York', 'America/Los_Angeles',
  'UTC',
]

const egyptCities = [
  'Cairo', 'Alexandria', 'Giza', 'Port Said', 'Suez', 'Luxor', 'Aswan',
  'Ismailia', 'Mansoura', 'Tanta', 'Asyut', 'Fayoum', 'Zagazig', 'Damanhur',
  'Minya', 'Beni Suef', 'Sohag', 'Qena', 'Hurghada', 'Sharm El Sheikh',
  '6th of October City', 'New Cairo', 'Arish', 'Banha', 'Kafr El Sheikh',
  'Shibin El Kom', 'Marsa Matruh', 'Edfu', 'Kom Ombo', 'Qusair',
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
    suspend_reason: '', suspend_grace_days: 0, originalActive: s.is_active,
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
  const suspending = editModal.originalActive && !editModal.is_active
  if (suspending) {
    if (!editModal.suspend_reason.trim()) {
      alert('Please enter a reason for suspending this store.')
      return
    }
    if (!confirm(`Suspend "${editModal.name}"? All its staff will be locked out of login until you reactivate it.`)) {
      return
    }
  }
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
    if (suspending) {
      payload.suspend_reason = editModal.suspend_reason.trim()
      payload.suspend_grace_days = editModal.suspend_grace_days
    }
    await api.patch(`/api/admin/stores/${editModal.id}/`, payload)
    closeEdit()
    fetchStores()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving store')
  } finally {
    saving.value = false
  }
}

async function forceLogout() {
  if (!confirm(`Force logout ALL sessions for "${editModal.name}"?\n\nEvery logged-in user at this store will be immediately kicked out and forced to sign in again.`)) return
  forcingLogout.value = true
  try {
    const res = await api.post(`/api/admin/stores/${editModal.id}/force-logout/`)
    alert(res.data.detail)
  } catch (e) {
    alert(e.response?.data?.detail || 'Error forcing logout')
  } finally {
    forcingLogout.value = false
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
  owner:  { first_name: '', last_name: '', email: '', username: '', password: '', password_confirm: '', phone_number: '', whatsapp_number: '' },
  store:  { name: '', plan: 'FREE', currency: '', default_language: 'ar', timezone: 'Africa/Cairo', phone_number: '', whatsapp_number: '', city: '', country: 'Egypt' },
  branch: { name: 'Main Branch', street_1: '', city: '', country: 'Egypt', phone_number: '', whatsapp_number: '', email: '' },
})

const createModal = reactive({ open: false })

function openCreate() {
  step.value = 0
  createErrors.value = []
  Object.assign(form.owner,  { first_name: '', last_name: '', email: '', username: '', password: '', password_confirm: '', phone_number: '', whatsapp_number: '' })
  Object.assign(form.store,  { name: '', plan: 'FREE', currency: defaultCurrencyId(), default_language: 'ar', timezone: 'Africa/Cairo', phone_number: '', whatsapp_number: '', city: '', country: 'Egypt' })
  Object.assign(form.branch, { name: 'Main Branch', street_1: '', city: '', country: 'Egypt', phone_number: '', whatsapp_number: '', email: '' })
  createModal.open = true
}

function closeCreate() {
  createModal.open = false
}

const canAdvance = computed(() => {
  if (step.value === 0) {
    return form.owner.username.trim().length >= 6
        && form.owner.password.trim().length >= 8
        && form.owner.password === form.owner.password_confirm
  }
  if (step.value === 1) {
    return form.store.name.trim().length > 0
  }
  return true
})

const canSubmit = computed(() => {
  return form.owner.username.trim().length >= 6
      && form.owner.password.length >= 8
      && form.owner.password === form.owner.password_confirm
      && form.store.name.trim()
      && form.branch.street_1.trim() && form.branch.city.trim()
      && form.branch.phone_number.trim() && form.branch.email.trim()
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
    const { password_confirm, ...ownerPayload } = form.owner
    await api.post('/api/admin/stores/', {
      owner: ownerPayload,
      store: { ...form.store, country: 'Egypt' },
      branch: { ...form.branch, country: 'Egypt' },
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
})
</script>

<style scoped>
.header-right { display:flex; align-items:center; gap:10px; }

.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding:7px 12px 7px 30px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; width:220px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:var(--admin-accent); }

.data-table tbody tr.table-row.inactive { opacity:.55; }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }

.store-mini-avatar { width:28px; height:28px; border-radius:7px; background:var(--admin-accent-soft); color:var(--admin-accent); font-weight:700; display:flex; align-items:center; justify-content:center; font-size:12px; }

.plan-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.plan-free    { background:#f3f4f6; color:#6b7280; }
.plan-premium { background:rgba(239,68,68,0.15); color:var(--admin-accent); }

.status-active   { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:var(--success); }
.status-active::before  { content:''; width:6px; height:6px; border-radius:50%; background:var(--success); }
.status-inactive { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#9ca3af; }
.status-inactive::before { content:''; width:6px; height:6px; border-radius:50%; background:#9ca3af; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; margin-right:4px; }
.row-action:hover { background:var(--admin-accent-soft); color:var(--admin-accent); }

.toggle-btn { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--admin-accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--admin-accent); }
.req { color:var(--danger); font-weight:700; }
.hint { color:var(--text-muted); font-weight:400; font-size:11px; }


/* Stepper */
.stepper { display:flex; align-items:center; gap:6px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border); }
.step    { display:flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:500; color:var(--text-muted); cursor:default; }
.step.done { cursor:pointer; }
.step-dot{ width:20px; height:20px; border-radius:50%; background:var(--border); color:var(--text-muted); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; transition:background 150ms,color 150ms; }
.step.active .step-dot { background:var(--admin-accent); color:#fff; }
.step.active .step-label{ color:var(--text-primary); font-weight:600; }
.step.done .step-dot { background:var(--success); color:#fff; }
.step.done .step-label { color:var(--text-secondary); }

.step-help { font-size:12px; color:var(--text-muted); margin:4px 0 0; line-height:1.5; }
.error-box { margin-top:12px; padding:10px 12px; border:1px solid #fecaca; background:rgba(220,38,38,0.08); border-radius:8px; color:var(--danger-hover); font-size:12.5px; display:flex; flex-direction:column; gap:3px; }

.code-badge { display:inline-block; padding:2px 8px; border-radius:6px; font-size:12px; font-weight:700; letter-spacing:.06em; font-variant-numeric:tabular-nums; background:rgba(239,68,68,0.12); color:var(--admin-accent); border:1px solid rgba(239,68,68,0.25); }

.btn-check { padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:12.5px; font-weight:600; cursor:pointer; white-space:nowrap; transition:background 100ms,border-color 100ms; }
.btn-check:hover:not(:disabled) { background:var(--admin-accent-soft); border-color:var(--admin-accent); color:var(--admin-accent); }
.btn-check:disabled { opacity:.5; cursor:default; }

.check-ok    { font-size:12px; font-weight:600; color:var(--success); }
.check-taken { font-size:12px; font-weight:600; color:var(--danger); }

</style>
