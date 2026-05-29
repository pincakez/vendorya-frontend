<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">AI Profiles</h1>
        <p class="page-sub">AI personas and profiles</p>
      </div>
      <button class="btn-api-reload" @click="openRefresh" :disabled="refreshing">
        <RefreshCw :size="14" :class="{'spin': refreshing}" />
        {{ refreshing ? 'Reloading…' : 'API Reload' }}
      </button>
    </div>

    <div v-if="loading" class="ap-skeleton" />

    <div v-else class="ap-layout">

      <!-- ── Sidebar ── -->
      <aside class="ap-sidebar">
        <div class="sidebar-section-label">Profiles</div>

        <nav class="profile-list">
          <div
            v-for="p in profiles" :key="p.id"
            class="profile-item"
            :class="{ selected: selectedId === p.id, 'is-active': p.is_active }"
            @click="selectProfile(p.id)"
          >
            <div class="pi-avatar" :style="avatarStyle(p.name)">{{ p.name.charAt(0).toUpperCase() }}</div>
            <div class="pi-info">
              <div class="pi-name">{{ p.name }}</div>
              <div v-if="p.is_active" class="active-chip">ACTIVE</div>
            </div>
            <button class="pi-delete" title="Delete profile" @click.stop="confirmDelete(p)">
              <Trash2 :size="13" />
            </button>
          </div>

          <div v-if="profiles.length === 0" class="sidebar-empty">No profiles yet.</div>
        </nav>

        <button v-if="profiles.length < 3" class="add-profile-btn" @click="startNew" :disabled="saving">
          <Plus :size="14" /> New Profile
        </button>
      </aside>

      <!-- ── Main editor panel ── -->
      <div class="ap-main">
        <div v-if="!selectedProfile" class="no-selection">
          <div class="no-sel-icon"><Sparkles :size="32" /></div>
          <p>Select a profile from the left, or create a new one.</p>
        </div>

        <div v-else class="profile-editor">

          <!-- Editor top bar: tabs + actions -->
          <div class="editor-topbar">
            <div class="tabs-nav">
              <button
                v-for="t in TABS" :key="t.key"
                class="tab-btn"
                :class="{ active: activeTab === t.key }"
                @click="activeTab = t.key"
              >{{ t.label }}</button>
            </div>
            <div class="editor-actions">
              <button
                v-if="!selectedProfile.is_active"
                class="btn-outline btn-sm"
                @click="activateProfile"
                :disabled="activating"
              >
                <Zap :size="13" /> {{ activating ? 'Activating…' : 'Set Active' }}
              </button>
              <span v-else class="active-chip" style="align-self:center;">ACTIVE</span>
              <button class="btn-primary btn-sm" @click="saveProfile" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <!-- Banners -->
          <div v-if="saveError || saveOk" style="padding:0 24px 0;">
            <p v-if="saveError" class="banner-error">{{ saveError }}</p>
            <p v-if="saveOk" class="banner-ok">Saved successfully.</p>
          </div>

          <!-- ── Tab: Identity ── -->
          <div v-if="activeTab === 'identity'" class="tab-body">
            <div class="form-section">
              <div class="form-section-title">Profile Identity</div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Profile Name</label>
                  <p class="hint-text">Used to identify this persona in the UI.</p>
                </div>
                <div class="field-control-col">
                  <input v-model="draft.name" class="form-input" style="max-width:320px;" placeholder="e.g. Gemini Assistant" />
                </div>
              </div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Avatar</label>
                  <p class="hint-text">JPG/PNG, max 2 MB. Falls back to initials.</p>
                </div>
                <div class="field-control-col" style="display:flex;align-items:center;gap:14px;">
                  <div class="pc-avatar lg" :style="avatarStyle(draft.name || 'A')">
                    {{ (draft.name || 'A').charAt(0).toUpperCase() }}
                  </div>
                  <label class="btn-outline btn-sm" style="cursor:pointer;">
                    Upload Image
                    <input type="file" accept="image/*" style="display:none;" @change="onAvatarChange" />
                  </label>
                </div>
              </div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Global Knowledge</label>
                  <p class="hint-text">When on, RAG searches the full knowledge base. When off, only industry-tagged chunks.</p>
                </div>
                <div class="field-control-col">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="draft.global_knowledge" />
                    <span class="toggle-track"><span class="toggle-thumb" /></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Tab: Model ── -->
          <div v-if="activeTab === 'model'" class="tab-body">

            <div class="form-section">
              <div class="form-section-title">Model Selection</div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Model</label>
                  <p class="hint-text">Sourced from Gemini API. Use Refresh Models to update.</p>
                </div>
                <div class="field-control-col">
                  <select v-model="draft.model_id" class="form-select" style="max-width:320px;" @change="onModelChange">
                    <option value="">— Select a model —</option>
                    <option v-for="m in chatModels" :key="m.model_id" :value="m.model_id">
                      {{ m.display_name || m.model_id }}
                    </option>
                  </select>
                  <div v-if="selectedModel" class="quota-chips" style="margin-top:8px;">
                    <span class="quota-chip rpm">RPM {{ selectedModel.rpm ?? '—' }}</span>
                    <span class="quota-chip rpd">RPD {{ selectedModel.rpd ?? '—' }}</span>
                    <span class="quota-chip tok">Tokens {{ selectedModel.tokens != null ? fmtNum(selectedModel.tokens) : '—' }}</span>
                  </div>
                </div>
              </div>

              <div v-if="selectedModel?.supports_vision" class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Vision Resolution</label>
                  <p class="hint-text">Controls how image inputs are processed.</p>
                </div>
                <div class="field-control-col">
                  <select v-model="draft.vision_resolution" class="form-select" style="max-width:200px;">
                    <option value="AUTO">Auto</option>
                    <option value="LOW">Low (faster, cheaper)</option>
                    <option value="HIGH">High (more detail)</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">Generation Parameters</div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Max Output Tokens</label>
                  <p class="hint-text">Leave blank to use model default.</p>
                </div>
                <div class="field-control-col">
                  <input
                    v-model.number="draft.max_output_tokens"
                    type="number" min="1"
                    class="form-input"
                    style="max-width:140px;"
                    placeholder="Model default"
                  />
                </div>
              </div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">
                    Thinking Level
                    <span v-if="selectedModel && !selectedModel.supports_thinking" class="unsupported-label">Not supported</span>
                  </label>
                  <p class="hint-text">Extended thinking for complex reasoning.</p>
                </div>
                <div class="field-control-col">
                  <select
                    v-model="draft.thinking_level"
                    class="form-select"
                    style="max-width:180px;"
                    :disabled="selectedModel && !selectedModel.supports_thinking"
                  >
                    <option value="OFF">Off</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Temperature <span class="range-hint">0.0 – 2.0</span></label>
                  <p class="hint-text">0 = deterministic · 1 = balanced · 2 = creative</p>
                </div>
                <div class="field-control-col">
                  <div style="display:flex;align-items:center;gap:10px;max-width:340px;">
                    <input
                      v-model.number="draft.temperature"
                      type="range" min="0" max="2" step="0.01"
                      class="temp-slider"
                      style="flex:1;"
                      :disabled="draft.temperature === null || draft.temperature === undefined"
                    />
                    <input
                      v-model.number="draft.temperature"
                      type="number" min="0" max="2" step="0.01"
                      class="form-input"
                      style="width:74px;"
                      placeholder="—"
                      @blur="clampTemp"
                    />
                    <button class="btn-ghost-sm" @click="draft.temperature = null">Reset</button>
                  </div>
                </div>
              </div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Top-P <span class="range-hint">0.0 – 1.0</span></label>
                  <p class="hint-text">Nucleus sampling threshold.</p>
                </div>
                <div class="field-control-col">
                  <input
                    v-model.number="draft.top_p"
                    type="number" min="0" max="1" step="0.01"
                    class="form-input"
                    style="max-width:120px;"
                    placeholder="Model default"
                    @blur="clampTopP"
                  />
                </div>
              </div>

              <div class="field-row">
                <div class="field-label-col">
                  <label class="form-label">Top-K</label>
                  <p class="hint-text">Limits the token pool for sampling.</p>
                </div>
                <div class="field-control-col">
                  <input
                    v-model.number="draft.top_k"
                    type="number" min="1"
                    class="form-input"
                    style="max-width:120px;"
                    placeholder="Model default"
                  />
                </div>
              </div>
            </div>

            <div class="form-section" style="border-bottom:none;">
              <div class="form-section-title">Features</div>

              <div class="field-row" style="margin-bottom:0;">
                <div class="field-label-col">
                  <label class="form-label">
                    Google Grounding
                    <span v-if="selectedModel && !selectedModel.supports_grounding" class="unsupported-label">Not supported</span>
                  </label>
                  <p class="hint-text">Grounds responses with real-time Google Search results.</p>
                </div>
                <div class="field-control-col">
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      v-model="draft.google_grounding"
                      :disabled="selectedModel && !selectedModel.supports_grounding"
                    />
                    <span class="toggle-track"><span class="toggle-thumb" /></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Tab: Instructions ── -->
          <div v-if="activeTab === 'instructions'" class="tab-body">
            <div class="form-section" style="border-bottom:none;">
              <div class="form-section-title">System Instruction</div>
              <p class="hint-text" style="margin-bottom:16px;">Prepended to every conversation. Defines the persona's tone, expertise, and constraints.</p>
              <textarea
                v-model="draft.system_instruction"
                class="form-textarea"
                rows="20"
                placeholder="You are a helpful ERP assistant for Vendorya. Be concise and professional…"
                dir="auto"
              />
            </div>
          </div>

          <!-- ── Tab: Functions ── -->
          <div v-if="activeTab === 'functions'" class="tab-body">
            <div v-if="toolsLoading" class="ap-skeleton" style="height:120px;" />
            <template v-else>
              <div class="functions-header">
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--text-primary);">Tool Access</div>
                  <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">{{ enabledCount }} / {{ tools.length }} tools enabled for this profile</div>
                </div>
                <div style="display:flex;gap:8px;">
                  <button class="btn-ghost-sm" @click="enableAll">Enable All</button>
                  <button class="btn-ghost-sm" @click="disableAll">Disable All</button>
                </div>
              </div>
              <div class="tools-list">
                <div v-for="t in tools" :key="t.name" class="tool-row">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span class="tool-name">{{ t.name }}</span>
                      <span class="tool-badge" :class="t.write ? 'write' : 'read'">{{ t.write ? 'WRITE' : 'READ' }}</span>
                      <span v-if="t.requires_store" class="tool-badge store">STORE</span>
                    </div>
                    <div class="tool-desc">{{ t.description }}</div>
                  </div>
                  <label class="toggle-switch sm">
                    <input type="checkbox" :checked="isToolEnabled(t.name)" @change="toggleTool(t.name)" />
                    <span class="toggle-track"><span class="toggle-thumb" /></span>
                  </label>
                </div>
              </div>
            </template>
          </div>

          <!-- ── Tab: Knowledge Base ── -->
          <div v-if="activeTab === 'kb'" class="tab-body">
            <div class="kb-grid">
              <!-- Left: upload + doc list -->
              <div class="kb-left">
                <div
                  class="upload-zone"
                  :class="{ dragover: isDragOver }"
                  @dragover.prevent="isDragOver = true"
                  @dragleave="isDragOver = false"
                  @drop.prevent="onDrop"
                  @click="$refs.fileInput.click()"
                >
                  <UploadCloud :size="30" style="opacity:0.3;margin-bottom:8px;" />
                  <div style="font-size:13.5px;font-weight:600;">Drop a file or click to browse</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">PDF · DOCX · CSV · TXT</div>
                  <input ref="fileInput" type="file" accept=".pdf,.docx,.csv,.txt" style="display:none;" @change="onFileSelected" />
                </div>

                <div class="field-row" style="margin-top:14px;">
                  <label class="form-label">Industries (tags)</label>
                  <div class="tag-input-row">
                    <div v-for="(tag, i) in uploadIndustries" :key="i" class="tag-chip">
                      {{ tag }}
                      <button @click="uploadIndustries.splice(i,1)" class="tag-remove">×</button>
                    </div>
                    <input
                      v-model="industryInput"
                      class="tag-input"
                      placeholder="e.g. retail… Enter to add"
                      @keydown.enter.prevent="addIndustry"
                      @keydown.comma.prevent="addIndustry"
                    />
                  </div>
                </div>

                <button
                  class="btn-primary"
                  style="margin-top:10px;width:100%;"
                  :disabled="!pendingFile || uploading"
                  @click="uploadFile"
                >
                  <UploadCloud :size="14" />
                  {{ uploading ? 'Uploading…' : pendingFile ? `Upload "${pendingFile.name}"` : 'Select a file first' }}
                </button>
                <p v-if="uploadError" class="banner-error" style="margin-top:8px;">{{ uploadError }}</p>
                <p v-if="uploadOk" class="banner-ok" style="margin-top:8px;">{{ uploadOk }}</p>

                <div style="margin-top:24px;">
                  <div class="kb-section-label">Uploaded Documents</div>
                  <div v-if="kbLoading" class="ap-skeleton" style="height:60px;" />
                  <div v-else-if="!docGroups.length" style="font-size:13px;color:var(--text-muted);">No documents yet.</div>
                  <div v-else class="doc-list">
                    <div
                      v-for="doc in docGroups" :key="doc.source_name"
                      class="doc-row"
                      :class="{ selected: previewDoc === doc.source_name }"
                      @click="previewDoc = doc.source_name"
                    >
                      <FileText :size="14" style="flex-shrink:0;opacity:0.45;" />
                      <div style="flex:1;min-width:0;">
                        <div class="doc-name">{{ doc.source_name }}</div>
                        <div style="font-size:11px;color:var(--text-muted);">{{ doc.count }} chunk{{ doc.count !== 1 ? 's' : '' }}</div>
                      </div>
                      <button class="pi-delete visible" @click.stop="deleteDoc(doc)" title="Delete document">
                        <Trash2 :size="12" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: test retrieval + preview -->
              <div class="kb-right">
                <div class="kb-section-label">Test Retrieval</div>
                <div style="display:flex;gap:8px;">
                  <input v-model="searchQuery" class="form-input" placeholder="Ask something…" style="flex:1;" @keydown.enter="runSearch" />
                  <button class="btn-outline" @click="runSearch" :disabled="searching">
                    {{ searching ? '…' : 'Search' }}
                  </button>
                </div>
                <p v-if="searchError" class="banner-error" style="margin-top:6px;">{{ searchError }}</p>

                <div v-if="searchResults.length" class="search-results">
                  <div
                    v-for="(r, i) in searchResults" :key="r.id"
                    class="search-result"
                    :class="{ selected: previewChunk === r }"
                    @click="previewChunk = r; previewDoc = null"
                  >
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                      <span style="font-size:11px;font-weight:700;color:var(--admin-accent);">#{{ i+1 }}</span>
                      <span class="doc-name" style="flex:1;">{{ r.source_name }}</span>
                      <span style="font-size:11px;color:var(--text-muted);">{{ (1 - r.distance).toFixed(3) }}</span>
                    </div>
                    <p class="result-excerpt">{{ (r.content || '').slice(0, 180) }}{{ r.content?.length > 180 ? '…' : '' }}</p>
                  </div>
                </div>

                <template v-if="previewChunk || previewDocChunks.length">
                  <div class="kb-section-label" style="margin-top:20px;">Preview</div>
                  <div class="preview-panel">
                    <template v-if="previewChunk">
                      <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:6px;">{{ previewChunk.source_name }} · chunk {{ previewChunk.chunk_index }}</div>
                      <pre class="preview-text">{{ previewChunk.content }}</pre>
                    </template>
                    <template v-else>
                      <div v-for="c in previewDocChunks" :key="c.id" class="preview-chunk">
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Chunk {{ c.chunk_index }}</div>
                        <pre class="preview-text">{{ c.content }}</pre>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── Refresh Models Modal ── -->
    <AppModal :open="showRefreshModal" title="Model Refresh Results" width="640px" @close="showRefreshModal = false">
      <div v-if="refreshResult">
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
          <span class="diff-chip new">{{ refreshResult.added.length }} NEW</span>
          <span class="diff-chip del">{{ refreshResult.removed.length }} REMOVED</span>
          <span class="diff-chip ok">{{ refreshResult.kept.length }} OK</span>
        </div>
        <div class="diff-table">
          <div class="diff-row header">
            <span style="flex:1;">Model ID</span>
            <span style="width:60px;text-align:center;">Status</span>
          </div>
          <div v-for="m in refreshResult.added" :key="m" class="diff-row">
            <span style="flex:1;font-family:monospace;font-size:12px;">{{ m }}</span>
            <span class="diff-chip new" style="width:60px;justify-content:center;">NEW</span>
          </div>
          <div v-for="m in refreshResult.removed" :key="m" class="diff-row">
            <span style="flex:1;font-family:monospace;font-size:12px;opacity:0.6;text-decoration:line-through;">{{ m }}</span>
            <span class="diff-chip del" style="width:60px;justify-content:center;">DEL</span>
          </div>
          <div v-for="m in refreshResult.kept" :key="m" class="diff-row">
            <span style="flex:1;font-family:monospace;font-size:12px;">{{ m }}</span>
            <span class="diff-chip ok" style="width:60px;justify-content:center;">OK</span>
          </div>
        </div>
        <p style="font-size:11.5px;color:var(--text-muted);margin-top:12px;">Refreshed at {{ refreshResult.refreshed_at?.replace('T',' ').slice(0,19) }}</p>
      </div>
      <template #footer>
        <button class="btn-primary" @click="showRefreshModal = false">Done</button>
      </template>
    </AppModal>

    <!-- ── Delete Confirmation Modal ── -->
    <AppModal :open="showDeleteModal" title="Delete Profile" width="420px" @close="showDeleteModal = false">
      <p style="font-size:14px;">Delete <strong>{{ profileToDelete?.name }}</strong>? This cannot be undone.</p>
      <template #footer>
        <button class="btn-outline" @click="showDeleteModal = false">Cancel</button>
        <button class="btn-danger" @click="doDelete" :disabled="deleting">
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Plus, Trash2, RefreshCw, Zap, UploadCloud, FileText, Sparkles
} from 'lucide-vue-next'

