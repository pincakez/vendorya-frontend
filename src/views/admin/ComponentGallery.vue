<template>
  <div class="cg">
    <p class="cg-intro">
      The <strong>approved</strong> building blocks. Anything not shown here doesn't ship —
      build new pages from these, don't reinvent them. Buttons &amp; inputs are <em>global</em>
      (defined once in <code>main.css</code>); press the buttons to feel the tactile
      <strong>rubber</strong> motion (snappy down, springy bounce-back).
    </p>

    <!-- ─── BUTTONS ─────────────────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">Buttons</h2>
        <span class="cg-tag cg-tag--global">global · main.css</span>
      </div>
      <div class="cg-grid">
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'

const showModal = ref(false)
const switchOn  = ref(true)

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
</style>
