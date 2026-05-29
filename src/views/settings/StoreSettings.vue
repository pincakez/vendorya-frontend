<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Configure your store, branches and payment options</p>
      </div>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB: Store -->
    <div v-if="activeTab === 'store'">
      <div v-if="storeLoading" class="form-skeleton" />
      <div v-else class="settings-card">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Store Name</label>
            <input v-model="storeForm.name" class="form-input" placeholder="e.g. Trenda Fashion" />
          </div>
          <div class="form-group">
            <label class="form-label">Currency</label>
            <select v-model="storeForm.currency_id" class="form-input" style="width:220px;">
              <option v-for="c in currencies" :key="c.id" :value="c.id">
                {{ c.symbol }} — {{ c.name }} ({{ c.code }})
              </option>
            </select>
            <p class="form-hint">Used everywhere this store displays money. Sample: <strong>{{ sampleAmount }}</strong></p>
          </div>
          <div class="form-group">
            <label class="form-label">Timezone</label>
            <select v-model="storeForm.timezone" class="form-input" style="width:220px;">
              <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
            </select>
            <p class="form-hint">Time is set automatically by Vendorya servers — you just pick the zone for display.</p>
          </div>
        </div>

        <div class="section-divider">Number Formatting</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Decimal places</label>
            <select v-model.number="settingsForm.decimals" class="form-input" style="width:120px;">
              <option :value="0">0 (e.g. 100)</option>
              <option :value="1">1 (e.g. 100.5)</option>
              <option :value="2">2 (e.g. 100.50)</option>
              <option :value="3">3 (e.g. 100.500)</option>
              <option :value="4">4 (e.g. 100.5000)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Thousand separator</label>
            <div style="display:flex;align-items:center;gap:10px;height:34px;">
              <button class="toggle-btn" :class="{ on: settingsForm.thousands_separator }"
                      @click="settingsForm.thousands_separator = !settingsForm.thousands_separator">
                <span class="toggle-knob" />
              </button>
              <span style="font-size:12.5px;color:var(--text-muted);">
                {{ settingsForm.thousands_separator ? '1,234,567.89' : '1234567.89' }}
              </span>
            </div>
            <p class="form-hint">Off by default — cleaner for short receipts.</p>
          </div>
          <div class="form-group">
            <label class="form-label">Default Language</label>
            <select v-model="storeForm.default_language" class="form-input" style="width:160px;">
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div class="section-divider">Business Rules</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Default Tax</label>
            <select v-model="settingsForm.default_tax" class="form-input">
              <option value="">None</option>
              <option v-for="t in taxes" :key="t.id" :value="t.id">{{ t.name }} ({{ t.rate }}%)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tax ID / Betaka</label>
            <input v-model="settingsForm.tax_id" class="form-input" placeholder="Optional" />
          </div>
          <div class="form-group">
            <label class="form-label">Commercial Reg / Sogel</label>
            <input v-model="settingsForm.commercial_reg" class="form-input" placeholder="Optional" />
          </div>
        </div>

        <div class="section-divider">Contact Info</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input v-model="storeForm.phone_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp</label>
            <input v-model="storeForm.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <select v-model="storeForm.city" class="form-input">
              <option value="">— Select city —</option>
              <option v-for="c in egyptCities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Country</label>
            <input value="Egypt" class="form-input" disabled style="opacity:.55;cursor:not-allowed;" />
          </div>
        </div>

        <div class="toggle-row">
          <div class="toggle-item">
            <div>
              <div class="toggle-label">Allow Negative Stock</div>
              <div class="toggle-desc">If off, POS blocks sales when stock is zero</div>
            </div>
            <button class="toggle-btn" :class="{ on: settingsForm.allow_negative_stock }" @click="settingsForm.allow_negative_stock = !settingsForm.allow_negative_stock">
              <span class="toggle-knob" />
            </button>
          </div>
          <div class="toggle-item">
            <div>
              <div class="toggle-label">Allow Credit Sales (Agel)</div>
              <div class="toggle-desc">Let customers buy on credit and build a balance</div>
            </div>
            <button class="toggle-btn" :class="{ on: settingsForm.enable_agel_selling }" @click="settingsForm.enable_agel_selling = !settingsForm.enable_agel_selling">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>

        <div class="form-footer">
          <button class="btn-primary" :disabled="storeSaving" @click="saveStore">
            {{ storeSaving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TAB: Receipt -->
    <div v-if="activeTab === 'receipt'">
      <div class="settings-card">
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label">Receipt Header</label>
          <p class="form-hint">Shown at the top of every printed receipt</p>
          <textarea v-model="settingsForm.receipt_header" class="form-input" rows="4" placeholder="e.g. Welcome to Trenda Fashion&#10;Port-Said — Tel: 01234567890" />
        </div>
        <div class="form-group">
          <label class="form-label">Receipt Footer</label>
          <p class="form-hint">Shown at the bottom — return policy, thank-you message, etc.</p>
          <textarea v-model="settingsForm.receipt_footer" class="form-input" rows="4" placeholder="e.g. No returns after 7 days. Thank you!" />
        </div>
        <div class="form-footer">
          <button class="btn-primary" :disabled="storeSaving" @click="saveSettings">
            {{ storeSaving ? 'Saving…' : 'Save Receipt' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TAB: Branches -->
    <div v-if="activeTab === 'branches'">
      <div class="table-wrap">
        <div v-if="branchLoading" class="table-skeleton">
          <div v-for="i in 3" :key="i" class="skeleton-row" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr><th>Name</th><th>City</th><th>Street</th><th>Main</th><th style="width:60px;"></th></tr>
          </thead>
          <tbody>
            <tr v-if="branches.length === 0">
              <td colspan="5" class="table-empty">
                <GitBranch :size="28" style="opacity:.3;margin-bottom:8px;" />
                <div>No branches yet</div>
              </td>
            </tr>
            <tr v-for="b in branches" :key="b.id" class="table-row">
              <td class="col-name">{{ b.name }}</td>
              <td>{{ b.address_city }}</td>
              <td class="col-street">{{ b.address_street_1 }}</td>
              <td>
                <span v-if="b.is_main_branch" class="badge-main">Main</span>
              </td>
              <td>
                <button class="row-action" @click="openEditBranch(b)"><Pencil :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Payment Methods -->
    <div v-if="activeTab === 'payments'">
      <div class="table-wrap">
        <div v-if="pmLoading" class="table-skeleton">
          <div v-for="i in 3" :key="i" class="skeleton-row" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr><th>Name</th><th>Type</th><th style="width:60px;"></th></tr>
          </thead>
          <tbody>
            <tr v-if="paymentMethods.length === 0">
              <td colspan="3" class="table-empty">
                <CreditCard :size="28" style="opacity:.3;margin-bottom:8px;" />
                <div>No payment methods yet</div>
              </td>
            </tr>
            <tr v-for="pm in paymentMethods" :key="pm.id" class="table-row">
              <td class="col-name">{{ pm.name }}</td>
              <td><span :class="pm.is_cash ? 'badge-cash' : 'badge-digital'">{{ pm.is_cash ? 'Cash' : 'Digital' }}</span></td>
              <td>
                <button class="row-action" @click="openEditPM(pm)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deletePM(pm.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: Branch -->
    <AppModal :open="branchModal.open" :title="branchModal.id ? 'Edit Branch' : 'New Branch'" @close="branchModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Branch Name</label>
          <input v-model="branchModal.name" class="form-input" placeholder="e.g. Main Branch" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">City <span class="req">*</span></label>
            <select v-model="branchModal.city" class="form-input">
              <option value="">— Select city —</option>
              <option v-for="c in egyptCities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Country</label>
            <input value="Egypt" class="form-input" disabled style="opacity:.55;cursor:not-allowed;" />
          </div>
        </div>
        <div>
          <label class="form-label">Street Address</label>
          <input v-model="branchModal.street_1" class="form-input" placeholder="Street address" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Phone <span class="req">*</span></label>
            <input v-model="branchModal.phone_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div>
            <label class="form-label">WhatsApp</label>
            <input v-model="branchModal.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
        </div>
        <div>
          <label class="form-label">Email <span class="req">*</span></label>
          <input v-model="branchModal.email" class="form-input" placeholder="branch@example.com" type="email" />
        </div>
        <div class="toggle-row" style="padding:0;">
          <div class="toggle-item" style="padding:0;">
            <div>
              <div class="toggle-label">Main Branch</div>
            </div>
            <button class="toggle-btn" :class="{ on: branchModal.is_main_branch }" @click="branchModal.is_main_branch = !branchModal.is_main_branch">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="branchModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="!branchModal.name.trim() || !branchModal.phone_number.trim() || !branchModal.email.trim() || branchSaving" @click="saveBranch">
          {{ branchSaving ? 'Saving…' : (branchModal.id ? 'Save Changes' : 'Add Branch') }}
        </button>
      </template>
    </AppModal>

    <!-- MODAL: Payment Method -->
    <AppModal :open="pmModal.open" :title="pmModal.id ? 'Edit Payment Method' : 'New Payment Method'" @close="pmModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Name</label>
          <input v-model="pmModal.name" class="form-input" placeholder="e.g. Visa, InstaPay, Cash" />
        </div>
        <div class="toggle-row" style="padding:0;">
          <div class="toggle-item" style="padding:0;">
            <div>
              <div class="toggle-label">Is Cash</div>
              <div class="toggle-desc">Used for Cash Drawer tracking</div>
            </div>
            <button class="toggle-btn" :class="{ on: pmModal.is_cash }" @click="pmModal.is_cash = !pmModal.is_cash">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="pmModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="!pmModal.name.trim() || pmSaving" @click="savePM">
          {{ pmSaving ? 'Saving…' : (pmModal.id ? 'Save Changes' : 'Add Method') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { Store, Receipt, GitBranch, CreditCard, Pencil, Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import { useQABStore } from '@/stores/qab'
import { useFormatStore } from '@/stores/format'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'
import AppModal from '@/components/ui/AppModal.vue'

const qab = useQABStore()
const fmt = useFormatStore()
const auth = useAuthStore()

const tabs = [
  { id: 'store',    label: 'Store',            icon: Store },
  { id: 'receipt',  label: 'Receipt',          icon: Receipt },
  { id: 'branches', label: 'Branches',         icon: GitBranch },
  { id: 'payments', label: 'Payment Methods',  icon: CreditCard },
]
const activeTab = ref('store')

const egyptCities = [
  'Cairo', 'Alexandria', 'Giza', 'Port Said', 'Suez', 'Luxor', 'Aswan',
  'Ismailia', 'Mansoura', 'Tanta', 'Asyut', 'Fayoum', 'Zagazig', 'Damanhur',
  'Minya', 'Beni Suef', 'Sohag', 'Qena', 'Hurghada', 'Sharm El Sheikh',
  '6th of October City', 'New Cairo', 'Arish', 'Banha', 'Kafr El Sheikh',
  'Shibin El Kom', 'Marsa Matruh', 'Edfu', 'Kom Ombo', 'Qusair',
]

// Short list — the most useful IANA zones for our target markets.
const timezones = [
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Tripoli',
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Baghdad', 'Asia/Beirut',
  'Asia/Amman', 'Asia/Damascus', 'Asia/Jerusalem',
  'Europe/London', 'Europe/Paris', 'Europe/Istanbul',
  'America/New_York', 'America/Los_Angeles',
  'UTC',
]

// --- Store + Settings ---
const storeLoading = ref(false)
const storeSaving  = ref(false)
const storeForm    = reactive({
  name: '',
  currency_id: '',
  default_language: 'ar',
  timezone: 'Africa/Cairo',
  phone_number: '',
  whatsapp_number: '',
  city: '',
  country: 'Egypt',
})
const settingsForm = reactive({
  allow_negative_stock: false, enable_agel_selling: true,
  decimals: 2, thousands_separator: false,
  default_tax: '', tax_id: '', commercial_reg: '',
  receipt_header: '', receipt_footer: '',
})
const taxes      = ref([])
const currencies = ref([])

const sampleAmount = computed(() => {
  const cur = currencies.value.find(c => c.id === storeForm.currency_id)
  return formatCurrency(1234.5, {
    symbol:    cur?.symbol   ?? fmt.symbol,
    position:  cur?.position ?? fmt.position,
    decimals:  settingsForm.decimals,
    separator: settingsForm.thousands_separator,
  })
})

async function loadStore() {
  storeLoading.value = true
  try {
    const [storeRes, settingsRes, taxRes, curRes] = await Promise.all([
      api.get('/api/core/store/'),
      api.get('/api/core/settings/'),
      api.get('/api/inventory/taxes/'),
      api.get('/api/core/currencies/'),
    ])
    Object.assign(storeForm, {
      name: storeRes.data.name,
      currency_id: storeRes.data.currency?.id || '',
      default_language: storeRes.data.default_language,
      timezone: storeRes.data.timezone || 'Africa/Cairo',
      phone_number: storeRes.data.phone_number || '',
      whatsapp_number: storeRes.data.whatsapp_number || '',
      city: storeRes.data.city || '',
      country: storeRes.data.country || 'Egypt',
    })
    Object.assign(settingsForm, settingsRes.data)
    taxes.value      = taxRes.data.results ?? taxRes.data
    currencies.value = (curRes.data.results ?? curRes.data).filter(c => c.is_active)
  } finally { storeLoading.value = false }
}

async function saveStore() {
  storeSaving.value = true
  try {
    const [storeRes, settingsRes] = await Promise.all([
      api.patch('/api/core/store/', {
        name: storeForm.name,
        currency_id: storeForm.currency_id || null,
        default_language: storeForm.default_language,
        timezone: storeForm.timezone,
        phone_number: storeForm.phone_number,
        whatsapp_number: storeForm.whatsapp_number,
        city: storeForm.city,
        country: 'Egypt',
      }),
      api.patch('/api/core/settings/', {
        allow_negative_stock: settingsForm.allow_negative_stock,
        enable_agel_selling:  settingsForm.enable_agel_selling,
        decimals:             settingsForm.decimals,
        thousands_separator:  settingsForm.thousands_separator,
        default_tax: settingsForm.default_tax || null,
        tax_id:         settingsForm.tax_id,
        commercial_reg: settingsForm.commercial_reg,
      }),
    ])
    // Push the new rules through the app immediately.
    const cur = storeRes.data.currency
    fmt.apply({
      symbol:   cur?.symbol,
      position: cur?.position,
      decimals: settingsRes.data.decimals,
      thousands_separator: settingsRes.data.thousands_separator,
    })
    // Refresh the cached store payload (login response) so other tabs see it.
    if (auth.user?.store) {
      auth.user.store = { ...auth.user.store, currency: cur, timezone: storeRes.data.timezone }
      localStorage.setItem('vendorya_user', JSON.stringify(auth.user))
    }
  } finally { storeSaving.value = false }
}

async function saveSettings() {
  storeSaving.value = true
  try {
    await api.patch('/api/core/settings/', { receipt_header: settingsForm.receipt_header, receipt_footer: settingsForm.receipt_footer })
  } finally { storeSaving.value = false }
}

// --- Branches ---
const branches     = ref([])
const branchLoading = ref(false)
const branchSaving  = ref(false)
const branchModal   = reactive({ open: false, id: null, name: '', city: '', country: 'Egypt', street_1: '', is_main_branch: false, phone_number: '', whatsapp_number: '', email: '' })

async function fetchBranches() {
  branchLoading.value = true
  try {
    const res = await api.get('/api/core/branches/')
    branches.value = res.data.results ?? res.data
  } finally { branchLoading.value = false }
}

function openNewBranch()   { Object.assign(branchModal, { open: true, id: null, name: '', city: '', country: 'Egypt', street_1: '', is_main_branch: false, phone_number: '', whatsapp_number: '', email: '' }) }
function openEditBranch(b) { Object.assign(branchModal, { open: true, id: b.id, name: b.name, city: b.address_city, country: b.address_country, street_1: b.address_street_1, is_main_branch: b.is_main_branch, phone_number: b.phone_number || '', whatsapp_number: b.whatsapp_number || '', email: b.email || '' }) }

async function saveBranch() {
  branchSaving.value = true
  try {
    const payload = {
      name: branchModal.name, city: branchModal.city, country: 'Egypt',
      street_1: branchModal.street_1, is_main_branch: branchModal.is_main_branch,
      phone_number: branchModal.phone_number, email: branchModal.email,
      whatsapp_number: branchModal.whatsapp_number,
    }
    branchModal.id
      ? await api.patch(`/api/core/branches/${branchModal.id}/`, payload)
      : await api.post('/api/core/branches/', payload)
    branchModal.open = false
    fetchBranches()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving branch')
  } finally { branchSaving.value = false }
}

// --- Payment Methods ---
const paymentMethods = ref([])
const pmLoading      = ref(false)
const pmSaving       = ref(false)
const pmModal        = reactive({ open: false, id: null, name: '', is_cash: false })

async function fetchPMs() {
  pmLoading.value = true
  try {
    const res = await api.get('/api/finance/payment-methods/')
    paymentMethods.value = res.data.results ?? res.data
  } finally { pmLoading.value = false }
}

function openNewPM()   { Object.assign(pmModal, { open: true, id: null, name: '', is_cash: false }) }
function openEditPM(pm){ Object.assign(pmModal, { open: true, id: pm.id, name: pm.name, is_cash: pm.is_cash }) }

async function savePM() {
  pmSaving.value = true
  try {
    const payload = { name: pmModal.name, is_cash: pmModal.is_cash }
    pmModal.id
      ? await api.patch(`/api/finance/payment-methods/${pmModal.id}/`, payload)
      : await api.post('/api/finance/payment-methods/', payload)
    pmModal.open = false
    fetchPMs()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving payment method')
  } finally { pmSaving.value = false }
}

async function deletePM(id) {
  if (!confirm('Delete this payment method?')) return
  try {
    await api.delete(`/api/finance/payment-methods/${id}/`)
    fetchPMs()
  } catch (e) {
    alert(e.response?.data?.detail || 'Cannot delete — may be in use by payments.')
  }
}

// QAB per tab
watch(activeTab, tab => {
  if (tab === 'branches') qab.setActions([{ id: 'new-branch', label: 'New Branch', icon: 'plus', handler: openNewBranch }])
  else if (tab === 'payments') qab.setActions([{ id: 'new-pm', label: 'New Method', icon: 'plus', handler: openNewPM }])
  else qab.clearActions()

  if (tab === 'branches' && branches.value.length === 0) fetchBranches()
  if (tab === 'payments' && paymentMethods.value.length === 0) fetchPMs()
}, { immediate: true })

onMounted(() => loadStore())
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:20px; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

.settings-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.form-skeleton { height:320px; border-radius:12px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.form-grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; margin-bottom:20px; }
.form-group { display:flex; flex-direction:column; }
.form-label { font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-hint  { font-size:12px; color:var(--text-muted); margin:0 0 6px; }
.form-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:100%; box-sizing:border-box; transition:border-color 120ms; resize:vertical; }
.form-input:focus { border-color:var(--accent); }

.section-divider { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin:8px 0 16px; padding-bottom:8px; border-bottom:1px solid var(--border); }

.toggle-row  { display:flex; flex-direction:column; gap:12px; padding:16px 0; border-top:1px solid var(--border); margin-top:4px; }
.toggle-item { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.toggle-label { font-size:13px; font-weight:500; color:var(--text-primary); }
.toggle-desc  { font-size:12px; color:var(--text-muted); margin-top:2px; }
.toggle-btn  { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.form-footer { display:flex; justify-content:flex-end; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }

.col-name   { font-weight:500; }
.col-street { color:var(--text-muted); font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.badge-main    { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; background:var(--accent-soft); color:var(--accent-hover); }
.badge-cash    { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; background:#dcfce7; color:#166534; }
.badge-digital { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; background:#f3f4f6; color:#6b7280; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
.req { color:#dc2626; font-weight:700; }
</style>
