<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Taxes</h1>
        <p class="page-sub">Define tax rates to apply on sales invoices</p>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr><th>Name</th><th>Rate</th><th style="width:80px;"></th></tr>
        </thead>
        <tbody>
          <tr v-if="taxes.length === 0">
            <td colspan="3" class="table-empty">
              <Percent :size="28" style="opacity:.3;margin-bottom:8px;" />
              <div>No taxes defined yet</div>
            </td>
          </tr>
          <tr v-for="t in taxes" :key="t.id" class="table-row">
            <td class="col-name">{{ t.name }}</td>
            <td class="col-rate">{{ t.rate }}%</td>
            <td>
              <button class="row-action" @click="openEdit(t)"><Pencil :size="13" /></button>
              <button class="row-action danger" @click="deleteTax(t.id)"><Trash2 :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <AppModal :open="modal.open" :title="modal.id ? 'Edit Tax' : 'New Tax'" @close="modal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Tax Name</label>
          <input v-model="modal.name" class="form-input" placeholder="e.g. VAT, Sales Tax" />
        </div>
        <div>
          <label class="form-label">Rate (%)</label>
          <input v-model="modal.rate" type="number" min="0" max="100" step="0.01" class="form-input" placeholder="e.g. 14" style="width:120px;" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="modal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="!modal.name.trim() || modal.rate === '' || saving" @click="save">
          {{ saving ? 'Saving…' : (modal.id ? 'Save Changes' : 'Add Tax') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Percent, Pencil, Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import { useQABStore } from '@/stores/qab'
import AppModal from '@/components/ui/AppModal.vue'

const qab = useQABStore()

const taxes   = ref([])
const loading = ref(false)
const saving  = ref(false)

async function fetchTaxes() {
  loading.value = true
  try {
    const res = await api.get('/api/inventory/taxes/')
    taxes.value = res.data.results ?? res.data
  } catch { taxes.value = [] } finally { loading.value = false }
}

async function deleteTax(id) {
  if (!confirm('Delete this tax?')) return
  try {
    await api.delete(`/api/inventory/taxes/${id}/`)
    fetchTaxes()
  } catch (e) {
    alert(e.response?.data?.detail || 'Cannot delete — tax may be in use.')
  }
}

const modal = reactive({ open: false, id: null, name: '', rate: '' })

function openNew()    { Object.assign(modal, { open: true, id: null, name: '', rate: '' }) }
function openEdit(t)  { Object.assign(modal, { open: true, id: t.id, name: t.name, rate: t.rate }) }

async function save() {
  saving.value = true
  try {
    const payload = { name: modal.name, rate: modal.rate }
    modal.id
      ? await api.patch(`/api/inventory/taxes/${modal.id}/`, payload)
      : await api.post('/api/inventory/taxes/', payload)
    modal.open = false
    fetchTaxes()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving tax')
  } finally { saving.value = false }
}

onMounted(() => {
  fetchTaxes()
  qab.setActions([{ id: 'new-tax', label: 'New Tax', icon: 'plus', handler: openNew }])
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

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

.col-name { font-weight:500; }
.col-rate { font-variant-numeric:tabular-nums; font-weight:600; color:var(--accent); }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }
.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
