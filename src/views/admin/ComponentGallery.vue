<template>
  <div class="cg">
    <p class="cg-intro">
      The <strong>approved</strong> building blocks. Anything not shown here doesn't ship —
      build new pages from these, don't reinvent them. Buttons &amp; inputs are <em>global</em>
      (defined once in <code>main.css</code>). The default button skin is
      <strong>OG Vendorya</strong> (rubber press) — use the switcher below to preview the
      other <strong>theme sets</strong> live; each has its own look <em>and</em> tactile feel.
    </p>

    <!-- ─── BUTTONS ─────────────────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">Buttons</h2>
        <span class="cg-tag cg-tag--global">global · main.css</span>
      </div>

      <!-- Theme-set switcher — reskins the live demos below (look + tactile feel) -->
      <div class="cg-setbar">
        <div class="cg-settabs">
          <button v-for="s in btnSets" :key="s.id" class="cg-settab" :class="{ on: activeSet === s.id }"
                  @click="activeSet = s.id">{{ s.name }}</button>
        </div>
        <span class="cg-setdesc"><strong>{{ activeName }}</strong> — {{ activeDesc }}</span>
      </div>

      <div class="cg-grid" :data-btnset="activeSet">
        <div class="cg-item">
          <div class="cg-demo"><button class="btn-primary">Save changes</button></div>
          <code class="cg-code">.btn-primary</code>
          <span class="cg-note">Primary action — one per view, lives in the page header.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><button class="btn-ghost">Cancel</button></div>
          <code class="cg-code">.btn-ghost</code>
          <span class="cg-note">Low-emphasis / secondary, bordered transparent.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><button class="btn-secondary">Export</button></div>
          <code class="cg-code">.btn-secondary</code>
          <span class="cg-note">Neutral action on a card surface.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><button class="btn-danger">Delete</button></div>
          <code class="cg-code">.btn-danger</code>
          <span class="cg-note">Destructive action — solid red.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <button class="btn-primary"><Plus :size="15" /> New product</button>
          </div>
          <code class="cg-code">.btn-primary + icon</code>
          <span class="cg-note">Lucide icon as first child, 14–15px.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <button class="btn-primary btn-sm">Small</button>
            <button class="btn-ghost btn-sm">Small</button>
          </div>
          <code class="cg-code">.btn-sm</code>
          <span class="cg-note">Size modifier — pairs with any button.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <button class="btn-primary" disabled>Disabled</button>
            <button class="btn-danger" disabled>Disabled</button>
          </div>
          <code class="cg-code">:disabled</code>
          <span class="cg-note">0.5 opacity, no press, default cursor.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><button class="btn-admin">Admin action</button></div>
          <code class="cg-code">.btn-admin</code>
          <span class="cg-note">Sudo/admin surfaces — red accent, no ripple group.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <button class="btn-refresh"><RefreshCw :size="15" /></button>
          </div>
          <code class="cg-code">.btn-refresh</code>
          <span class="cg-note">34×34 square icon-only button for reload controls.</span>
        </div>
      </div>
    </section>

    <!-- ─── BASEBUTTON COMPONENT ──────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">BaseButton</h2>
        <span class="cg-tag cg-tag--global">component · components/base/BaseButton.vue</span>
      </div>
      <p class="cg-ref-note">
        Canonical button component — all views use <code>&lt;BaseButton&gt;</code>,
        never raw <code>&lt;button class="btn-*"&gt;</code>.
        Props: <code>variant</code> · <code>size</code> · <code>loading</code> · <code>disabled</code> · <code>type</code>.
        Icon goes in the default slot.
      </p>
      <div class="cg-grid">
        <div class="cg-item">
          <div class="cg-demo"><BaseButton variant="primary">Save changes</BaseButton></div>
          <code class="cg-code">variant="primary"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><BaseButton variant="ghost">Cancel</BaseButton></div>
          <code class="cg-code">variant="ghost"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><BaseButton variant="secondary">Export</BaseButton></div>
          <code class="cg-code">variant="secondary"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><BaseButton variant="danger">Delete</BaseButton></div>
          <code class="cg-code">variant="danger"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><BaseButton variant="admin">Admin action</BaseButton></div>
          <code class="cg-code">variant="admin"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><BaseButton variant="refresh"><RefreshCw :size="15" /></BaseButton></div>
          <code class="cg-code">variant="refresh"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <BaseButton variant="primary" size="sm">Small</BaseButton>
            <BaseButton variant="ghost" size="sm">Small</BaseButton>
          </div>
          <code class="cg-code">size="sm"</code>
          <span class="cg-note">Pairs with any variant.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <BaseButton variant="primary" :loading="true">Saving…</BaseButton>
            <BaseButton variant="refresh" :loading="true"><RefreshCw :size="15" /></BaseButton>
          </div>
          <code class="cg-code">:loading="true"</code>
          <span class="cg-note">Disables + shows spinner. Slot hidden while loading.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <BaseButton variant="primary" :disabled="true">Disabled</BaseButton>
            <BaseButton variant="ghost" :disabled="true">Disabled</BaseButton>
          </div>
          <code class="cg-code">:disabled="true"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <BaseButton variant="primary"><Plus :size="15" /> New product</BaseButton>
          </div>
          <code class="cg-code">icon via slot</code>
          <span class="cg-note">Lucide icon as first child in slot, 14–15px.</span>
        </div>
      </div>
    </section>

    <!-- ─── STATUS BADGES ───────────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">Status badges</h2>
        <span class="cg-tag">semantic tokens</span>
      </div>
      <div class="cg-grid">
        <div v-for="b in badges" :key="b.cls" class="cg-item">
          <div class="cg-demo"><span class="cg-badge" :class="b.cls">{{ b.label }}</span></div>
          <code class="cg-code">{{ b.token }}</code>
          <span class="cg-note">{{ b.note }}</span>
        </div>
      </div>
    </section>

    <!-- ─── INPUTS ──────────────────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">Form inputs</h2>
        <span class="cg-tag cg-tag--global">global · main.css</span>
      </div>
      <div class="cg-grid">
        <div class="cg-item">
          <div class="cg-demo"><input class="form-input" placeholder="Type here…" /></div>
          <code class="cg-code">.form-input</code>
          <span class="cg-note">Text input — accent focus ring on :focus.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <select class="form-input"><option>Choose…</option><option>Option A</option><option>Option B</option></select>
          </div>
          <code class="cg-code">.form-input (select)</code>
          <span class="cg-note">Same class wraps selects.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo"><textarea class="form-input" rows="2" placeholder="Notes…"></textarea></div>
          <code class="cg-code">.form-input (textarea)</code>
          <span class="cg-note">Vertical-resize textarea.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo cg-demo--col">
            <label class="cg-check"><input type="checkbox" checked /> <span>Enabled</span></label>
            <label class="cg-check"><input type="checkbox" /> <span>Disabled</span></label>
          </div>
          <code class="cg-code">.cg-check</code>
          <span class="cg-note">Checkbox — <code>accent-color: var(--accent)</code>.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo">
            <button class="cg-switch" :class="{ on: switchOn }" @click="switchOn = !switchOn" role="switch" :aria-checked="switchOn">
              <span class="cg-switch-knob" />
            </button>
            <span class="cg-note" style="margin:0">{{ switchOn ? 'On' : 'Off' }}</span>
          </div>
          <code class="cg-code">.cg-switch</code>
          <span class="cg-note">Toggle — tactile knob slide.</span>
        </div>
      </div>
    </section>

    <!-- ─── OVERLAYS ────────────────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">Overlays &amp; feedback</h2>
        <span class="cg-tag cg-tag--global">components</span>
      </div>
      <div class="cg-grid">
        <div class="cg-item">
          <div class="cg-demo"><button class="btn-primary" @click="showModal = true">Open modal</button></div>
          <code class="cg-code">&lt;AppModal&gt;</code>
          <span class="cg-note">The one approved modal — <code>title</code>, <code>width</code>, footer slot.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo cg-demo--col">
            <div class="cg-skel" style="width:80%"></div>
            <div class="cg-skel" style="width:60%"></div>
            <div class="cg-skel" style="width:70%"></div>
          </div>
          <code class="cg-code">.cg-skel</code>
          <span class="cg-note">Loading skeleton — prefer over spinners.</span>
        </div>
      </div>
    </section>

    <!-- ─── TABLES (reference) ──────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">Tables</h2>
        <span class="cg-tag cg-tag--ref">reference</span>
      </div>
      <p class="cg-ref-note">
        Two approved table types — do not hand-roll markup:
        <strong>simple listing</strong> uses the global <code>.dt</code> wrapper
        (<code>.dt-card &gt; .dt-xscroll &gt; table.dt</code>); the
        <strong>configurable DataTable</strong> uses <code>useDataTable.js</code>.
        Wrapping both into <code>&lt;AppTable&gt;</code> / <code>&lt;DataTable&gt;</code>
        components is tracked in TODO §10.
      </p>
    </section>

    <AppModal :open="showModal" title="Example modal" @close="showModal = false">
      <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin:0;">
        This is the standard <code>AppModal</code> — teleported, backdrop click-to-close,
        scrollable body, spring pop-in. Every dialog in Vendorya uses it.
      </p>
      <template #footer>
        <button class="btn-ghost" @click="showModal = false">Cancel</button>
        <button class="btn-primary" @click="showModal = false">Confirm</button>
      </template>
    </AppModal>

    <!-- ─── TYPOGRAPHY ────────────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">Typography</h2>
        <span class="cg-tag">global · CSS vars</span>
      </div>
      <p class="cg-ref-note" style="margin-bottom:16px;">
        Controls the font size, weight, and style of the app's heading levels. Changes apply live and persist across sessions (localStorage). Reset removes all overrides and restores defaults.
      </p>

      <div class="typo-table">
        <div class="typo-row typo-header">
          <span>Level</span>
          <span>Preview</span>
          <span>Size (px)</span>
          <span>Bold</span>
          <span>Italic</span>
        </div>
        <div v-for="h in headings" :key="h.key" class="typo-row">
          <span class="typo-level-name">{{ h.label }}</span>
          <span class="typo-preview" :style="h.previewStyle">{{ h.sample }}</span>
          <span class="typo-controls">
            <input
              type="number" min="8" max="64" step="1"
              :value="h.size"
              @change="setTypo(h, 'size', $event.target.value)"
              class="typo-input"
            />
          </span>
          <span class="typo-controls">
            <button class="typo-toggle" :class="{ on: h.bold }" @click="setTypo(h, 'bold', !h.bold)">B</button>
          </span>
          <span class="typo-controls">
            <button class="typo-toggle" :class="{ on: h.italic }" @click="setTypo(h, 'italic', !h.italic)"><em>I</em></button>
          </span>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn-ghost btn-sm" @click="resetTypo">Reset to defaults</button>
        <span v-if="typoSaved" class="typo-saved">Saved ✓</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const showModal = ref(false)
