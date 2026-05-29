<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Alerts Center</h1>
        <p class="page-sub">Send notifications to stores and view history</p>
      </div>
    </div>

    <!-- Compose Card -->
    <div class="card compose-card">
      <div class="card-title">Send Admin Note</div>

      <div class="form-group">
        <label class="form-label">Title</label>
        <input v-model="form.title" class="form-input" placeholder="e.g. Scheduled maintenance tonight at 11pm" maxlength="200" />
      </div>

      <div class="form-group">
        <label class="form-label">Message <span class="optional">(optional)</span></label>
        <textarea v-model="form.body" class="form-input form-textarea" placeholder="Additional details..." rows="3"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Recipients</label>

        <label class="check-row">
          <input type="checkbox" v-model="form.allStores" />
          <span>All active stores</span>
        </label>

        <div v-if="!form.allStores" class="store-picker">
          <div class="store-search-wrap">
            <Search :size="14" class="search-icon" />
            <input
              v-model="storeQuery"
              class="store-search-input"
              placeholder="Search stores..."
              @input="searchStores"
            />
          </div>

          <div v-if="storeResults.length > 0" class="store-results">
            <button
              v-for="s in storeResults"
              :key="s.id"
              class="store-result-item"
              @click="addStore(s)"
            >
              {{ s.name }}
            </button>
          </div>

          <div v-if="form.selectedStores.length > 0" class="store-tags">
            <span v-for="s in form.selectedStores" :key="s.id" class="store-tag">
              {{ s.name }}
              <button class="tag-remove" @click="removeStore(s.id)">×</button>
            </span>
          </div>
          <p v-else-if="!storeQuery" class="form-hint">Search and select stores above.</p>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-primary" :disabled="sending || !canSend" @click="send">
          <Send :size="14" />
          {{ sending ? 'Sending...' : 'Send' }}
        </button>
        <span v-if="sendResult" class="send-result" :class="sendResult.ok ? 'ok' : 'err'">
          {{ sendResult.msg }}
        </span>
      </div>
    </div>

    <!-- History -->
    <div class="card history-card">
      <div class="history-head">
        <div class="card-title">History</div>

        <div class="history-store-pick">
          <label class="form-label" style="margin:0;white-space:nowrap;">Store</label>
          <select v-model="historyStoreId" class="form-input" style="width:220px;" @change="loadHistory(1)">
            <option value="">— pick a store —</option>
            <option v-for="s in allStores" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="!historyStoreId" class="history-empty">Select a store to view its history.</div>
      <div v-else-if="historyLoading" class="history-empty">Loading...</div>
      <div v-else-if="!history.length" class="history-empty">No admin notes for this store yet.</div>

      <div v-else class="history-list">
        <div v-for="n in history" :key="n.id" class="history-item">
          <div class="hi-title">{{ n.title }}</div>
          <div v-if="n.body" class="hi-body">{{ n.body }}</div>
          <div class="hi-meta">{{ formatDate(n.created_at) }}</div>
        </div>
      </div>

      <div v-if="historyPages > 1" class="pagination">
        <button class="pg-btn" :disabled="historyPage === 1" @click="loadHistory(historyPage - 1)">‹ Prev</button>
        <span class="pg-info">{{ historyPage }} / {{ historyPages }}</span>
        <button class="pg-btn" :disabled="historyPage === historyPages" @click="loadHistory(historyPage + 1)">Next ›</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Send } from 'lucide-vue-next'
import api from '@/api/axios'

const form = ref({
  title: '',
  body: '',
  allStores: false,
  selectedStores: [],
})

const storeQuery   = ref('')
const storeResults = ref([])
const allStores    = ref([])
const sending      = ref(false)
const sendResult   = ref(null)

const historyStoreId = ref('')
const history        = ref([])
const historyPage    = ref(1)
const historyPages   = ref(1)
const historyLoading = ref(false)

const canSend = computed(() =>
  form.value.title.trim() &&
  (form.value.allStores || form.value.selectedStores.length > 0)
)

