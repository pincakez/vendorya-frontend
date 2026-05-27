<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Subscription Plans</h1>
        <p class="page-sub">Pricing tiers sudo can assign to client stores. Free-form names, optional quotas.</p>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Plan</th>
            <th>Monthly</th>
            <th>Annual</th>
            <th>Quotas</th>
            <th>Active subs</th>
            <th>Status</th>
            <th style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!plans.length">
            <td colspan="7" class="table-empty">
              <PackageOpen :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No plans yet</div>
            </td>
          </tr>
          <tr v-for="p in plans" :key="p.id" class="table-row" :class="{ inactive: !p.is_active }">
            <td>
              <div style="display:flex;flex-direction:column;">
                <span style="font-weight:600;">{{ p.name }}</span>
                <span style="font-size:11.5px;color:var(--text-muted);">{{ p.description || '—' }}</span>
              </div>
            </td>
            <td style="font-variant-numeric:tabular-nums;">{{ p.monthly_price }} {{ p.currency }}</td>
            <td style="font-variant-numeric:tabular-nums;">{{ p.annual_price }} {{ p.currency }}</td>
            <td style="font-size:12px;color:var(--text-secondary);">
              <span v-if="p.max_users == null && p.max_branches == null && p.max_products == null && p.max_invoices_per_month == null">Unlimited</span>
              <span v-else>
                <span v-if="p.max_users != null">U:{{ p.max_users }} </span>
                <span v-if="p.max_branches != null">B:{{ p.max_branches }} </span>
                <span v-if="p.max_products != null">P:{{ p.max_products }} </span>
                <span v-if="p.max_invoices_per_month != null">I/mo:{{ p.max_invoices_per_month }}</span>
              </span>
            </td>
            <td style="font-variant-numeric:tabular-nums;">{{ p.active_subscriptions }}</td>
            <td>
              <span v-if="p.is_active" class="status-active">Active</span>
              <span v-else class="status-inactive">Disabled</span>
            </td>
            <td>
              <button class="row-action" title="Edit" @click="openEdit(p)"><Pencil :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal :open="modal.open" :title="modal.id ? 'Edit Plan' : 'New Plan'" @close="close">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Plan Name <span class="req">*</span></label>
          <input v-model="modal.name" class="form-input" placeholder="e.g. GO, Pro, Beta Friends" />
        </div>
        <div>
          <label class="form-label">Description</label>
          <textarea v-model="modal.description" rows="2" class="form-input" placeholder="Short note shown to sudo only" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div>
            <label class="form-label">Monthly Price</label>
            <input v-model="modal.monthly_price" type="number" min="0" step="0.01" class="form-input" />
          </div>
          <div>
            <label class="form-label">Annual Price</label>
            <input v-model="modal.annual_price" type="number" min="0" step="0.01" class="form-input" />
          </div>
          <div>
            <label class="form-label">Currency</label>
            <input v-model="modal.currency" class="form-input" placeholder="EGP" />
          </div>
        </div>

        <div class="quota-grid">
          <div>
            <label class="form-label">Max Users <span class="hint">(blank = unlimited)</span></label>
            <input v-model="modal.max_users" type="number" min="0" class="form-input" />
          </div>
          <div>
            <label class="form-label">Max Branches</label>
            <input v-model="modal.max_branches" type="number" min="0" class="form-input" />
          </div>
          <div>
            <label class="form-label">Max Products</label>
            <input v-model="modal.max_products" type="number" min="0" class="form-input" />
          </div>
          <div>
            <label class="form-label">Max Invoices / Month</label>
            <input v-model="modal.max_invoices_per_month" type="number" min="0" class="form-input" />
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;padding-top:4px;">
          <label class="form-label" style="margin:0;">Active</label>
          <button class="toggle-btn" :class="{ on: modal.is_active }" @click="modal.is_active = !modal.is_active">
            <span class="toggle-knob" />
          </button>
          <span style="font-size:12px;color:var(--text-muted);">{{ modal.is_active ? 'Available to assign' : 'Disabled — cannot be assigned' }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="close">Cancel</button>
        <button class="btn-admin" :disabled="!modal.name.trim() || saving" @click="save">
          {{ saving ? 'Saving…' : (modal.id ? 'Save Changes' : 'Create Plan') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Pencil, PackageOpen } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import { useQABStore } from '@/stores/qab'

const qab = useQABStore()
const plans = ref([])
const loading = ref(false)
const saving = ref(false)

async function fetchPlans() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/billing/plans/')
    plans.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { plans.value = [] } finally { loading.value = false }
}

const modal = reactive({
  open: false, id: null,
  name: '', description: '',
  monthly_price: '0', annual_price: '0', currency: 'EGP',
  max_users: '', max_branches: '', max_products: '', max_invoices_per_month: '',
  is_active: true,
})

function openNew() {
  Object.assign(modal, {
    open: true, id: null,
    name: '', description: '',
    monthly_price: '0', annual_price: '0', currency: 'EGP',
    max_users: '', max_branches: '', max_products: '', max_invoices_per_month: '',
    is_active: true,
  })
}

function openEdit(p) {
  Object.assign(modal, {
    open: true, id: p.id,
    name: p.name,
    description: p.description || '',
    monthly_price: p.monthly_price,
    annual_price: p.annual_price,
    currency: p.currency,
    max_users:    p.max_users    ?? '',
    max_branches: p.max_branches ?? '',
    max_products: p.max_products ?? '',
    max_invoices_per_month: p.max_invoices_per_month ?? '',
    is_active: p.is_active,
  })
}

function close() { modal.open = false }

function clean(v) { return v === '' || v === null ? null : Number(v) }

async function save() {
  saving.value = true
  try {
    const payload = {
      name: modal.name.trim(),
      description: modal.description,
      monthly_price: Number(modal.monthly_price || 0),
      annual_price:  Number(modal.annual_price  || 0),
      currency: modal.currency || 'EGP',
      max_users:    clean(modal.max_users),
      max_branches: clean(modal.max_branches),
      max_products: clean(modal.max_products),
      max_invoices_per_month: clean(modal.max_invoices_per_month),
      is_active: modal.is_active,
    }
    if (modal.id) await api.patch(`/api/admin/billing/plans/${modal.id}/`, payload)
    else          await api.post('/api/admin/billing/plans/', payload)
    close()
    fetchPlans()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving plan')
  } finally { saving.value = false }
}

onMounted(() => {
  fetchPlans()
  qab.setActions([{ id: 'new-plan', label: 'New Plan', icon: 'plus', handler: openNew }])
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody tr.table-row.inactive { opacity:.55; }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); vertical-align:top; }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.status-active   { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#16a34a; }
.status-active::before  { content:''; width:6px; height:6px; border-radius:50%; background:#16a34a; }
.status-inactive { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#9ca3af; }
.status-inactive::before{ content:''; width:6px; height:6px; border-radius:50%; background:#9ca3af; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover { background:var(--admin-accent-soft); color:var(--admin-accent); }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; font-family:inherit; }
.form-input:focus { border-color:var(--admin-accent); }
.quota-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.req { color:#dc2626; font-weight:700; }
.hint{ color:var(--text-muted); font-weight:400; font-size:11px; }

.toggle-btn { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--admin-accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
</style>
