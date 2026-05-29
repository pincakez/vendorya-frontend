<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Suppliers</h1>
        <p class="page-sub">Manage suppliers and track outstanding purchase balances</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search supplier…" @input="onSearch" />
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Prefix</th>
            <th>Contact</th>
            <th>Outstanding Balance</th>
            <th style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="suppliers.length === 0">
            <td colspan="5" class="table-empty">
              <Building2 :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No suppliers yet</div>
            </td>
          </tr>
          <tr v-for="s in suppliers" :key="s.id" class="table-row">
            <td class="col-name">{{ s.name }}</td>
            <td>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="prefix-badge">{{ s.code_prefix }}</span>
                <Lock v-if="s.prefix_locked" :size="11" class="lock-icon" title="Prefix is locked" />
              </div>
            </td>
            <td class="col-contact">{{ s.contact_info || '—' }}</td>
            <td>
              <span v-if="Number(s.balance) > 0" class="balance-owe">{{ auth.currencySymbol }} {{ formatNumber(s.balance) }}</span>
              <span v-else class="balance-zero">—</span>
            </td>
            <td>
              <button class="row-action" @click="openEdit(s)"><Pencil :size="13" /></button>
              <button class="row-action danger" @click="deleteSupplier(s.id)"><Trash2 :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchSuppliers" />

    <!-- MODAL: New Supplier -->
    <AppModal :open="newModal.open" title="New Supplier" @close="closeNew">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Supplier Name <span class="req">*</span></label>
          <input v-model="newModal.name" class="form-input" placeholder="e.g. Al-Nour Textiles" />
        </div>
        <div>
          <label class="form-label">
            Supplier Code Prefix <span class="req">*</span>
            <span class="label-hint">— 3 digits (100–999), unique in your store</span>
          </label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input
              v-model="newModal.code_prefix"
              class="form-input"
              placeholder="e.g. 101"
              maxlength="3"
              style="width:90px;"
              @input="newModal.prefixCheck = null"
            />
            <button
              class="btn-check"
              :disabled="!newModal.code_prefix || newModal.code_prefix.length !== 3 || newModal.checkingPrefix"
              @click="checkNewPrefix"
            >
              {{ newModal.checkingPrefix ? '…' : 'Check' }}
            </button>
            <span v-if="newModal.prefixCheck === true"  class="check-ok">Available</span>
            <span v-else-if="newModal.prefixCheck === false" class="check-taken">Already taken</span>
          </div>
          <p class="field-note">Once registered, the prefix is permanent — it's embedded in every SKU of this supplier.</p>
        </div>
        <div>
          <label class="form-label">Contact Info <span class="label-hint">(optional)</span></label>
          <textarea v-model="newModal.contact_info" class="form-input" rows="2" placeholder="Phone, email, address…" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeNew">Cancel</button>
        <button
          class="btn-primary"
          :disabled="!newModal.name.trim() || newModal.prefixCheck !== true"
          @click="openConfirm"
        >
          Register Supplier
        </button>
      </template>
    </AppModal>

    <!-- MODAL: Confirm prefix lock -->
    <AppModal :open="confirmModal.open" title="Confirm Prefix Registration" @close="confirmModal.open = false">
      <div class="confirm-body">
        <div class="confirm-icon">
          <Lock :size="22" />
        </div>
        <p class="confirm-text">
          Register prefix <strong>{{ newModal.code_prefix }}</strong> for
          <strong>{{ newModal.name }}</strong>?
        </p>
        <p class="confirm-warn">This cannot be changed after confirmation. The prefix will be embedded in all SKUs generated for this supplier.</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="confirmModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="submitNew">
          {{ saving ? 'Creating…' : 'Confirm & Register' }}
        </button>
      </template>
    </AppModal>

    <!-- MODAL: Edit Supplier -->
    <AppModal :open="editModal.open" title="Edit Supplier" @close="closeEdit">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Supplier Name</label>
          <input v-model="editModal.name" class="form-input" placeholder="e.g. Al-Nour Textiles" />
        </div>
        <div>
          <label class="form-label">Supplier Code Prefix</label>
          <div style="display:flex;align-items:center;gap:8px;">
            <input
              :value="editModal.code_prefix"
              class="form-input locked-input"
              style="width:90px;"
              disabled
            />
            <Lock :size="13" class="lock-icon" />
            <span style="font-size:12px;color:var(--text-muted);">Locked — embedded in all SKUs</span>
          </div>
        </div>
        <div>
          <label class="form-label">Contact Info <span class="label-hint">(optional)</span></label>
          <textarea v-model="editModal.contact_info" class="form-input" rows="2" placeholder="Phone, email, address…" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeEdit">Cancel</button>
        <button class="btn-primary" :disabled="!editModal.name.trim() || saving" @click="saveEdit">
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Search, Building2, Pencil, Trash2, Lock } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const auth = useAuthStore()
const qab  = useQABStore()

const suppliers = ref([])
const loading   = ref(false)
const saving    = ref(false)
const total     = ref(0)
const page      = ref(1)
const pageSize  = 20
const search    = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchSuppliers(1), 350)
}

