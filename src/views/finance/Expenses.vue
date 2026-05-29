<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Expenses</h1>
        <p class="page-sub">Track store operating expenses by category</p>
      </div>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB: Expenses -->
    <div v-if="activeTab === 'expenses'">
      <div class="table-wrap">
        <div v-if="loading" class="table-skeleton">
          <div v-for="i in 6" :key="i" class="skeleton-row" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th style="width:60px;"></th></tr>
          </thead>
          <tbody>
            <tr v-if="expenses.length === 0">
              <td colspan="5" class="table-empty">
                <Wallet :size="32" style="opacity:.3;margin-bottom:8px;" />
                <div>No expenses recorded</div>
              </td>
            </tr>
            <tr v-for="e in expenses" :key="e.id" class="table-row">
              <td>{{ fmtDate(e.date) }}</td>
              <td>{{ categoryName(e.category) }}</td>
              <td class="col-amount">{{ auth.currencySymbol }} {{ formatNumber(e.amount) }}</td>
              <td class="col-desc">{{ e.description || '—' }}</td>
              <td>
                <button class="row-action danger" @click="deleteExpense(e.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchExpenses" />
    </div>

    <!-- TAB: Categories -->
    <div v-if="activeTab === 'categories'">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Parent</th><th style="width:80px;"></th></tr></thead>
          <tbody>
            <tr v-if="categories.length === 0">
              <td colspan="3" class="table-empty">No categories yet</td>
            </tr>
            <tr v-for="c in categories" :key="c.id" class="table-row">
              <td class="col-name">{{ c.name }}</td>
              <td>{{ categories.find(p => p.id === c.parent)?.name || '—' }}</td>
              <td>
                <button class="row-action" @click="openEditCat(c)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deleteCat(c.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: New Expense -->
    <AppModal :open="expModal.open" title="New Expense" @close="expModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Category</label>
          <select v-model="expModal.category" class="form-input">
            <option value="">Select…</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Amount</label>
          <input v-model="expModal.amount" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div>
          <label class="form-label">Date</label>
          <input v-model="expModal.date" type="date" class="form-input" />
        </div>
        <div>
          <label class="form-label">Description (optional)</label>
          <textarea v-model="expModal.description" class="form-input" rows="2" placeholder="What was this for?" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="expModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="!expModal.category || !expModal.amount" @click="saveExpense">Save</button>
      </template>
    </AppModal>

    <!-- MODAL: Category -->
    <AppModal :open="catModal.open" :title="catModal.id ? 'Edit Category' : 'New Category'" @close="catModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Name</label>
          <input v-model="catModal.name" class="form-input" placeholder="e.g. Utilities" />
        </div>
        <div>
          <label class="form-label">Parent (optional)</label>
          <select v-model="catModal.parent" class="form-input">
            <option value="">None</option>
            <option v-for="c in categories.filter(c => c.id !== catModal.id)" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="catModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="!catModal.name.trim()" @click="saveCat">Save</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { Wallet, Tags, Trash2, Pencil } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const auth = useAuthStore()
const qab  = useQABStore()

const tabs = [
  { id: 'expenses',   label: 'Expenses',   icon: Wallet },
  { id: 'categories', label: 'Categories', icon: Tags },
]
const activeTab = ref('expenses')

const expenses   = ref([])
const categories = ref([])
const loading    = ref(false)
const total      = ref(0)
const page       = ref(1)
const pageSize   = 20

function categoryName(id) {
  return categories.value.find(c => c.id === id)?.name || '—'
}

async function fetchExpenses(p = 1) {
  loading.value = true
  page.value = p
  try {
    const res = await api.get('/api/finance/expenses/', { params: { page: p, page_size: pageSize } })
    expenses.value = res.data.results ?? res.data
    total.value    = res.data.count ?? expenses.value.length
  } catch { expenses.value = [] } finally { loading.value = false }
}

async function fetchCategories() {
  try {
    const res = await api.get('/api/finance/expense-categories/')
    categories.value = res.data.results ?? res.data
  } catch {}
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return
  await api.delete(`/api/finance/expenses/${id}/`)
  fetchExpenses(page.value)
}

// Expense modal
const expModal = reactive({ open: false, category: '', amount: '', date: '', description: '' })

function openNewExpense() {
  Object.assign(expModal, { open: true, category: '', amount: '', date: new Date().toISOString().slice(0,10), description: '' })
}

async function saveExpense() {
  await api.post('/api/finance/expenses/', {
    category: expModal.category,
    amount: expModal.amount,
    date: expModal.date,
    description: expModal.description,
    branch: auth.user?.store?.id,
  })
  expModal.open = false
  fetchExpenses(1)
}

// Category modal
const catModal = reactive({ open: false, id: null, name: '', parent: '' })

function openNewCat()  { Object.assign(catModal, { open: true, id: null, name: '', parent: '' }) }
function openEditCat(c){ Object.assign(catModal, { open: true, id: c.id, name: c.name, parent: c.parent || '' }) }

async function saveCat() {
  const payload = { name: catModal.name, parent: catModal.parent || null }
  catModal.id
    ? await api.patch(`/api/finance/expense-categories/${catModal.id}/`, payload)
    : await api.post('/api/finance/expense-categories/', payload)
  catModal.open = false
  fetchCategories()
}

async function deleteCat(id) {
  if (!confirm('Delete this category?')) return
  await api.delete(`/api/finance/expense-categories/${id}/`)
  fetchCategories()
}

watch(activeTab, tab => {
  if (tab === 'expenses') {
    qab.setActions([{ id: 'new', label: 'New Expense', icon: 'plus', handler: openNewExpense }])
  } else {
    qab.setActions([{ id: 'new-cat', label: 'New Category', icon: 'plus', handler: openNewCat }])
  }
}, { immediate: true })

onMounted(() => { fetchExpenses(); fetchCategories() })
onUnmounted(() => qab.clearActions())

function fmtDate(d) { return d ? new Date(d).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '—' }
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:20px; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

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

.col-name   { font-weight:500; }
.col-amount { font-variant-numeric:tabular-nums; color:#dc2626; font-weight:600; }
.col-desc   { color:var(--text-muted); font-size:12px; max-width:220px; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