import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'
const fmtNum = formatNumber

const TABS = [
  { key: 'identity',     label: 'Identity' },
  { key: 'model',        label: 'Model' },
  { key: 'instructions', label: 'Instructions' },
  { key: 'functions',    label: 'Functions' },
  { key: 'kb',           label: 'Knowledge Base' },
]

// ── state ──────────────────────────────────────────────────────────────────
const loading      = ref(true)
const profiles     = ref([])
const models       = ref([])
const tools        = ref([])
const kbChunks     = ref([])

const selectedId   = ref(null)
const activeTab    = ref('identity')
const draft        = ref({})
const enabledSet   = ref(new Set())

const saving       = ref(false)
const activating   = ref(false)
const saveError    = ref('')
const saveOk       = ref(false)

const toolsLoading = ref(false)
const kbLoading    = ref(false)

// refresh modal
const refreshing        = ref(false)
const showRefreshModal  = ref(false)
const refreshResult     = ref(null)

// delete modal
const showDeleteModal   = ref(false)
const profileToDelete   = ref(null)
const deleting          = ref(false)

// KB state
const isDragOver      = ref(false)
const pendingFile     = ref(null)
const uploadIndustries = ref([])
const industryInput   = ref('')
const uploading       = ref(false)
const uploadError     = ref('')
const uploadOk        = ref('')
const searching       = ref(false)
const searchQuery     = ref('')
const searchResults   = ref([])
const searchError     = ref('')
const previewChunk    = ref(null)
const previewDoc      = ref(null)