const switchOn  = ref(true)

/* ── Typography controls ─────────────────────────────────── */
const TYPO_KEY = 'vya_typography'

const defaults = {
  page:  { size: 28, bold: true,  italic: false },
  h2:    { size: 18, bold: true,  italic: false },
  h3:    { size: 15, bold: true,  italic: false },
  h4:    { size: 14, bold: true,  italic: false },
  label: { size: 12, bold: true,  italic: false },
}

const stored = JSON.parse(localStorage.getItem(TYPO_KEY) || '{}')

const headings = reactive([
  { key: 'page',  label: 'Page Title (H1)', sample: 'Sales Invoices',        cssBase: '--typo-page',  ...defaults.page,  ...stored.page  },
  { key: 'h2',    label: 'Section Title (H2)', sample: 'Label Presets',      cssBase: '--typo-h2',    ...defaults.h2,    ...stored.h2    },
  { key: 'h3',    label: 'Group Title (H3)', sample: 'Basic Information',    cssBase: '--typo-h3',    ...defaults.h3,    ...stored.h3    },
  { key: 'h4',    label: 'Divider Label (H4)', sample: 'DISPLAY & FORMAT',  cssBase: '--typo-h4',    ...defaults.h4,    ...stored.h4    },
  { key: 'label', label: 'Form Label',        sample: 'Store Name',          cssBase: '--typo-label', ...defaults.label, ...stored.label },
])

