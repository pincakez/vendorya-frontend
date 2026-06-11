<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Import / Export</h1>
        <p class="page-sub">Bulk-load your catalog from a CSV, or download it</p>
      </div>
      <button class="btn-ghost" :disabled="exporting" @click="doExport">
        <Download :size="15" /> {{ exporting ? 'Exporting…' : 'Export catalog (CSV)' }}
      </button>
    </div>

    <!-- IMPORT -->
    <div class="card">
      <div class="card-head">
        <Upload :size="16" /> <span>Import products</span>
      </div>

      <div class="card-body">
        <!-- file picker -->
        <label class="dropzone" :class="{ has: !!file }">
          <input type="file" accept=".csv" class="file-input" @change="onPick" />
          <FileText :size="20" />
          <span v-if="file" class="dz-name">{{ file.name }}</span>
          <span v-else class="dz-hint">Choose a <strong>.csv</strong> file…</span>
        </label>

        <div class="actions">
          <button class="btn-ghost" :disabled="!file || busy" @click="validate">
            {{ checking ? 'Checking…' : 'Check file' }}
          </button>
          <button class="btn-primary" :disabled="!report || !report.ok || busy" @click="commit">
            {{ importing ? 'Importing…' : (report && report.ok ? `Import ${report.summary.products} products` : 'Import') }}
          </button>
          <button v-if="file" class="btn-text" :disabled="busy" @click="reset">Clear</button>
        </div>

        <!-- report -->
        <div v-if="report" class="report">
          <div v-if="report.errors && report.errors.length" class="rep-box rep-err">
            <div class="rep-title"><XCircle :size="15" /> {{ report.errors.length }} error{{ report.errors.length === 1 ? '' : 's' }} — fix these and check again</div>
            <ul><li v-for="(e, i) in report.errors" :key="i">{{ e }}</li></ul>
          </div>

          <div v-else class="rep-box rep-ok">
            <div class="rep-title"><CheckCircle2 :size="15" /> Looks good — ready to import</div>
            <div class="rep-stats">
              <span><strong>{{ report.summary.products }}</strong> products</span>
              <span><strong>{{ report.summary.category_paths }}</strong> category branches</span>
              <span><strong>{{ report.summary.attributes }}</strong> attributes</span>
            </div>
          </div>

          <div v-if="report.warnings && report.warnings.length" class="rep-box rep-warn">
            <div class="rep-title"><AlertTriangle :size="15" /> {{ report.warnings.length }} warning{{ report.warnings.length === 1 ? '' : 's' }} (import still allowed)</div>
            <ul><li v-for="(w, i) in report.warnings" :key="i">{{ w }}</li></ul>
          </div>
        </div>

        <div v-if="done" class="rep-box rep-ok">
          <div class="rep-title"><CheckCircle2 :size="15" /> Imported {{ done }} products successfully.</div>
        </div>
      </div>
    </div>

    <!-- FORMAT HELP -->
    <div class="card">
      <div class="card-head"><BookOpen :size="16" /> <span>CSV format</span></div>
      <div class="card-body help">
        <p>CSV only. <strong>SKU is generated for you</strong> — never include it. The header row defines everything:</p>
        <table class="help-table">
          <tr><th>Column</th><th>Meaning</th></tr>
          <tr><td><code>A_SUPP</code> <span class="req">required</span></td><td>Existing supplier name (the file can’t create suppliers)</td></tr>
          <tr><td><code>M_BRANCH</code></td><td>Branch for the stock (defaults to <code>Main</code>)</td></tr>
          <tr><td><code>M_CAT</code> <span class="req">required</span></td><td>Main category</td></tr>
          <tr><td><code>S1_CAT</code> · <code>S2_CAT</code> · <code>S3_CAT</code></td><td>Sub-categories (max 4 tiers total)</td></tr>
          <tr><td><code>…_DD</code> · <code>…_FT</code> · <code>…_NO</code></td><td>Attributes: Dropdown · Free-text · Number (e.g. <code>BRAND_DD</code>)</td></tr>
          <tr><td><code>Q_QTY</code></td><td>Opening stock quantity (defaults to 0)</td></tr>
          <tr><td><code>W_PRICE</code> · <code>R_PRICE</code> <span class="req">required</span></td><td>Wholesale (cost) · Retail (sell)</td></tr>
          <tr><td><code>P_NAME</code></td><td>Optional — otherwise name = Brand + Model</td></tr>
        </table>
        <p class="help-note">Validation is all-or-nothing: a single bad row rejects the whole file with a clear message.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload, Download, FileText, XCircle, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-vue-next'
import api from '@/api/axios'

