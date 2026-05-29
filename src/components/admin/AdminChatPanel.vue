<template>
  <!-- Drag handle -->
  <div class="drag-handle" @mousedown="startDrag" @dblclick="resetWidth" />

  <!-- Panel -->
  <aside class="chat-panel" :style="{ width: width + 'px' }">
    <!-- Header -->
    <div class="panel-header">
      <div class="panel-avatar" :class="statusClass">
        <Bot :size="16" />
      </div>
      <div class="panel-title-block">
        <div class="panel-profile-name">{{ profileName }}</div>
        <div class="panel-status-row">
          <span class="status-dot" :class="statusClass" />
          <span class="panel-status-text">{{ statusText }}</span>
        </div>
      </div>
      <div style="flex:1;" />
      <button class="panel-icon-btn" title="New conversation" @click="newConversation">
        <SquarePen :size="15" />
      </button>
      <button class="panel-icon-btn" title="Close panel" @click="$emit('close')">
        <X :size="15" />
      </button>
    </div>

    <!-- Messages area -->
    <div class="messages-area" ref="messagesEl">
      <div v-if="!messages.length" class="chat-empty">
        <Bot :size="36" style="opacity:0.2;margin-bottom:10px;" />
        <div style="font-size:13px;color:var(--text-muted);">Start a conversation with the AI admin assistant.</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Type <code>/help</code> to see available commands.</div>
      </div>

      <template v-else>
        <div v-for="msg in messages" :key="msg.id" class="msg-row" :class="msg.role.toLowerCase()">
          <!-- Tool call events (inline, subtle) -->
          <template v-if="msg.role === 'TOOL'">
            <div class="tool-event">
              <Wrench :size="12" />
              <span>{{ msg.tool_label }}</span>
            </div>
          </template>

          <!-- User / model messages -->
          <template v-else-if="msg.role === 'USER' || msg.role === 'MODEL'">
            <div class="msg-bubble" :class="msg.role.toLowerCase()">
              <div class="msg-content" dir="auto" v-html="renderMarkdown(msg.content)" />
              <div v-if="msg.role === 'MODEL' && msg.usage?.total_tokens" class="msg-meta">
                {{ msg.usage.total_tokens }} tokens
              </div>
            </div>
          </template>

          <!-- System events (errors, etc.) -->
          <template v-else>
            <div class="system-event">{{ msg.content }}</div>
          </template>
        </div>

        <!-- Streaming placeholder -->
        <div v-if="streaming" class="msg-row model">
          <div class="msg-bubble model">
            <div class="msg-content" dir="auto" v-html="renderMarkdown(streamBuffer || '…')" />
          </div>
        </div>
      </template>
    </div>

    <!-- Slash command palette -->
    <Transition name="palette">
      <div v-if="showPalette" class="slash-palette">
        <div
          v-for="(cmd, i) in filteredCmds"
          :key="cmd.cmd"
          class="palette-item"
          :class="{ focused: paletteIdx === i }"
          @click="selectCmd(cmd)"
          @mouseenter="paletteIdx = i"
        >
          <span class="palette-cmd">{{ cmd.cmd }}</span>
          <span class="palette-desc">{{ cmd.desc }}</span>
        </div>
      </div>
    </Transition>

    <!-- Input area -->
    <div class="input-area">
      <div class="input-row">
        <!-- Attachment button -->
        <label class="attach-btn" title="Attach image or audio">
          <Paperclip :size="15" />
          <input
            ref="attachInput"
            type="file"
            accept="image/*,audio/*"
            style="display:none;"
            @change="onAttach"
          />
        </label>

        <!-- Textarea -->
        <textarea
          ref="inputEl"
          v-model="inputText"
          class="chat-input"
          rows="1"
          placeholder="Message…  (/ for commands)"
          dir="auto"
          @input="onInput"
          @keydown="onKeydown"
        />

        <!-- Send -->
        <button
          class="send-btn"
          :disabled="!canSend"
          @click="sendMessage"
          title="Send (Enter)"
        >
          <Send :size="15" />
        </button>
      </div>

      <!-- Attachment preview -->
      <div v-if="attachment" class="attachment-preview">
        <img v-if="attachment.mime_type?.startsWith('image/')" :src="attachment.previewUrl" class="att-thumb" />
        <div v-else class="att-file-label">
          <Paperclip :size="12" /> {{ attachment.name }}
        </div>
        <button class="att-remove" @click="clearAttachment">×</button>
      </div>

      <!-- Store context badge -->
      <div v-if="actingStore" class="context-badge">
        <Store :size="11" /> Acting as {{ actingStore.name }}
      </div>
    </div>

    <!-- History modal -->
    <AppModal :open="showHistory" title="Conversation History" width="520px" @close="showHistory = false">
      <div v-if="histLoading" style="text-align:center;padding:24px;color:var(--text-muted);">Loading…</div>
      <div v-else-if="!conversations.length" style="font-size:13px;color:var(--text-muted);padding:12px 0;">No past conversations.</div>
      <div v-else class="history-list">
        <div
          v-for="c in conversations" :key="c.id"
          class="history-item"
          :class="{ active: conversationId === c.id }"
          @click="loadConversation(c.id)"
        >
          <div class="hist-title">{{ c.title || c.first_message || 'Untitled' }}</div>
          <div class="hist-meta">{{ c.message_count }} msgs · {{ fmtDate(c.updated_at) }}</div>
        </div>
      </div>
    </AppModal>

    <!-- Profiles modal -->
    <AppModal :open="showProfiles" title="Switch Profile" width="480px" @close="showProfiles = false">
      <div v-if="allProfiles.length === 0" style="font-size:13px;color:var(--text-muted);">
        No profiles configured. <a href="/admin/ai-profiles" style="color:var(--admin-accent);">Create one →</a>
      </div>
      <div v-else class="profiles-list">
        <div
          v-for="p in allProfiles" :key="p.id"
          class="profile-switch-item"
          :class="{ active: p.is_active }"
          @click="switchProfile(p)"
        >
          <div class="psi-avatar" :style="avatarStyle(p.name)">{{ p.name.charAt(0).toUpperCase() }}</div>
          <div style="flex:1;">
            <div class="psi-name">{{ p.name }}</div>
            <div style="font-size:11.5px;color:var(--text-muted);">{{ p.model_id || 'No model' }}</div>
          </div>
          <span v-if="p.is_active" class="active-dot" />
        </div>
      </div>
    </AppModal>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Bot, X, SquarePen, Send, Paperclip, Wrench, Store } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const props = defineProps({
  width: { type: Number, default: 380 },
})
const emit = defineEmits(['close', 'resize'])