const headingStyle = (h) => ({
  fontSize: h.size + 'px',
  fontWeight: h.bold ? 700 : 400,
  fontStyle: h.italic ? 'italic' : 'normal',
})

const previewStyle = computed(() => (h) => headingStyle(h))

headings.forEach(h => {
  Object.defineProperty(h, 'previewStyle', {
    get() { return { fontSize: this.size + 'px', fontWeight: this.bold ? 700 : 400, fontStyle: this.italic ? 'italic' : 'normal' } },
    enumerable: false,
  })
})

const typoSaved = ref(false)

function applyToCss(h) {
  const el = document.documentElement
  el.style.setProperty(`${h.cssBase}-size`,   h.size + 'px')
  el.style.setProperty(`${h.cssBase}-weight`,  h.bold   ? '700' : '400')
  el.style.setProperty(`${h.cssBase}-style`,   h.italic ? 'italic' : 'normal')
}

function setTypo(h, prop, val) {
  if (prop === 'size')   h.size   = parseInt(val, 10) || h.size
  if (prop === 'bold')   h.bold   = !!val
  if (prop === 'italic') h.italic = !!val
  applyToCss(h)
  persistTypo()
}

function persistTypo() {
  const data = {}
  headings.forEach(h => { data[h.key] = { size: h.size, bold: h.bold, italic: h.italic } })
  localStorage.setItem(TYPO_KEY, JSON.stringify(data))
  typoSaved.value = true
  setTimeout(() => { typoSaved.value = false }, 1500)
}