async function fetchSuppliers(p = 1) {
  loading.value = true
  page.value = p
  try {
    const res = await api.get('/api/inventory/suppliers/', {
      params: { page: p, page_size: pageSize, search: search.value || undefined },
    })
    suppliers.value = res.data.results ?? res.data
    total.value     = res.data.count   ?? suppliers.value.length
  } catch { suppliers.value = [] } finally { loading.value = false }
}

async function deleteSupplier(id) {
  if (!confirm('Delete this supplier? This cannot be undone.')) return
  try {
    await api.delete(`/api/inventory/suppliers/${id}/`)
    fetchSuppliers(page.value)
  } catch (e) {
    alert(e.response?.data?.detail || 'Cannot delete — supplier may have linked purchases.')
  }
}

// --- New Supplier ---
function suggestPrefix() {
  return String(Math.floor(Math.random() * 900) + 100)
}

const newModal = reactive({
  open: false, name: '', code_prefix: '', contact_info: '',
  prefixCheck: null, checkingPrefix: false,
})
const confirmModal = reactive({ open: false })

function openNew() {
  Object.assign(newModal, {
    open: true, name: '', code_prefix: suggestPrefix(),
    contact_info: '', prefixCheck: null, checkingPrefix: false,
  })
}

function closeNew() { newModal.open = false }

async function checkNewPrefix() {
  newModal.checkingPrefix = true
  newModal.prefixCheck = null
  try {
    const res = await api.get('/api/inventory/suppliers/check-prefix/', { params: { prefix: newModal.code_prefix } })
    newModal.prefixCheck = res.data.available
  } catch { newModal.prefixCheck = false }
  finally { newModal.checkingPrefix = false }
}

function openConfirm() { confirmModal.open = true }

async function submitNew() {
  saving.value = true
  try {
    await api.post('/api/inventory/suppliers/', {
      name: newModal.name,
      code_prefix: newModal.code_prefix,
      contact_info: newModal.contact_info || '',
    })
    confirmModal.open = false
    closeNew()
    fetchSuppliers(1)
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error creating supplier')
  } finally { saving.value = false }
}

// --- Edit Supplier ---
const editModal = reactive({ open: false, id: null, name: '', code_prefix: '', contact_info: '' })

function openEdit(s) {
  Object.assign(editModal, { open: true, id: s.id, name: s.name, code_prefix: s.code_prefix, contact_info: s.contact_info || '' })
}

function closeEdit() { editModal.open = false }

async function saveEdit() {
  saving.value = true
  try {
    await api.patch(`/api/inventory/suppliers/${editModal.id}/`, {
      name: editModal.name,
      contact_info: editModal.contact_info || '',
    })
    closeEdit()
    fetchSuppliers(page.value)
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving supplier')
  } finally { saving.value = false }
}

onMounted(() => {
  fetchSuppliers()
  qab.setActions([{ id: 'new-supplier', label: 'New Supplier', icon: 'plus', handler: openNew }])
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
.search-input:focus { border-color:#2563eb; }

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
@keyframes shimmer { to { background-position:-200% 0; } }

.col-name    { font-weight:500; }
.col-contact { color:var(--text-muted); font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.prefix-badge { display:inline-block; padding:2px 8px; border-radius:6px; background:var(--bg-app); border:1px solid var(--border); font-family:monospace; font-size:12px; font-weight:700; color:var(--text-secondary); }
.lock-icon    { color:var(--text-muted); flex-shrink:0; }

.balance-owe  { font-weight:600; color:#dc2626; font-variant-numeric:tabular-nums; font-size:12.5px; }
.balance-zero { color:var(--text-muted); }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.label-hint  { font-weight:400; color:var(--text-muted); }
.req         { color:#dc2626; font-weight:700; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; resize:vertical; }
.form-input:focus { border-color:#2563eb; }
.locked-input { opacity:.6; cursor:not-allowed; background:var(--border); }

.field-note  { margin:4px 0 0; font-size:11.5px; color:var(--text-muted); line-height:1.4; }

.btn-check { padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:12.5px; font-weight:600; cursor:pointer; white-space:nowrap; transition:background 100ms,border-color 100ms; flex-shrink:0; }
.btn-check:hover:not(:disabled) { background:rgba(37,99,235,0.08); border-color:#2563eb; color:#2563eb; }
.btn-check:disabled { opacity:.5; cursor:default; }

.check-ok    { font-size:12px; font-weight:600; color:#16a34a; white-space:nowrap; }
.check-taken { font-size:12px; font-weight:600; color:#dc2626; white-space:nowrap; }

.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:#1d4ed8; }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }

/* Confirm modal */
.confirm-body { display:flex; flex-direction:column; align-items:center; gap:12px; padding:8px 0 4px; text-align:center; }
.confirm-icon { width:48px; height:48px; border-radius:50%; background:rgba(37,99,235,0.1); display:flex; align-items:center; justify-content:center; color:#2563eb; }
.confirm-text { font-size:15px; font-weight:500; color:var(--text-primary); margin:0; line-height:1.5; }
.confirm-warn { font-size:12.5px; color:var(--text-muted); margin:0; max-width:320px; line-height:1.5; }
</style>