const auth = useAuthStore()

// ── Refs ────────────────────────────────────────────────────────────────────
const messagesEl     = ref(null)
const inputEl        = ref(null)
const attachInput    = ref(null)

const messages       = ref([])
const inputText      = ref('')
const streaming      = ref(false)
const streamBuffer   = ref('')
const conversationId = ref(null)

const profileName    = ref('AI Assistant')
const aiStatus       = ref('no_key')   // connected | no_key | error

const attachment     = ref(null)       // { name, mime_type, data (base64), previewUrl }

// slash commands
const showPalette  = ref(false)
const paletteIdx   = ref(0)
const paletteFilter = ref('')

// modals
const showHistory  = ref(false)
const showProfiles = ref(false)
const conversations = ref([])
const allProfiles   = ref([])
const histLoading   = ref(false)

// ── Slash command registry ──────────────────────────────────────────────────
const COMMANDS = [
  { cmd: '/history', aliases: ['/h'], desc: 'Browse past conversations' },
  { cmd: '/profiles',                desc: 'Switch active profile' },
  { cmd: '/clear',                   desc: 'Clear this conversation' },
  { cmd: '/help',                    desc: 'Show all commands' },
]

const filteredCmds = computed(() => {
  const q = paletteFilter.value.toLowerCase()
  if (!q || q === '/') return COMMANDS
  return COMMANDS.filter(c =>
    c.cmd.includes(q) || (c.aliases || []).some(a => a.includes(q)) || c.desc.toLowerCase().includes(q)
  )
})

// ── Status ──────────────────────────────────────────────────────────────────
const statusClass = computed(() => ({
  connected: aiStatus.value === 'connected',
  error:     aiStatus.value !== 'connected' && aiStatus.value !== 'no_key',
}))

const statusText = computed(() => {
  if (aiStatus.value === 'connected') return 'Connected'
  if (aiStatus.value === 'no_key')   return 'No API key'
  return 'Error'
})

const actingStore = computed(() => auth.activeStore || null)

const canSend = computed(() =>
  !streaming.value && (inputText.value.trim().length > 0 || attachment.value !== null)
)

// ── Init ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  loadStatus()
  loadActiveProfile()
})

async function loadStatus() {
  try {
    const { data } = await api.get('/api/admin/ai/status/')
    aiStatus.value = data.status
  } catch {
    aiStatus.value = 'error'
  }
}