function resetTypo() {
  headings.forEach(h => {
    const d = defaults[h.key]
    h.size = d.size; h.bold = d.bold; h.italic = d.italic
    applyToCss(h)
  })
  localStorage.removeItem(TYPO_KEY)
  typoSaved.value = true
  setTimeout(() => { typoSaved.value = false }, 1500)
}

onMounted(() => {
  headings.forEach(h => applyToCss(h))
})

// Button theme sets — namespaced skins in main.css ([data-btnset="…"]).
const btnSets = [
  { id: 'og',     name: 'OG Vendorya', desc: 'orange, the rubber press — snappy down, springy bounce-back.' },
  { id: 'aqua',   name: 'Aqua feel',   desc: 'liquid glass — glossy top sheen, sinks into water on press (no bounce).' },
  { id: 'carbon', name: 'Carbon',      desc: 'matte graphite keycaps — a firm mechanical key-travel, no scale or bounce.' },
]
const activeSet  = ref('og')
const activeName = computed(() => btnSets.find(s => s.id === activeSet.value).name)
const activeDesc = computed(() => btnSets.find(s => s.id === activeSet.value).desc)

const badges = [
  { cls: 'cg-badge--success', label: 'Paid',     token: '--success', note: 'Positive / completed state.' },
  { cls: 'cg-badge--danger',  label: 'Overdue',  token: '--danger',  note: 'Error / destructive / failed.' },
  { cls: 'cg-badge--warning', label: 'Pending',  token: '--warning', note: 'Caution / awaiting action.' },
  { cls: 'cg-badge--info',    label: 'Draft',    token: '--info',    note: 'Neutral / informational.' },
]
</script>

<style scoped>
.cg-intro {
  font-size: 13px; color: var(--text-secondary); line-height: 1.6;
  margin: 0 0 28px; max-width: 760px;
}
.cg-intro code, .cg-note code, .cg-ref-note code {
  font-family: monospace; font-size: .92em;
  background: var(--bg-app); border: 1px solid var(--border);
  border-radius: 4px; padding: 1px 5px; color: var(--text-primary);
}

