<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Business Policies</h1>
        <p class="page-sub">Control how your store handles sales, stock, and credit</p>
      </div>
    </div>

    <div v-if="loading" class="skeleton-card" />
    <div v-else class="policies-grid">

      <!-- Stock Policy -->
      <div class="policy-card">
        <div class="policy-icon" style="background:var(--accent-soft);color:var(--accent);"><Package :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">Allow Negative Stock</div>
          <div class="policy-desc">When enabled, the POS can sell items even if stock reaches zero. When disabled, the POS blocks the sale and forces a stock check first.</div>
          <div class="policy-footer">
            <span class="policy-status" :class="form.allow_negative_stock ? 'status-on' : 'status-off'">
              {{ form.allow_negative_stock ? 'Enabled' : 'Disabled' }}
            </span>
            <button class="toggle-btn" :class="{ on: form.allow_negative_stock }" @click="toggle('allow_negative_stock')">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <!-- Credit Policy -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#dcfce7;color:#16a34a;"><CreditCard :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">Allow Credit Sales (Agel)</div>
          <div class="policy-desc">When enabled, customers can buy on credit — the outstanding amount is added to their balance. When disabled, all invoices must be paid in full at time of sale.</div>
          <div class="policy-footer">
            <span class="policy-status" :class="form.enable_agel_selling ? 'status-on' : 'status-off'">
              {{ form.enable_agel_selling ? 'Enabled' : 'Disabled' }}
            </span>
            <button class="toggle-btn" :class="{ on: form.enable_agel_selling }" @click="toggle('enable_agel_selling')">
              <span class="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <!-- Default Tax -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#fef3c7;color:#d97706;"><Percent :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">Default Tax</div>
          <div class="policy-desc">The tax applied automatically to new invoices if no tax is specified on the product. Set to "None" for tax-exempt stores.</div>
          <div class="policy-footer" style="gap:12px;">
            <select v-model="form.default_tax" class="tax-select">
              <option value="">None (Tax Exempt)</option>
              <option v-for="t in taxes" :key="t.id" :value="t.id">{{ t.name }} — {{ t.rate }}%</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Product Numbering Mode -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#f0fdf4;color:#16a34a;"><Hash :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">Product Numbering Mode</div>
          <div class="policy-desc">Controls how the 4-digit product counter (last segment of every SKU) is assigned when a new variant is created.</div>
          <div class="policy-footer" style="gap:8px;">
            <button
              class="mode-btn"
              :class="{ active: form.product_numbering_mode === 'PROGRESSIVE' }"
              @click="form.product_numbering_mode = 'PROGRESSIVE'"
            >
              Progressive
            </button>
            <button
              class="mode-btn"
              :class="{ active: form.product_numbering_mode === 'RANDOM' }"
              @click="form.product_numbering_mode = 'RANDOM'"
            >
              Random
            </button>
            <span style="font-size:12px;color:var(--text-muted);margin-left:4px;">
              {{ form.product_numbering_mode === 'PROGRESSIVE' ? '0001, 0002, 0003…' : 'random 4-digit slot' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Section: Security -->
      <div class="section-heading">Security</div>

      <!-- Note: 2FA is opt-in per user (Settings › Profile › Two-Factor Authentication). -->

      <!-- Session Timeout -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#e0e7ff;color:#4f46e5;"><Clock :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">Session Timeout</div>
          <div class="policy-desc">Automatically sign out a user after this many minutes of inactivity. Set to 0 to disable. (Max 1440 = 24h.)</div>
          <div class="policy-footer" style="gap:12px;">
            <input v-model.number="form.session_timeout_minutes" type="number" min="0" max="1440" class="num-input" />
            <span style="font-size:13px;color:var(--text-muted);">minutes</span>
          </div>
        </div>
      </div>

      <!-- IP Allowlist -->
      <div class="policy-card">
        <div class="policy-icon" style="background:#dcfce7;color:#16a34a;"><Globe :size="20" /></div>
        <div class="policy-body">
          <div class="policy-title">Owner / Admin Login IP Allowlist</div>
          <div class="policy-desc">Restrict OWNER and ADMIN logins to specific IP addresses or CIDR ranges (one per line or comma-separated). Leave empty to allow login from anywhere. Cashiers and Managers are not affected.</div>
          <textarea v-model="form.login_ip_allowlist" class="ip-area" rows="3"
            placeholder="e.g. 197.45.0.0/16&#10;102.40.21.7"></textarea>
        </div>
      </div>

    </div>

    <div class="save-bar">
      <button class="btn-primary" :disabled="saving" @click="save">
        {{ saving ? 'Saving…' : 'Save Policies' }}
      </button>
      <span v-if="saved" class="save-confirm"><CheckCircle :size="14" /> Saved</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Package, CreditCard, Percent, CheckCircle, Clock, Globe, Hash } from 'lucide-vue-next'
import api from '@/api/axios'

const loading = ref(false)
const saving  = ref(false)
const saved   = ref(false)
const taxes   = ref([])
const form    = reactive({
  allow_negative_stock: false, enable_agel_selling: true, default_tax: '',
  product_numbering_mode: 'PROGRESSIVE',
  force_2fa_managers: false, session_timeout_minutes: 0, login_ip_allowlist: '',
})

function toggle(field) { form[field] = !form[field] }

async function load() {
  loading.value = true
  try {
    const [settingsRes, taxRes] = await Promise.all([
      api.get('/api/core/settings/'),
      api.get('/api/inventory/taxes/'),
    ])
    Object.assign(form, {
      allow_negative_stock:    settingsRes.data.allow_negative_stock,
      enable_agel_selling:     settingsRes.data.enable_agel_selling,
      default_tax:             settingsRes.data.default_tax || '',
      product_numbering_mode:  settingsRes.data.product_numbering_mode || 'PROGRESSIVE',
      force_2fa_managers:      settingsRes.data.force_2fa_managers ?? false,
      session_timeout_minutes: settingsRes.data.session_timeout_minutes ?? 0,
      login_ip_allowlist:      settingsRes.data.login_ip_allowlist || '',
    })
    taxes.value = taxRes.data.results ?? taxRes.data
  } finally { loading.value = false }
}

async function save() {
  saving.value = true
  saved.value  = false
  try {
    await api.patch('/api/core/settings/', {
      allow_negative_stock:    form.allow_negative_stock,
      enable_agel_selling:     form.enable_agel_selling,
      default_tax:             form.default_tax || null,
      product_numbering_mode:  form.product_numbering_mode,
      force_2fa_managers:      form.force_2fa_managers,
      session_timeout_minutes: form.session_timeout_minutes || 0,
      login_ip_allowlist:      form.login_ip_allowlist || '',
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    const data = e.response?.data
    alert(data ? (typeof data === 'string' ? data : JSON.stringify(data)) : 'Error saving policies')
  } finally { saving.value = false }
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.skeleton-card { height:300px; border-radius:12px; background:var(--border); animation:shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

.policies-grid { display:flex; flex-direction:column; gap:14px; }

.policy-card { display:flex; gap:16px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px; transition:box-shadow 120ms; }
.policy-card:hover { box-shadow:0 2px 12px rgba(0,0,0,.07); }
.policy-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.policy-body { flex:1; min-width:0; }
.policy-title { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px; }
.policy-desc  { font-size:13px; color:var(--text-muted); line-height:1.5; margin-bottom:14px; }
.policy-footer { display:flex; align-items:center; justify-content:space-between; }

.policy-status { font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px; }
.status-on  { background:#dcfce7; color:#166534; }
.status-off { background:#f3f4f6; color:#6b7280; }

.toggle-btn  { width:44px; height:24px; border-radius:12px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--accent); }
.toggle-knob { position:absolute; width:18px; height:18px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:23px; }

.tax-select { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; min-width:220px; transition:border-color 120ms; }
.tax-select:focus { border-color:var(--accent); }

.section-heading { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin:18px 0 -4px; }

.num-input { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:90px; transition:border-color 120ms; }
.num-input:focus { border-color:var(--accent); }

.ip-area { width:100%; box-sizing:border-box; margin-top:6px; padding:9px 11px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; font-family:monospace; outline:none; resize:vertical; transition:border-color 120ms; }
.ip-area:focus { border-color:var(--accent); }

.save-bar { display:flex; align-items:center; gap:12px; margin-top:24px; }
.save-confirm { display:inline-flex; align-items:center; gap:5px; font-size:13px; color:#16a34a; font-weight:500; }

.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:9px 22px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }

.mode-btn { padding:6px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:12.5px; font-weight:600; cursor:pointer; transition:background 100ms,border-color 100ms,color 100ms; }
.mode-btn:hover { border-color:var(--accent); color:var(--accent); }
.mode-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }
</style>