async function loadActiveProfile() {
  try {
    const { data } = await api.get('/api/admin/ai/profiles/')
    const profiles = Array.isArray(data) ? data : (data.results || [])
    const active = profiles.find(p => p.is_active)
    if (active) profileName.value = active.name
    allProfiles.value = profiles
  } catch {}
}

// ── Input handling ──────────────────────────────────────────────────────────
function onInput() {
  // Auto-grow textarea
  const el = inputEl.value
  if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }

  // Slash palette
  const val = inputText.value
  if (val.startsWith('/')) {
    paletteFilter.value = val
    showPalette.value   = true
    paletteIdx.value    = 0
  } else {
    showPalette.value = false
  }
}

function onKeydown(e) {
  if (showPalette.value) {
    if (e.key === 'ArrowDown') { e.preventDefault(); paletteIdx.value = Math.min(paletteIdx.value + 1, filteredCmds.value.length - 1) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); paletteIdx.value = Math.max(paletteIdx.value - 1, 0) }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (filteredCmds.value[paletteIdx.value]) selectCmd(filteredCmds.value[paletteIdx.value])
      return
    }
    if (e.key === 'Escape') { showPalette.value = false; return }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function selectCmd(cmd) {
  showPalette.value = false
  inputText.value   = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  execCommand(cmd.cmd)
}

function execCommand(cmd) {
  const c = cmd.toLowerCase()
  if (c === '/history' || c === '/h') {
    openHistory()
  } else if (c === '/profiles') {
    openProfilesModal()
  } else if (c === '/clear') {
    clearConversation()
  } else if (c === '/help') {
    pushSystemMessage(
      COMMANDS.map(c => `**${c.cmd}** — ${c.desc}`).join('\n')
    )
  }
}

