<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.expenses.title') }}</h1>
        <p class="page-sub">{{ t('finance.expenses.sub') }}</p>
      </div>
      <div class="header-right">
        <button v-if="activeTab === 'expenses' && auth.hasRole('MANAGER')" class="btn-primary" @click="openNewExpense"><Plus :size="14" /> {{ t('finance.expenses.exp_modal.title') }}</button>
        <button v-else-if="activeTab !== 'expenses' && auth.hasRole('ADMIN')" class="btn-primary" @click="openNewCat"><Plus :size="14" /> {{ t('finance.expenses.cat_modal.new_title') }}</button>
      </div>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" />
        {{ t('finance.expenses.tab_' + tab.id) }}
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
            <tr><th>{{ t('common.date') }}</th><th>{{ t('finance.expenses.col_category') }}</th><th>{{ t('finance.expenses.col_amount') }}</th><th v-if="treasuryOn">{{ t('finance.treasury.paid_from') }}</th><th>{{ t('common.description') }}</th><th style="width:60px;"></th></tr>
          </thead>
          <tbody>
            <tr v-if="expenses.length === 0">
              <td :colspan="treasuryOn ? 6 : 5" class="table-empty">
                <Wallet :size="32" style="opacity:.3;margin-bottom:8px;" />
                <div>{{ t('finance.expenses.empty') }}</div>
              </td>
            </tr>
            <tr v-for="e in expenses" :key="e.id" class="table-row">
              <td>{{ fmtDate(e.date) }}</td>
              <td>{{ categoryName(e.category) }}</td>
              <td class="col-amount"><Money :value="e.amount" /></td>
              <td v-if="treasuryOn" class="col-desc">{{ paidFromLabel(e) }}</td>
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
          <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('finance.expenses.cat_col_parent') }}</th><th style="width:80px;"></th></tr></thead>
          <tbody>
            <tr v-if="categories.length === 0">
              <td colspan="3" class="table-empty">{{ t('finance.expenses.cat_empty') }}</td>
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
    <AppModal :open="expModal.open" :title="t('finance.expenses.exp_modal.title')" @close="expModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('finance.expenses.exp_modal.category_label') }}</label>
          <select v-model="expModal.category" class="form-input">
            <option value="">{{ t('finance.expenses.exp_modal.select') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ t('finance.expenses.exp_modal.amount_label') }}</label>
          <input v-model="expModal.amount" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div>
          <label class="form-label">{{ t('finance.expenses.exp_modal.date_label') }}</label>
          <input v-model="expModal.date" type="date" class="form-input" />
        </div>
        <!-- Treasury on (s169c): which money box the expense is paid from — required -->
        <div v-if="treasuryOn">
          <BaseSelect v-model="expModal.paid_from" :options="paidFromOptions" :label="t('finance.treasury.paid_from')"
                      :placeholder="t('finance.treasury.f.pick_box')" />
          <p v-if="expBox" class="exp-help">{{ t('finance.treasury.in_box_now') }}: <Money :value="expBox.balance" /></p>
        </div>
        <div>
          <label class="form-label">{{ t('finance.expenses.exp_modal.description_label') }}</label>
          <textarea v-model="expModal.description" class="form-input" rows="2" :placeholder="t('finance.expenses.exp_modal.description_placeholder')" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="expModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!expModal.category || !expModal.amount || (treasuryOn && !expModal.paid_from) || expModal.saving" @click="saveExpense">{{ t('common.save') }}</button>
      </template>
    </AppModal>

    <!-- MODAL: Category -->
    <AppModal :open="catModal.open" :title="catModal.id ? t('finance.expenses.cat_modal.edit_title') : t('finance.expenses.cat_modal.new_title')" @close="catModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('common.name') }}</label>
          <input v-model="catModal.name" class="form-input" :placeholder="t('finance.expenses.cat_modal.name_placeholder')" />
        </div>
        <div>
          <label class="form-label">{{ t('finance.expenses.cat_modal.parent_label') }}</label>
          <select v-model="catModal.parent" class="form-input">
            <option value="">{{ t('finance.expenses.cat_modal.parent_none') }}</option>
            <option v-for="c in categories.filter(c => c.id !== catModal.id)" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="catModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!catModal.name.trim()" @click="saveCat">{{ t('common.save') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Wallet, Tags, Trash2, Pencil, Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import { useCtrlN } from '@/composables/useCtrlN'
useCtrlN(openNewExpense)
import { useAuthStore } from '@/stores/auth'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { formatNumber } from '@/utils/format'
import { useFormatStore } from '@/stores/format'
import { showErrorToast } from '@/utils/toast'
import { fetchBoxes, boxName, boxOptionLabel, treasuryError } from '@/utils/treasury'

const { t } = useI18n()
const auth = useAuthStore()
const fmt  = useFormatStore()

// ── Treasury (s169c): "Paid from" a money box — only when the shop's switch is on ──
const treasuryOn = computed(() => fmt.treasuryEnabled)
const boxes = ref([])
const boxById = computed(() => Object.fromEntries(boxes.value.map(b => [b.id, b])))
const paidFromOptions = computed(() => boxes.value
  .filter(b => b.is_active && b.system_role !== 'UNSORTED')
  .map(b => ({ value: b.id, label: boxOptionLabel(t, b) })))
const expBox = computed(() => boxById.value[expModal.paid_from] || null)
function paidFromLabel(e) {
  if (!e.paid_from) return t('finance.treasury.before_treasury')
  return e.paid_from_name || boxName(t, boxById.value[e.paid_from])
}
watch(treasuryOn, async on => { if (on) boxes.value = await fetchBoxes() }, { immediate: true })

// Default box: the drawer of my open shift when I'm at the till, else the first cash box (the safe).
async function defaultPaidFrom() {
  let drawer = ''
  try {
    const { data } = await api.get('/api/finance/shifts/drawer/')
    drawer = data?.shift?.drawer || ''
  } catch { /* no shift */ }
  if (drawer && paidFromOptions.value.some(o => o.value === drawer)) return drawer
  const cash = boxes.value.find(b => b.is_active && b.kind === 'CASH')
  return cash?.id || ''
}

const tabs = [
  { id: 'expenses',   icon: Wallet },
  { id: 'categories', icon: Tags },
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
  if (!confirm(t('finance.expenses.confirm_delete_expense'))) return
  await api.delete(`/api/finance/expenses/${id}/`)
  fetchExpenses(page.value)
}

// Expense modal
const expModal = reactive({ open: false, category: '', amount: '', date: '', description: '', paid_from: '', saving: false })

async function openNewExpense() {
  Object.assign(expModal, { open: true, category: '', amount: '', date: new Date().toISOString().slice(0,10), description: '', paid_from: '', saving: false })
  if (treasuryOn.value) {
    boxes.value = await fetchBoxes()   // fresh balances
    expModal.paid_from = await defaultPaidFrom()
  }
}

async function saveExpense() {
  if (expModal.saving) return
  expModal.saving = true
  try {
    const body = {
      category: expModal.category,
      amount: expModal.amount,
      date: expModal.date,
      description: expModal.description,
      branch: auth.user?.store?.id,
    }
    if (treasuryOn.value) body.paid_from = expModal.paid_from
    await api.post('/api/finance/expenses/', body)
    expModal.open = false
    fetchExpenses(1)
    if (treasuryOn.value) boxes.value = await fetchBoxes()
  } catch (e) {
    showErrorToast(treasuryError(t, e, t('finance.expenses.save_failed')), 3500)
  } finally { expModal.saving = false }
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
  if (!confirm(t('finance.expenses.confirm_delete_category'))) return
  await api.delete(`/api/finance/expense-categories/${id}/`)
  fetchCategories()
}

onMounted(() => { fetchExpenses(); fetchCategories() })

function fmtDate(d) { return d ? new Date(d).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '—' }
</script>

<style scoped>

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
.col-amount { font-variant-numeric:tabular-nums; color:var(--danger); font-weight:600; }
.col-desc   { color:var(--text-muted); font-size:12px; max-width:220px; }
.exp-help   { font-size:12px; color:var(--text-muted); margin:6px 0 0; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:var(--danger-soft); color:var(--danger); }

</style>