// ── computed ───────────────────────────────────────────────────────────────
const selectedProfile = computed(() => profiles.value.find(p => p.id === selectedId.value) || null)

const chatModels = computed(() =>
  models.value.filter(m => !m.model_id.includes('embedding'))
)

const selectedModel = computed(() =>
  models.value.find(m => m.model_id === draft.value.model_id) || null
)

const enabledCount = computed(() => {
  if (enabledSet.value.size === 0 || enabledSet.value.size === tools.value.length) return tools.value.length
  return enabledSet.value.size
})

const docGroups = computed(() => {
  const map = {}
  for (const c of kbChunks.value) {
    if (!map[c.source_name]) map[c.source_name] = { source_name: c.source_name, count: 0, ids: [] }
    map[c.source_name].count++
    map[c.source_name].ids.push(c.id)
  }
  return Object.values(map).sort((a, b) => a.source_name.localeCompare(b.source_name))
})

const previewDocChunks = computed(() => {
  if (!previewDoc.value) return []
  return kbChunks.value.filter(c => c.source_name === previewDoc.value).sort((a, b) => a.chunk_index - b.chunk_index)
})

// ── init ───────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const [pRes, mRes] = await Promise.all([
      api.get('/api/admin/ai/profiles/'),
      api.get('/api/admin/ai/models/'),
    ])
    profiles.value = Array.isArray(pRes.data) ? pRes.data : (pRes.data.results || [])
    models.value   = Array.isArray(mRes.data) ? mRes.data : (mRes.data.results || [])

    const active = profiles.value.find(p => p.is_active) || profiles.value[0]
    if (active) selectProfile(active.id)
  } catch (e) {
    console.error('Failed to load profiles', e)
  } finally {
    loading.value = false
  }
}