const file       = ref(null)
const report     = ref(null)
const done       = ref(0)
const checking   = ref(false)
const importing  = ref(false)
const exporting  = ref(false)
const busy = ref(false)

function onPick(e) {
  file.value = e.target.files[0] || null
  report.value = null
  done.value = 0
}
function reset() {
  file.value = null; report.value = null; done.value = 0
}

function buildForm() {
  const fd = new FormData()
  fd.append('file', file.value)
  return fd
}

// Let the browser set multipart/form-data + boundary (axios defaults to JSON).
const UPLOAD_CFG = { headers: { 'Content-Type': undefined } }

async function validate() {
  if (!file.value) return
  busy.value = true; checking.value = true; done.value = 0
  try {
    const { data } = await api.post('/api/inventory/catalog/import/validate/', buildForm(), UPLOAD_CFG)
    report.value = data
  } catch (e) {
    report.value = e.response?.data?.errors
      ? e.response.data
      : { ok: false, errors: [e.response?.data?.detail || 'Could not read the file.'], warnings: [], summary: {} }
  } finally { busy.value = false; checking.value = false }
}

async function commit() {
  if (!report.value?.ok) return
  busy.value = true; importing.value = true
  try {
    const { data } = await api.post('/api/inventory/catalog/import/commit/', buildForm(), UPLOAD_CFG)
    done.value = data.summary.created
    report.value = null
    file.value = null
  } catch (e) {
    report.value = e.response?.data?.errors
      ? e.response.data
      : { ok: false, errors: [e.response?.data?.detail || 'Import failed.'], warnings: [], summary: {} }
  } finally { busy.value = false; importing.value = false }
}

async function doExport() {
  exporting.value = true
  try {
    const res = await api.get('/api/inventory/catalog/export/', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = 'catalog_export.csv'
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  } catch {
    alert('Could not export the catalog.')
  } finally { exporting.value = false }
}
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; margin-top:20px; overflow:hidden; }
.card-head { display:flex; align-items:center; gap:8px; padding:13px 16px; border-bottom:1px solid var(--border); font-size:13.5px; font-weight:700; color:var(--text-primary); }
.card-head svg { color:var(--accent); }
.card-body { padding:16px; }

.dropzone { display:flex; align-items:center; gap:10px; padding:18px 16px; border:1.5px dashed var(--border); border-radius:10px; cursor:pointer; color:var(--text-muted); transition:border-color 120ms, background 120ms; }
.dropzone:hover { border-color:var(--accent); }
.dropzone.has { border-style:solid; border-color:var(--accent); color:var(--text-primary); background:var(--bg-app); }
.dropzone svg { color:var(--accent); flex-shrink:0; }
.file-input { display:none; }
.dz-name { font-weight:600; font-size:13px; }
.dz-hint { font-size:13px; }

.actions { display:flex; align-items:center; gap:10px; margin-top:14px; }

.report { margin-top:16px; display:flex; flex-direction:column; gap:12px; }
.rep-box { border-radius:10px; padding:12px 14px; border:1px solid var(--border); }
.rep-title { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:700; }
.rep-box ul { margin:8px 0 0; padding-left:20px; display:flex; flex-direction:column; gap:3px; }
.rep-box li { font-size:12.5px; }
.rep-err  { background:#fef2f2; border-color:#fecaca; color:#b91c1c; }
.rep-ok   { background:#f0fdf4; border-color:#bbf7d0; color:#15803d; }
.rep-warn { background:#fffbeb; border-color:#fde68a; color:#b45309; }
.rep-stats { display:flex; gap:16px; margin-top:8px; font-size:12.5px; color:var(--text-secondary); }

.help { color:var(--text-secondary); font-size:13px; }
.help p { margin:0 0 12px; }
.help-table { width:100%; border-collapse:collapse; }
.help-table th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); padding:6px 8px; border-bottom:1px solid var(--border); }
.help-table td { padding:7px 8px; border-bottom:1px solid var(--border); font-size:12.5px; vertical-align:top; }
.help-table code { background:var(--bg-app); border:1px solid var(--border); border-radius:4px; padding:1px 5px; font-size:12px; color:var(--text-primary); }
.req { font-size:10px; font-weight:700; color:var(--accent-hover); background:var(--accent-soft); border-radius:8px; padding:1px 6px; margin-left:4px; }
.help-note { margin-top:12px !important; font-size:12px; color:var(--text-muted); }

.btn-text { background:none; border:none; color:var(--text-muted); font-size:12.5px; cursor:pointer; text-decoration:underline; }
.btn-text:disabled { opacity:.5; cursor:default; }
</style>
