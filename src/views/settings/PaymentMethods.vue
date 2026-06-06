<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Payment Methods</h1>
        <p class="page-sub">Manage how customers can pay at your POS</p>
      </div>
      <button class="btn-primary" @click="openAdd">+ Add Method</button>
    </div>

    <div class="table-wrap" style="margin-top:24px">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="table-empty">Loading…</td></tr>
          <tr v-else-if="!methods.length"><td colspan="4" class="table-empty">No payment methods yet</td></tr>
          <tr v-for="m in methods" :key="m.id">
            <td style="font-weight:700;">{{ m.name }}</td>
            <td>
              <span v-if="m.is_cash" class="badge badge-blue">Cash</span>
              <span v-else-if="m.is_agel" class="badge badge-amber">Agel (Credit)</span>
              <span v-else class="badge badge-gray">Standard</span>
            </td>
            <td>
              <span :class="['badge', m.is_deleted ? 'badge-red' : 'badge-green']">
                {{ m.is_deleted ? 'Inactive' : 'Active' }}
              </span>
            </td>
            <td>
              <button v-if="!m.is_agel && !m.is_cash" class="btn-icon" @click="deleteMethod(m)">
                <Trash2 :size="15" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal v-if="showAdd" title="Add Payment Method" @close="showAdd = false" @submit="addMethod" submit-label="Add">
      <div class="field">
        <label>Name</label>
        <input v-model="form.name" class="form-input" placeholder="e.g. Bank Transfer" />
      </div>
      <div class="field">
        <label class="toggle-label">
          <span>Mark as Agel (credit)</span>
          <input type="checkbox" v-model="form.is_agel" />
        </label>
        <p class="field-hint">Enables credit-limit enforcement for this payment method</p>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const methods = ref([])
const loading = ref(true)
const showAdd = ref(false)
const form    = ref({ name: '', is_agel: false })

async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/finance/payment-methods/')
    methods.value = res.data.results || res.data
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openAdd() { form.value = { name: '', is_agel: false }; showAdd.value = true }

async function addMethod() {
  if (!form.value.name.trim()) return
  await api.post('/api/finance/payment-methods/', form.value)
  showAdd.value = false
  load()
}

async function deleteMethod(m) {
  if (!confirm(`Delete "${m.name}"?`)) return
  await api.delete(`/api/finance/payment-methods/${m.id}/`)
  load()
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
.badge-blue  { background: #dbeafe; color: #1d4ed8; }
.badge-amber { background: #fef3c7; color: #92400e; }
.badge-gray  { background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border); }
.badge-green { background: #dcfce7; color: #15803d; }
.badge-red   { background: #fef2f2; color: #dc2626; }
.btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; border-radius: 8px; }
.btn-icon:hover { background: #fef2f2; color: #dc2626; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.field label { font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.toggle-label { display: flex; align-items: center; justify-content: space-between; }
.field-hint { font-size: 12px; color: var(--text-muted); margin: 0; }
</style>