.cg-section { margin-bottom: 36px; }
.cg-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.cg-h { font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -.2px; }
.cg-tag {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
  padding: 3px 9px; border-radius: 9999px;
  background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border);
}
.cg-tag--global { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
.cg-tag--ref    { background: var(--info-soft); color: var(--info); border-color: transparent; }

/* Theme-set switcher */
.cg-setbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.cg-settabs { display: inline-flex; gap: 3px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 11px; padding: 3px; }
.cg-settab {
  border: none; background: none; cursor: pointer; padding: 6px 14px; border-radius: 8px;
  font-size: 12.5px; font-weight: 700; color: var(--text-muted);
  transition: background 140ms var(--ease-out), color 140ms var(--ease-out);
}
.cg-settab:hover { color: var(--text-primary); }
.cg-settab.on { background: var(--bg-card); color: var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.cg-setdesc { font-size: 12px; color: var(--text-muted); }
.cg-setdesc strong { color: var(--text-secondary); }

.cg-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.cg-item {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
  padding: 16px; display: flex; flex-direction: column; gap: 10px;
}
.cg-demo {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  min-height: 48px; padding: 8px 0;
}
.cg-demo--col { flex-direction: column; align-items: flex-start; gap: 8px; }
.cg-code {
  font-family: monospace; font-size: 12px; font-weight: 700; color: var(--accent);
}
.cg-note { font-size: 11.5px; color: var(--text-muted); line-height: 1.45; }

/* Badges (reference for the approved status-chip pattern) */
.cg-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 700; padding: 3px 11px; border-radius: 9999px;
}
.cg-badge--success { background: var(--success-soft); color: var(--success); }
.cg-badge--danger  { background: var(--danger-soft);  color: var(--danger); }
.cg-badge--warning { background: var(--warning-soft); color: var(--warning); }
.cg-badge--info    { background: var(--info-soft);    color: var(--info); }

/* Checkbox */
.cg-check { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--text-secondary); cursor: pointer; }
.cg-check input { accent-color: var(--accent); width: 15px; height: 15px; cursor: pointer; }

/* Toggle switch — tactile knob */
.cg-switch {
  width: 42px; height: 24px; border-radius: 9999px; border: none; padding: 0;
  background: var(--border); cursor: pointer; position: relative;
  transition: background 180ms var(--ease-out);
}
.cg-switch.on { background: var(--accent); }
.cg-switch-knob {
  position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
  border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25);
  transition: transform var(--press-back) var(--ease-spring);
}
.cg-switch.on .cg-switch-knob { transform: translateX(18px); }

/* Skeleton */
.cg-skel {
  height: 12px; border-radius: 6px;
  background: linear-gradient(90deg, var(--bg-app) 25%, var(--border) 37%, var(--bg-app) 63%);
  background-size: 400% 100%; animation: cg-shimmer 1.4s ease infinite;
}
@keyframes cg-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

.cg-ref-note {
  font-size: 12.5px; color: var(--text-secondary); line-height: 1.6;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
  padding: 14px 16px; margin: 0;
}

/* Typography controls */
.typo-table { display: flex; flex-direction: column; gap: 2px; }
.typo-row {
  display: grid; grid-template-columns: 160px 1fr 90px 60px 60px;
  gap: 12px; align-items: center;
  padding: 10px 14px; border-radius: 10px;
  background: var(--bg-card); border: 1px solid var(--border);
}
.typo-header {
  background: var(--bg-app); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted);
  border-color: transparent;
}
.typo-level-name { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
.typo-preview { color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.typo-controls { display: flex; align-items: center; }
.typo-input {
  width: 64px; padding: 5px 8px; border: 1px solid var(--border); border-radius: 7px;
  background: var(--bg-app); color: var(--text-primary); font-size: 13px;
  outline: none; text-align: center; font-weight: 600;
  transition: border-color 120ms;
}
.typo-input:focus { border-color: var(--accent); }
.typo-toggle {
  width: 32px; height: 28px; border: 1.5px solid var(--border); border-radius: 7px;
  background: var(--bg-app); color: var(--text-muted); font-size: 14px; font-weight: 700;
  cursor: pointer; transition: background 120ms, color 120ms, border-color 120ms;
  display: flex; align-items: center; justify-content: center;
}
.typo-toggle:hover { border-color: var(--accent); color: var(--accent); }
.typo-toggle.on { background: var(--accent); color: #fff; border-color: var(--accent); }
.typo-saved { font-size: 12.5px; color: var(--success); font-weight: 600; }
</style>