function selectProfile(id) {
  selectedId.value = id
  activeTab.value  = 'identity'
  saveError.value  = ''
  saveOk.value     = false
  const p = profiles.value.find(x => x.id === id)
  if (!p) return
  draft.value = {
    name:               p.name,
    global_knowledge:   p.global_knowledge,
    model_id:           p.model_id,
    vision_resolution:  p.vision_resolution,
    max_output_tokens:  p.max_output_tokens,
    thinking_level:     p.thinking_level,
    top_p:              p.top_p,
    top_k:              p.top_k,
    temperature:        p.temperature,
    google_grounding:   p.google_grounding,
    system_instruction: p.system_instruction,
    enabled_tools:      [...(p.enabled_tools || [])],
  }
  if (!p.enabled_tools || p.enabled_tools.length === 0) {
    enabledSet.value = new Set(tools.value.map(t => t.name))
  } else {
    enabledSet.value = new Set(p.enabled_tools)
  }
}

watch(activeTab, async (tab) => {
  if (tab === 'functions' && tools.value.length === 0) {
    toolsLoading.value = true
    try {
      const { data } = await api.get('/api/admin/ai/tools/')
      tools.value = data
      const p = selectedProfile.value
      if (p && (!p.enabled_tools || p.enabled_tools.length === 0)) {
        enabledSet.value = new Set(data.map(t => t.name))
      }
    } finally {
      toolsLoading.value = false
    }
  }
  if (tab === 'kb' && kbChunks.value.length === 0) {
    loadKB()
  }
})