// ── Messaging ────────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text && !attachment.value) return
  if (streaming.value) return

  // Handle slash commands typed without selecting from palette
  if (text.startsWith('/')) {
    const parts = text.split(' ')
    const cmd = parts[0].toLowerCase()
    const knownCmds = COMMANDS.flatMap(c => [c.cmd, ...(c.aliases || [])])
    if (knownCmds.includes(cmd)) {
      inputText.value = ''
      if (inputEl.value) inputEl.value.style.height = 'auto'
      showPalette.value = false
      execCommand(cmd)
      return
    }
  }

  const userContent = text
  const att = attachment.value

  inputText.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  showPalette.value = false
  clearAttachment()

  pushMessage({ role: 'USER', content: userContent, attachments: att ? [att] : [] })
  streaming.value  = true
  streamBuffer.value = ''

  const token = localStorage.getItem('vendorya_access')
  const storeId = localStorage.getItem('vendorya_active_store')

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
  if (storeId) headers['X-Store-ID'] = storeId

  try {
    const resp = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/admin/ai/chat/`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: conversationId.value,
          prompt: userContent,
          attachments: att ? [{ mime_type: att.mime_type, data: att.data }] : [],
        }),
      }
    )

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}))
      pushSystemMessage(`Error ${resp.status}: ${body.error || resp.statusText}`)
      streaming.value = false
      return
    }

    await consumeSSE(resp.body)
  } catch (e) {
    pushSystemMessage(`Network error: ${e.message}`)
    streaming.value = false
  }
}

async function consumeSSE(body) {
  const reader  = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let currentEvent = ''
  let modelContent = ''
  let modelUsage   = {}
  let toolCalls    = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      const lines = buf.split('\n')
      buf = lines.pop()

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          let payload
          try { payload = JSON.parse(line.slice(6)) } catch { continue }

          if (currentEvent === 'meta') {
            if (payload.conversation_id) conversationId.value = payload.conversation_id

          } else if (currentEvent === 'token') {
            modelContent += payload.text || ''
            streamBuffer.value = modelContent
            scrollToBottom()

          } else if (currentEvent === 'tool') {
            toolCalls.push(payload)
            pushMessage({
              role: 'TOOL',
              tool_label: `Called ${payload.name}${payload.result?.ok === false ? ' (failed)' : ''}`,
              content: '',
            })

          } else if (currentEvent === 'done') {
            modelUsage = payload.usage || {}

          } else if (currentEvent === 'error') {
            pushSystemMessage(`AI error: ${payload.message}`)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  // Commit the full model message.
  if (modelContent) {
    pushMessage({ role: 'MODEL', content: modelContent, usage: modelUsage })
  }
  streamBuffer.value = ''
  streaming.value    = false
  scrollToBottom()
}

function pushMessage(msg) {
  messages.value.push({ id: Date.now() + Math.random(), ...msg })
  nextTick(scrollToBottom)
}

function pushSystemMessage(text) {
  pushMessage({ role: 'SYSTEM', content: text })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

function newConversation() {
  conversationId.value = null
  messages.value       = []
  streamBuffer.value   = ''
  streaming.value      = false
}

function clearConversation() {
  newConversation()
  pushSystemMessage('Conversation cleared.')
}

// ── Attachment ───────────────────────────────────────────────────────────────
async function onAttach(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const data = await fileToBase64(file)
  const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
  attachment.value = { name: file.name, mime_type: file.type, data, previewUrl }
  e.target.value = ''
}

function clearAttachment() {
  if (attachment.value?.previewUrl) URL.revokeObjectURL(attachment.value.previewUrl)
  attachment.value = null
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── History ──────────────────────────────────────────────────────────────────
async function openHistory() {
  showHistory.value  = true
  histLoading.value  = true
  try {
    const { data } = await api.get('/api/admin/ai/conversations/')
    conversations.value = Array.isArray(data) ? data : (data.results || [])
  } finally {
    histLoading.value = false
  }
}

async function loadConversation(id) {
  showHistory.value = false
  try {
    const { data } = await api.get(`/api/admin/ai/conversations/${id}/`)
    conversationId.value = id
    messages.value = (data.messages || []).map(m => ({ ...m, id: m.id || Date.now() + Math.random() }))
    scrollToBottom()
  } catch (e) {
    pushSystemMessage('Could not load conversation.')
  }
}

// ── Profiles modal ───────────────────────────────────────────────────────────
async function openProfilesModal() {
  showProfiles.value = true
  try {
    const { data } = await api.get('/api/admin/ai/profiles/')
    allProfiles.value = Array.isArray(data) ? data : (data.results || [])
  } catch {}
}

async function switchProfile(p) {
  if (!p.is_active) {
    await api.post(`/api/admin/ai/profiles/${p.id}/activate/`).catch(() => {})
    allProfiles.value = allProfiles.value.map(x => ({ ...x, is_active: x.id === p.id }))
  }
  profileName.value  = p.name
  showProfiles.value = false
  newConversation()
}

// ── Drag resize ──────────────────────────────────────────────────────────────
const DEFAULT_WIDTH = 380
let dragging = false
let dragStartX = 0
let dragStartW = 0

function startDrag(e) {
  dragging = true
  dragStartX = e.clientX
  dragStartW = props.width
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onDrag(e) {
  if (!dragging) return
  const delta = dragStartX - e.clientX  // drag left = panel grows
  const newW  = Math.max(280, Math.min(680, dragStartW + delta))
  emit('resize', newW)
}

function stopDrag() {
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function resetWidth() { emit('resize', DEFAULT_WIDTH) }

onUnmounted(() => {
  stopDrag()
  clearAttachment()
})

// ── Markdown (minimal inline rendering) ──────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#1e40af','rgba(30,64,175,0.18)'], ['#9333ea','rgba(147,51,234,0.18)'],
  ['#f97316','rgba(249,115,22,0.18)'],
]
function avatarStyle(name) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  const [color, bg] = AVATAR_COLORS[idx]
  return { background: bg, color }
}

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.drag-handle {
  position: fixed;
  top: 0; bottom: 0;
  width: 5px;
  cursor: col-resize;
  z-index: 300;
  right: v-bind('width + "px"');
  transition: background 100ms;
}
.drag-handle:hover { background: rgba(239,68,68,0.35); }

.chat-panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface, #1a2035);
  border-left: 1px solid var(--border);
  z-index: 200;
  box-shadow: -4px 0 24px rgba(0,0,0,0.12);
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  flex-shrink: 0;
}

.panel-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(239,68,68,0.12);
  color: var(--admin-accent, #ef4444);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 200ms;
}
.panel-avatar.connected { background: rgba(22,163,74,0.12); color: #16a34a; }
.panel-avatar.error     { background: rgba(239,68,68,0.12); color: #ef4444; }

.panel-title-block { display: flex; flex-direction: column; min-width: 0; }
.panel-profile-name {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.panel-status-row { display: flex; align-items: center; gap: 5px; }
.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  flex-shrink: 0;
}
.status-dot.connected { background: #16a34a; }
.status-dot.error     { background: #ef4444; }
.panel-status-text { font-size: 11px; color: var(--text-muted); }

.panel-icon-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  color: var(--text-muted);
  transition: background 120ms, color 120ms;
  flex-shrink: 0;
}
.panel-icon-btn:hover { background: var(--border); color: var(--text-primary); }

/* ── Messages ────────────────────────────────────────────────────────────── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  color: var(--text-muted);
}

.msg-row { display: flex; }
.msg-row.user    { justify-content: flex-end; }
.msg-row.model   { justify-content: flex-start; }
.msg-row.system  { justify-content: center; }
.msg-row.tool    { justify-content: flex-start; }

.msg-bubble {
  max-width: 88%;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.55;
}
.msg-bubble.user {
  background: var(--admin-accent, #ef4444);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg-bubble.model {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.msg-content { word-break: break-word; }
.msg-content code {
  background: rgba(0,0,0,0.12);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 12px;
  font-family: monospace;
}

.msg-meta {
  font-size: 10.5px;
  color: var(--text-muted);
  margin-top: 5px;
  text-align: right;
}

.tool-event {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(239,68,68,0.08);
  border-radius: 99px;
  font-size: 11.5px;
  color: var(--admin-accent, #ef4444);
  border: 1px dashed rgba(239,68,68,0.3);
}

.system-event {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--border);
  padding: 5px 12px;
  border-radius: 99px;
  text-align: center;
  max-width: 90%;
}

/* ── Slash palette ──────────────────────────────────────────────────────── */
.slash-palette {
  position: absolute;
  bottom: calc(100% - 70px);
  left: 10px; right: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  overflow: hidden;
  z-index: 10;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 80ms;
}
.palette-item:hover, .palette-item.focused { background: rgba(239,68,68,0.08); }
.palette-cmd {
  font-family: monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-accent, #ef4444);
  min-width: 80px;
}
.palette-desc { font-size: 12.5px; color: var(--text-muted); }

.palette-enter-active, .palette-leave-active { transition: opacity 120ms, transform 120ms; }
.palette-enter-from, .palette-leave-to { opacity: 0; transform: translateY(6px); }

/* ── Input area ─────────────────────────────────────────────────────────── */
.input-area {
  flex-shrink: 0;
  padding: 10px;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
  position: relative;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 6px 8px;
  transition: border-color 150ms;
}
.input-row:focus-within { border-color: var(--admin-accent); }

.attach-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 100ms, color 100ms;
  flex-shrink: 0;
  margin-bottom: 2px;
}
.attach-btn:hover { background: var(--border); color: var(--text-primary); }

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13.5px;
  line-height: 1.5;
  resize: none;
  min-height: 24px;
  max-height: 160px;
  overflow-y: auto;
  padding: 2px 0;
  font-family: inherit;
}
.chat-input::placeholder { color: var(--text-muted); }

.send-btn {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: var(--admin-accent, #ef4444);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 120ms, transform 80ms, opacity 120ms;
  margin-bottom: 1px;
}
.send-btn:hover  { background: #ea6c0a; }
.send-btn:active { transform: scale(0.94); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.attachment-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
  padding: 5px 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.att-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
.att-file-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--text-muted);
}
.att-remove {
  margin-left: auto;
  background: transparent; color: var(--text-muted);
  font-size: 16px; line-height: 1;
  padding: 0 4px;
  transition: color 100ms;
}
.att-remove:hover { color: #ef4444; }

.context-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--admin-accent, #ef4444);
  padding: 3px 8px;
  margin-top: 5px;
  background: rgba(239,68,68,0.08);
  border-radius: 99px;
}

/* ── History modal ──────────────────────────────────────────────────────── */
.history-list { display: flex; flex-direction: column; gap: 4px; max-height: 380px; overflow-y: auto; }
.history-item {
  padding: 10px 12px;
  border-radius: 9px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 100ms, border-color 100ms;
}
.history-item:hover { background: var(--bg-card); }
.history-item.active { border-color: var(--admin-accent); background: var(--bg-card); }
.hist-title { font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 3px; }
.hist-meta  { font-size: 11.5px; color: var(--text-muted); }

/* ── Profiles modal ─────────────────────────────────────────────────────── */
.profiles-list { display: flex; flex-direction: column; gap: 8px; }
.profile-switch-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: border-color 120ms, background 100ms;
}
.profile-switch-item:hover { border-color: var(--admin-accent); }
.profile-switch-item.active { border-color: #16a34a; background: rgba(22,163,74,0.05); }
.psi-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 15px; flex-shrink: 0;
}
.psi-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.active-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  background: #16a34a;
  flex-shrink: 0;
}
</style>