async function loadAllStores() {
  try {
    const res = await api.get('/api/admin/stores/')
    allStores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch {}
}

async function searchStores() {
  const q = storeQuery.value.trim()
  if (!q) { storeResults.value = []; return }
  try {
    const res = await api.get('/api/admin/stores/', { params: { search: q } })
    const list = Array.isArray(res.data) ? res.data : (res.data.results || [])
    const selectedIds = new Set(form.value.selectedStores.map(s => s.id))
    storeResults.value = list.filter(s => !selectedIds.has(s.id)).slice(0, 6)
  } catch {}
}

function addStore(s) {
  if (!form.value.selectedStores.find(x => x.id === s.id)) {
    form.value.selectedStores.push(s)
  }
  storeQuery.value = ''
  storeResults.value = []
}

function removeStore(id) {
  form.value.selectedStores = form.value.selectedStores.filter(s => s.id !== id)
}

async function send() {
  if (!canSend.value) return
  sending.value = true
  sendResult.value = null
  try {
    const body = {
      title: form.value.title,
      body: form.value.body,
    }
    if (form.value.allStores) {
      body.all_stores = true
    } else {
      body.store_ids = form.value.selectedStores.map(s => s.id)
    }
    const res = await api.post('/api/admin/alerts/send/', body)
    sendResult.value = { ok: true, msg: `Sent to ${res.data.sent_to} store(s)` }
    form.value.title = ''
    form.value.body  = ''
    form.value.selectedStores = []
    form.value.allStores = false
    if (historyStoreId.value) loadHistory(1)
  } catch (e) {
    sendResult.value = { ok: false, msg: e.response?.data?.detail || 'Failed to send.' }
  } finally {
    sending.value = false
    setTimeout(() => { sendResult.value = null }, 4000)
  }
}

async function loadHistory(page = 1) {
  if (!historyStoreId.value) return
  historyLoading.value = true
  try {
    const res = await api.get('/api/admin/alerts/history/', {
      params: { store_id: historyStoreId.value, page }
    })
    history.value      = res.data.results || []
    historyPage.value  = res.data.page
    historyPages.value = res.data.pages
  } catch {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(loadAllStores)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.card        { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:20px; }
.card-title  { font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:16px; }

.form-group  { margin-bottom:14px; }
.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.optional    { font-weight:400; color:var(--text-muted); }
.form-input  { width:100%; padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:13.5px; outline:none; transition:border-color 150ms; box-sizing:border-box; }
.form-input:focus { border-color:var(--primary,#3b82f6); }
.form-textarea { resize:vertical; font-family:inherit; }
.form-hint   { font-size:12px; color:var(--text-muted); margin-top:5px; }

.check-row   { display:flex; align-items:center; gap:8px; font-size:13.5px; color:var(--text-primary); cursor:pointer; margin-bottom:10px; }
.check-row input { width:15px; height:15px; cursor:pointer; accent-color:var(--primary,#3b82f6); }

.store-picker      { }
.store-search-wrap { position:relative; }
.search-icon       { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.store-search-input{ width:100%; padding:8px 12px 8px 32px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:13.5px; outline:none; box-sizing:border-box; }
.store-search-input:focus { border-color:var(--primary,#3b82f6); }

.store-results     { border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-top:4px; background:var(--bg-card); }
.store-result-item { display:block; width:100%; padding:9px 12px; text-align:left; font-size:13px; background:none; border:none; border-bottom:1px solid var(--border); cursor:pointer; color:var(--text-primary); transition:background 100ms; }
.store-result-item:last-child { border-bottom:none; }
.store-result-item:hover { background:var(--bg-app); }

.store-tags  { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.store-tag   { display:inline-flex; align-items:center; gap:4px; background:rgba(59,130,246,0.1); color:var(--primary,#3b82f6); border:1px solid rgba(59,130,246,0.25); border-radius:20px; padding:3px 10px; font-size:12.5px; font-weight:500; }
.tag-remove  { background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:15px; line-height:1; padding:0 0 0 2px; }
.tag-remove:hover { color:var(--text-primary); }

.form-actions{ display:flex; align-items:center; gap:12px; margin-top:4px; }
.btn-primary { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:8px; background:var(--primary,#3b82f6); color:#fff; font-size:13.5px; font-weight:600; border:none; cursor:pointer; transition:background 120ms,transform 80ms; }
.btn-primary:hover   { background:#2563eb; }
.btn-primary:active  { transform:scale(0.97); }
.btn-primary:disabled{ opacity:.5; cursor:not-allowed; }
.send-result { font-size:13px; }
.send-result.ok  { color:#16a34a; }
.send-result.err { color:#ef4444; }

/* History */
.history-head       { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
.history-store-pick { display:flex; align-items:center; gap:8px; }
.history-empty      { padding:32px; text-align:center; color:var(--text-muted); font-size:13px; }

.history-list { }
.history-item { padding:12px 0; border-bottom:1px solid var(--border); }
.history-item:last-child { border-bottom:none; }
.hi-title     { font-size:13.5px; font-weight:600; color:var(--text-primary); }
.hi-body      { font-size:13px; color:var(--text-secondary); margin-top:3px; line-height:1.45; }
.hi-meta      { font-size:11.5px; color:var(--text-muted); margin-top:5px; }

.pagination  { display:flex; align-items:center; justify-content:center; gap:12px; padding-top:16px; border-top:1px solid var(--border); margin-top:12px; }
.pg-btn      { padding:6px 14px; border-radius:7px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-primary); font-size:13px; cursor:pointer; transition:background 100ms; }
.pg-btn:hover    { background:var(--bg-app); }
.pg-btn:disabled { opacity:.4; cursor:not-allowed; }
.pg-info     { font-size:13px; color:var(--text-muted); }
</style>