async function loadKB() {
  kbLoading.value = true
  try {
    const { data } = await api.get('/api/admin/ai/kb/')
    kbChunks.value = Array.isArray(data) ? data : (data.results || [])
  } finally {
    kbLoading.value = false
  }
}

// ── save / activate ────────────────────────────────────────────────────────
async function saveProfile() {
  saveError.value = ''
  saveOk.value    = false
  saving.value    = true
  try {
    const allToolNames = tools.value.map(t => t.name)
    const et = allToolNames.length > 0 && enabledSet.value.size === allToolNames.length
      ? []
      : [...enabledSet.value]

    const payload = { ...draft.value, enabled_tools: et }
    const { data } = await api.patch(`/api/admin/ai/profiles/${selectedId.value}/`, payload)
    const idx = profiles.value.findIndex(p => p.id === selectedId.value)
    if (idx !== -1) profiles.value[idx] = data
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 3000)
  } catch (e) {
    const err = e.response?.data
    saveError.value = typeof err === 'string' ? err
      : err?.detail || err?.name?.[0] || JSON.stringify(err) || 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function activateProfile() {
  activating.value = true
  try {
    await api.post(`/api/admin/ai/profiles/${selectedId.value}/activate/`)
    profiles.value = profiles.value.map(p => ({ ...p, is_active: p.id === selectedId.value }))
  } catch (e) {
    saveError.value = 'Could not activate profile.'
  } finally {
    activating.value = false
  }
}

// ── new profile ────────────────────────────────────────────────────────────
async function startNew() {
  if (profiles.value.length >= 3) return
  saving.value = true
  try {
    const { data } = await api.post('/api/admin/ai/profiles/', {
      name: `Profile ${profiles.value.length + 1}`,
    })
    profiles.value.push(data)
    selectProfile(data.id)
  } catch (e) {
    saveError.value = e.response?.data?.detail || 'Could not create profile.'
  } finally {
    saving.value = false
  }
}

// ── delete ─────────────────────────────────────────────────────────────────
function confirmDelete(p) {
  profileToDelete.value = p
  showDeleteModal.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/api/admin/ai/profiles/${profileToDelete.value.id}/`)
    profiles.value = profiles.value.filter(p => p.id !== profileToDelete.value.id)
    if (selectedId.value === profileToDelete.value.id) {
      selectedId.value = profiles.value[0]?.id || null
      if (selectedId.value) selectProfile(selectedId.value)
      else draft.value = {}
    }
    showDeleteModal.value = false
  } catch {
    // stay open
  } finally {
    deleting.value = false
  }
}

// ── model tab ─────────────────────────────────────────────────────────────
function onModelChange() {
  const m = selectedModel.value
  if (!m) return
  if (!m.supports_thinking) draft.value.thinking_level = 'OFF'
  if (!m.supports_grounding) draft.value.google_grounding = false
}

function clampTopP() {
  const v = draft.value.top_p
  if (v !== null && v !== undefined && v !== '') {
    if (v < 0 || v > 1) draft.value.top_p = null
  }
}

function clampTemp() {
  const v = draft.value.temperature
  if (v !== null && v !== undefined && v !== '') {
    if (v < 0 || v > 2) draft.value.temperature = null
  }
}

// ── functions tab ─────────────────────────────────────────────────────────
function isToolEnabled(name) {
  if (tools.value.length === 0) return true
  return enabledSet.value.size === tools.value.length || enabledSet.value.has(name)
}

function toggleTool(name) {
  const allEnabled = enabledSet.value.size === tools.value.length
  if (allEnabled) {
    enabledSet.value = new Set(tools.value.map(t => t.name).filter(n => n !== name))
  } else if (enabledSet.value.has(name)) {
    enabledSet.value.delete(name)
    enabledSet.value = new Set(enabledSet.value)
  } else {
    enabledSet.value.add(name)
    enabledSet.value = new Set(enabledSet.value)
    if (enabledSet.value.size === tools.value.length) {
      enabledSet.value = new Set(tools.value.map(t => t.name))
    }
  }
}

function enableAll()  { enabledSet.value = new Set(tools.value.map(t => t.name)) }
function disableAll() { enabledSet.value = new Set() }

// ── KB tab ────────────────────────────────────────────────────────────────
function onDrop(e) {
  isDragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) pendingFile.value = f
}

function onFileSelected(e) {
  pendingFile.value = e.target.files?.[0] || null
}

function addIndustry() {
  const v = industryInput.value.trim().replace(/,$/, '')
  if (v && !uploadIndustries.value.includes(v)) uploadIndustries.value.push(v)
  industryInput.value = ''
}

async function uploadFile() {
  if (!pendingFile.value) return
  uploadError.value = ''
  uploadOk.value    = ''
  uploading.value   = true
  try {
    const form = new FormData()
    form.append('file', pendingFile.value)
    form.append('industries', JSON.stringify(uploadIndustries.value))
    const { data } = await api.post('/api/admin/ai/kb/upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    uploadOk.value    = `Uploaded! ${data.created} chunks created.`
    pendingFile.value = null
    await loadKB()
  } catch (e) {
    uploadError.value = e.response?.data?.error || 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

async function deleteDoc(doc) {
  for (const id of doc.ids) {
    await api.delete(`/api/admin/ai/kb/${id}/`).catch(() => {})
  }
  kbChunks.value = kbChunks.value.filter(c => c.source_name !== doc.source_name)
  if (previewDoc.value === doc.source_name) previewDoc.value = null
}

async function runSearch() {
  if (!searchQuery.value.trim()) return
  searchError.value   = ''
  searching.value     = true
  searchResults.value = []
  previewChunk.value  = null
  try {
    const { data } = await api.post('/api/admin/ai/kb/search/', {
      query: searchQuery.value.trim(), limit: 5,
    })
    searchResults.value = data
  } catch (e) {
    searchError.value = e.response?.data?.error || 'Search failed.'
  } finally {
    searching.value = false
  }
}

// ── refresh models ─────────────────────────────────────────────────────────
async function openRefresh() {
  refreshing.value = true
  try {
    const { data } = await api.post('/api/admin/ai/models/refresh/')
    refreshResult.value   = data
    showRefreshModal.value = true
    const mRes = await api.get('/api/admin/ai/models/')
    models.value = Array.isArray(mRes.data) ? mRes.data : (mRes.data.results || [])
  } catch (e) {
    alert(e.response?.data?.error || 'Model refresh failed. Check your API key.')
  } finally {
    refreshing.value = false
  }
}

// ── helpers ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#1e40af','rgba(30,64,175,0.18)'], ['#9333ea','rgba(147,51,234,0.18)'],
  ['#16a34a','rgba(22,163,74,0.18)'], ['#f97316','rgba(249,115,22,0.18)'],
  ['#0891b2','rgba(8,145,178,0.18)'],
]
function avatarStyle(name) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  const [color, bg] = AVATAR_COLORS[idx]
  return { background: bg, color }
}

onMounted(load)
</script>

<style scoped>
/* ── Page layout ────────────────────────────────────────────────────────── */
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:nowrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.ap-skeleton {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  min-height: 480px;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.ap-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 768px) {
  .ap-layout { grid-template-columns: 1fr; }
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
.ap-sidebar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: sticky;
  top: 16px;
}

.sidebar-section-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 6px;
  margin-bottom: 6px;
}

.profile-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 120ms, border-color 120ms;
  position: relative;
}
.profile-item:hover { background: var(--bg-card); }
.profile-item.selected {
  background: var(--bg-card);
  border-color: var(--admin-accent);
}
.profile-item.is-active .pi-name::after {
  content: '';
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #16a34a;
  margin-left: 6px;
  vertical-align: middle;
}

.pi-avatar {
  width: 34px; height: 34px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
  overflow: hidden;
}
.pc-avatar.lg { width: 52px; height: 52px; font-size: 22px; border-radius: 14px; overflow: hidden; }

.pi-info {
  flex: 1;
  min-width: 0;
}
.pi-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pi-delete {
  width: 24px; height: 24px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  color: var(--text-muted);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 100ms, background 100ms, color 100ms;
}
.profile-item:hover .pi-delete { opacity: 1; }
.pi-delete:hover { background: rgba(239,68,68,0.12); color: #ef4444; }
.pi-delete.visible { opacity: 1; }

.sidebar-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 6px;
  text-align: center;
}

.add-profile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1.5px dashed var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 120ms, color 120ms, background 120ms;
}
.add-profile-btn:hover {
  border-color: var(--admin-accent);
  color: var(--admin-accent);
  background: rgba(249,115,22,0.04);
}
.add-profile-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Main panel ─────────────────────────────────────────────────────────── */
.ap-main { min-width: 0; }

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: var(--text-muted);
  font-size: 13.5px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.no-sel-icon {
  width: 64px; height: 64px;
  border-radius: 18px;
  background: var(--bg-card);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
  color: var(--text-muted);
  opacity: 0.6;
}

/* ── Profile editor ─────────────────────────────────────────────────────── */
.profile-editor {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.editor-topbar {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  padding: 0 20px 0 4px;
  gap: 8px;
}

.tabs-nav {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-nav::-webkit-scrollbar { display: none; }

.tab-btn {
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 120ms, border-color 120ms;
  flex-shrink: 0;
}
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--admin-accent); border-bottom-color: var(--admin-accent); }

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tab-body { padding: 0; }

/* ── Form sections ──────────────────────────────────────────────────────── */
.form-section {
  padding: 24px 28px;
  border-bottom: 1px solid var(--border);
}

.form-section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.field-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px 24px;
  margin-bottom: 20px;
  align-items: start;
}
@media (max-width: 640px) {
  .field-row { grid-template-columns: 1fr; }
}

.field-label-col {}
.field-control-col {}

.form-label {
  display: block;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.hint-text {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 4px;
}

/* ── Active chip ─────────────────────────────────────────────────────────── */
.active-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(22,163,74,0.12);
  color: #16a34a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .05em;
}

/* ── Toggle ─────────────────────────────────────────────────────────────── */
.toggle-switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.toggle-switch input { display: none; }
.toggle-track {
  position: relative;
  width: 38px; height: 21px;
  border-radius: 99px;
  background: var(--border);
  transition: background 150ms;
  display: flex; align-items: center;
}
.toggle-switch input:checked + .toggle-track { background: var(--admin-accent); }
.toggle-switch input:disabled + .toggle-track { opacity: 0.45; cursor: not-allowed; }
.toggle-thumb {
  position: absolute;
  left: 3px;
  width: 15px; height: 15px;
  border-radius: 50%;
  background: #fff;
  transition: left 150ms;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-switch input:checked + .toggle-track .toggle-thumb { left: 20px; }
.toggle-switch.sm .toggle-track { width: 32px; height: 18px; }
.toggle-switch.sm .toggle-thumb { width: 12px; height: 12px; }
.toggle-switch.sm input:checked + .toggle-track .toggle-thumb { left: 17px; }

/* ── Form controls ──────────────────────────────────────────────────────── */
.form-textarea {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
  line-height: 1.65;
  transition: border-color 150ms;
}
.form-textarea:focus { outline: none; border-color: var(--admin-accent); }

.form-select {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 150ms;
  appearance: auto;
}
.form-select:focus { outline: none; border-color: var(--admin-accent); }
.form-select:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Model tab specifics ─────────────────────────────────────────────────── */
.quota-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.quota-chip {
  display: inline-flex; align-items: center;
  padding: 3px 9px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 600;
}
.quota-chip.rpm { background: rgba(59,130,246,0.12); color: #3b82f6; }
.quota-chip.rpd { background: rgba(22,163,74,0.12);  color: #16a34a; }
.quota-chip.tok { background: rgba(249,115,22,0.12);  color: var(--admin-accent); }

.range-hint {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 4px;
}

.unsupported-label {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
  background: var(--border);
  padding: 2px 7px;
  border-radius: 5px;
  margin-left: 6px;
}

.temp-slider {
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  outline: none;
  cursor: pointer;
}
.temp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--admin-accent);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* ── Functions tab ──────────────────────────────────────────────────────── */
.functions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 16px;
  border-bottom: 1px solid var(--border);
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 12px 20px 20px;
}

.tool-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 8px;
  transition: background 100ms;
}
.tool-row:hover { background: var(--bg-card); }

.tool-name {
  font-size: 12.5px;
  font-weight: 600;
  font-family: monospace;
  color: var(--text-primary);
}

.tool-badge {
  display: inline-flex; align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .05em;
}
.tool-badge.write { background: rgba(239,68,68,0.12);  color: #ef4444; }
.tool-badge.read  { background: rgba(59,130,246,0.12); color: #3b82f6; }
.tool-badge.store { background: rgba(249,115,22,0.12); color: var(--admin-accent); }

.tool-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1.5;
}

/* ── KB tab ─────────────────────────────────────────────────────────────── */
.kb-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.kb-left {
  padding: 24px 20px 24px 28px;
  border-right: 1px solid var(--border);
}
.kb-right {
  padding: 24px 28px 24px 20px;
  display: flex;
  flex-direction: column;
}
@media (max-width: 860px) {
  .kb-grid { grid-template-columns: 1fr; }
  .kb-left { border-right: none; border-bottom: 1px solid var(--border); }
}

.kb-section-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  background: var(--bg-card);
  border: 2px dashed var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 120ms, background 120ms;
}
.upload-zone:hover, .upload-zone.dragover {
  border-color: var(--admin-accent);
  background: rgba(249,115,22,0.04);
}

.tag-input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  min-height: 38px;
  align-items: center;
}
.tag-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px 2px 10px;
  background: rgba(249,115,22,0.12);
  color: var(--admin-accent);
  border-radius: 99px;
  font-size: 12px; font-weight: 500;
}
.tag-remove {
  background: transparent; color: inherit;
  font-size: 14px; line-height: 1;
  padding: 0 2px;
}
.tag-input {
  flex: 1; min-width: 100px;
  background: transparent; border: none; outline: none;
  font-size: 13px; color: var(--text-primary);
}

.doc-list { display: flex; flex-direction: column; gap: 2px; }
.doc-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 100ms;
  border: 1px solid transparent;
}
.doc-row:hover { background: var(--bg-card); }
.doc-row.selected { background: var(--bg-card); border-color: var(--admin-accent); }
.doc-name {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-results { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.search-result {
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 120ms;
}
.search-result:hover { border-color: var(--admin-accent); }
.search-result.selected { border-color: var(--admin-accent); box-shadow: 0 0 0 1px rgba(249,115,22,0.18); }
.result-excerpt { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin: 0; }

.preview-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  max-height: 420px;
  overflow-y: auto;
}
.preview-chunk { margin-bottom: 16px; }
.preview-text {
  font-size: 12px;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  line-height: 1.6;
  font-family: inherit;
}

/* ── Refresh modal ──────────────────────────────────────────────────────── */
.diff-chip {
  display: inline-flex; align-items: center;
  padding: 3px 10px;
  border-radius: 7px;
  font-size: 11.5px; font-weight: 700;
}
.diff-chip.new { background: rgba(22,163,74,0.15);  color: #16a34a; }
.diff-chip.del { background: rgba(239,68,68,0.12);  color: #ef4444; }
.diff-chip.ok  { background: var(--border); color: var(--text-muted); }

.diff-table { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; }
.diff-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px;
  border-radius: 7px;
  background: var(--bg-card);
}
.diff-row.header {
  background: transparent;
  font-size: 11px; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .05em;
}

/* ── Misc ───────────────────────────────────────────────────────────────── */
.banner-error {
  font-size: 12.5px;
  color: #ef4444;
  background: rgba(239,68,68,0.08);
  border-radius: 7px;
  padding: 8px 14px;
  margin: 12px 28px 0;
}
.banner-ok {
  font-size: 12.5px;
  color: var(--success, #16a34a);
  background: rgba(22,163,74,0.08);
  border-radius: 7px;
  padding: 8px 14px;
  margin: 12px 28px 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  border-radius: 9px;
  background: var(--admin-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 120ms, transform 80ms, opacity 100ms;
}
.btn-primary:hover    { background: #ea6c00; }
.btn-primary:active   { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: background 120ms, border-color 120ms;
}
.btn-outline:hover    { background: var(--bg-card); border-color: var(--admin-accent); color: var(--admin-accent); }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-api-reload {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 9px;
  background: var(--admin-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 120ms, transform 80ms, opacity 100ms;
}
.btn-api-reload:hover    { background: #ea6c00; }
.btn-api-reload:active   { transform: scale(0.97); }
.btn-api-reload:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-sm {
  padding: 6px 14px !important;
  font-size: 12.5px !important;
}

.btn-ghost-sm {
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  transition: background 100ms, color 100ms;
}
.btn-ghost-sm:hover { background: var(--bg-card); color: var(--text-primary); }

.btn-danger {
  padding: 8px 20px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  transition: background 120ms, transform 80ms;
}
.btn-danger:hover  { background: #dc2626; }
.btn-danger:active { transform: scale(0.97); }
.btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

</style>
