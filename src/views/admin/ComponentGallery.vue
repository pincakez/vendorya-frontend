<template>
  <div class="cg">
    <!-- Tabs -->
    <div class="g-tabs">
      <button class="g-tab" :class="{ active: tab === 'components' }" @click="tab = 'components'">
        <Component :size="15" /> Components
      </button>
      <button class="g-tab" :class="{ active: tab === 'modals' }" @click="tab = 'modals'">
        <LayoutTemplate :size="15" /> Modal Layouts
      </button>
      <button class="g-tab" :class="{ active: tab === 'designs' }" @click="tab = 'designs'">
        <Sparkles :size="15" /> Modal Designs
      </button>
    </div>

    <template v-if="tab === 'components'">
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

    <!-- ─── BASEINPUT COMPONENT ──────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">BaseInput</h2>
        <span class="cg-tag cg-tag--global">component · components/base/BaseInput.vue</span>
      </div>
      <p class="cg-ref-note">
        Canonical text input. Props: <code>modelValue</code> (v-model) · <code>label</code> ·
        <code>type</code> · <code>placeholder</code> · <code>prefix</code> · <code>suffix</code> ·
        <code>error</code> · <code>disabled</code>.
        Extra attributes (e.g. <code>maxlength</code>, <code>min</code>) pass through via <code>$attrs</code>.
      </p>
      <div class="cg-grid">
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseInput label="Product name" placeholder="e.g. Paracetamol 500mg" model-value="" />
          </div>
          <code class="cg-code">label + placeholder</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseInput label="Price" prefix="EGP" placeholder="0.00" model-value="" />
          </div>
          <code class="cg-code">prefix="EGP"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseInput label="Discount" suffix="%" placeholder="0" model-value="" />
          </div>
          <code class="cg-code">suffix="%"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseInput label="Weight" prefix="kg" suffix="g" placeholder="0.000" model-value="" />
          </div>
          <code class="cg-code">prefix + suffix</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseInput label="Email" type="email" placeholder="user@example.com" error="Invalid email address" model-value="bad@@email" />
          </div>
          <code class="cg-code">error="…"</code>
          <span class="cg-note">Red border + message below.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseInput label="Store name" placeholder="Locked" model-value="Gates Technology" :disabled="true" />
          </div>
          <code class="cg-code">:disabled="true"</code>
        </div>
      </div>
    </section>

    <!-- ─── BASESELECT COMPONENT ─────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">BaseSelect</h2>
        <span class="cg-tag cg-tag--global">component · components/base/BaseSelect.vue</span>
      </div>
      <p class="cg-ref-note">
        Canonical dropdown. Props: <code>modelValue</code> (v-model) · <code>options</code> <code>[{value, label}]</code> ·
        <code>label</code> · <code>placeholder</code> · <code>error</code> · <code>disabled</code>.
        Extra attributes pass through via <code>$attrs</code>.
      </p>
      <div class="cg-grid">
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseSelect
              label="Category"
              model-value="electronics"
              :options="[{value:'electronics',label:'Electronics'},{value:'clothing',label:'Clothing'},{value:'food',label:'Food & Beverages'}]"
            />
          </div>
          <code class="cg-code">label + options</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseSelect
              label="Tax rule"
              model-value=""
              placeholder="Select a tax…"
              :options="[{value:'vat14',label:'VAT 14%'},{value:'vat5',label:'VAT 5%'},{value:'exempt',label:'Exempt'}]"
            />
          </div>
          <code class="cg-code">placeholder (unselected)</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseSelect
              label="Branch"
              model-value=""
              placeholder="Choose branch…"
              error="Branch is required"
              :options="[{value:'main',label:'Main Branch'},{value:'cairo',label:'Cairo Branch'}]"
            />
          </div>
          <code class="cg-code">error="…"</code>
          <span class="cg-note">Red border + message below.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseSelect
              label="Store type"
              model-value="pharmacy"
              :disabled="true"
              :options="[{value:'general',label:'General'},{value:'pharmacy',label:'Pharmacy'},{value:'grocery',label:'Grocery'}]"
            />
          </div>
          <code class="cg-code">:disabled="true"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo" style="width:220px">
            <BaseSelect
              label="Role"
              model-value="cashier"
              :options="[{value:'cashier',label:'Cashier'},{value:'manager',label:'Manager'},{value:'admin',label:'Admin'},{value:'owner',label:'Owner'}]"
            />
          </div>
          <code class="cg-code">pre-selected value</code>
        </div>
      </div>
    </section>

    <!-- ─── BASECARD COMPONENT ──────────────────────────────── -->
    <section class="cg-section">
      <div class="cg-head">
        <h2 class="cg-h">BaseCard</h2>
        <span class="cg-tag cg-tag--global">component · components/base/BaseCard.vue</span>
      </div>
      <p class="cg-ref-note">
        Surface wrapper with rounded corners, card background, and border. Props:
        <code>padding</code> <code>sm · md · lg</code> ·
        <code>shadow</code> <code>default · none · strong</code>.
        Content via default slot.
      </p>
      <div class="cg-grid">
        <div class="cg-item">
          <div class="cg-demo cg-demo--col" style="width:200px">
            <BaseCard padding="sm">
              <span style="font-size:12px;color:var(--text-secondary)">Small padding — 12px</span>
            </BaseCard>
          </div>
          <code class="cg-code">padding="sm"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo cg-demo--col" style="width:200px">
            <BaseCard padding="md">
              <span style="font-size:12px;color:var(--text-secondary)">Medium padding — 20px</span>
            </BaseCard>
          </div>
          <code class="cg-code">padding="md" (default)</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo cg-demo--col" style="width:200px">
            <BaseCard padding="lg">
              <span style="font-size:12px;color:var(--text-secondary)">Large padding — 32px</span>
            </BaseCard>
          </div>
          <code class="cg-code">padding="lg"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo cg-demo--col" style="width:200px">
            <BaseCard shadow="default">
              <span style="font-size:12px;color:var(--text-secondary)">Default shadow</span>
            </BaseCard>
          </div>
          <code class="cg-code">shadow="default"</code>
          <span class="cg-note">Uses <code>--shadow-card</code>.</span>
        </div>
        <div class="cg-item">
          <div class="cg-demo cg-demo--col" style="width:200px">
            <BaseCard shadow="none">
              <span style="font-size:12px;color:var(--text-secondary)">No shadow — flat</span>
            </BaseCard>
          </div>
          <code class="cg-code">shadow="none"</code>
        </div>
        <div class="cg-item">
          <div class="cg-demo cg-demo--col" style="width:200px">
            <BaseCard shadow="strong">
              <span style="font-size:12px;color:var(--text-secondary)">Strong shadow — elevated</span>
            </BaseCard>
          </div>
          <code class="cg-code">shadow="strong"</code>
          <span class="cg-note">Uses <code>--shadow-strong</code>.</span>
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
      <p class="cg-ref-note" style="margin-top:14px;">
        <strong>ReportTable</strong> (data-driven Fixed table) now has <strong>built-in column sorting</strong> —
        click any header to cycle <code>asc → desc → off</code>. Numeric / currency / qty columns sort numerically,
        dates as dates, text locale-aware; blanks always sink to the bottom and the totals row stays pinned.
        Per-column opt-out via <code>column.sortable = false</code>; disable entirely with <code>:sortable="false"</code>.
      </p>
      <div style="max-width:640px;margin-top:6px;">
        <ReportTable
          title="Top Sellers (demo)"
          filename="demo"
          :columns="demoCols"
          :rows="demoRows"
          :totals="demoTotals"
        />
      </div>

      <p class="cg-ref-note" style="margin-top:22px;">
        <strong>BaseTable</strong> <span class="cg-tag cg-tag--global">component · components/base/BaseTable.vue</span><br>
        The canonical <strong>Fixed</strong> (data-driven) table — hand it <code>:columns</code> + <code>:rows</code>
        and it draws header, skeleton, empty state, and built-in sorting. Custom cells via
        <code>#cell-&lt;key&gt;</code> slots. Client-side sort by default; <code>:serverSort</code> +
        <code>@sort</code> for paginated lists. First adopter: Stock Adjustments.
        Sort choice persists across refresh via <code>storage-key</code> (localStorage, 0 server bytes);
        <code>default-sort</code> sets the initial column.
      </p>
      <div style="max-width:560px;margin-top:6px;">
        <BaseTable :columns="demoCols" :rows="demoRows"
                   storage-key="gallery_basetable" :default-sort="{ key: 'date', dir: 'desc' }" />
      </div>
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
    </template>

    <!-- ── Modal Layout presets ───────────────────────────── -->
    <template v-else-if="tab === 'modals'">
      <section class="wg-section">
        <div class="wg-section-label">
          <span class="wg-size-badge">Form modal layouts · 900px wide</span>
        </div>
        <p class="ml-intro">
          Named layouts every form modal is built from — so each one reads like the Add Product modal:
          compact, two-column, fills the width. Reference a preset by name (e.g. “use the <b>TwoCol</b> preset here”).
          They map to shared classes in <code>main.css</code>.
        </p>
        <div class="wg-row wg-row--wrap">
          <div v-for="p in modalPresets" :key="p.id" class="wg-card wg-card--modal">
            <div class="wg-preview wg-preview--modal">
              <!-- split: two stacked columns -->
              <div v-if="p.layout === 'split'" class="ml-skel ml-skel--split">
                <div class="ml-skel-col"><span class="ml-cell" /><span class="ml-cell" /><span class="ml-cell" /></div>
                <div class="ml-skel-col"><span class="ml-cell" /><span class="ml-cell" /><span class="ml-cell" /></div>
              </div>
              <!-- rows -->
              <div v-else class="ml-skel">
                <template v-for="(row, i) in p.rows" :key="i">
                  <div v-if="row === 'hr'" class="ml-hr" />
                  <div v-else class="ml-skel-row">
                    <span v-for="(w, j) in row" :key="j" class="ml-cell" :style="{ flex: w }" />
                  </div>
                </template>
              </div>
            </div>
            <div class="wg-meta">
              <div class="wg-meta-left">
                <span class="wg-name">{{ p.name }}</span>
                <span class="wg-desc">{{ p.desc }}</span>
              </div>
              <div class="wg-meta-right">
                <span class="wg-dim">{{ p.cls }}</span>
                <span class="wg-status" :class="p.ready ? 'status-ready' : 'status-draft'">
                  {{ p.ready ? '● Live' : '○ Draft' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- ── Modal Designs — 3 design concepts for Add Product ── -->
    <template v-else-if="tab === 'designs'">
      <section class="wg-section">
        <div class="wg-section-label">
          <span class="wg-size-badge">Add Product Modal · 3 Design Concepts</span>
        </div>
        <p class="ml-intro">
          Three distinct visual directions for the Add Product modal. <b>Structured</b> is the shipped design —
          the other two are parked alternatives. Each is a real rendered preview, not a skeleton.
        </p>

        <div class="gd-grid">

          <!-- ── Design A: Structured (shipped) ── -->
          <div class="gd-card">
            <div class="gd-badge gd-badge--live">● Live</div>
            <div class="gd-preview">
              <div class="gd-mock">
                <div class="gd-split">
                  <!-- Left column -->
                  <div class="gd-col">
                    <div class="gd-sec">Product</div>
                    <div class="gd-field">
                      <div class="gd-fh"><span class="gd-lbl">Name</span><span class="gd-star on">★</span></div>
                      <div class="gd-inp"></div>
                    </div>
                    <div class="gd-field">
                      <span class="gd-lbl">Description</span>
                      <div class="gd-inp gd-inp--tall"></div>
                    </div>
                    <div class="gd-sec">Pricing</div>
                    <div class="gd-band">
                      <div class="gd-cell"><span class="gd-lbl gd-lbl--xs">Base</span><span class="gd-price">$ <b>—</b></span></div>
                      <div class="gd-cell"><span class="gd-lbl gd-lbl--xs">Cost</span><span class="gd-price">$ <b>—</b></span></div>
                      <div class="gd-cell"><span class="gd-lbl gd-lbl--xs">Sell</span><span class="gd-price">$ <b>—</b></span></div>
                    </div>
                  </div>
                  <!-- Right column -->
                  <div class="gd-col">
                    <div class="gd-sec">Organization</div>
                    <div class="gd-field">
                      <div class="gd-fh"><span class="gd-lbl">Category</span><span class="gd-star">★</span></div>
                      <div class="gd-inp gd-inp--sel"></div>
                    </div>
                    <div class="gd-field">
                      <div class="gd-fh"><span class="gd-lbl">Supplier</span><span class="gd-star on">★</span></div>
                      <div class="gd-inp gd-inp--sel"></div>
                    </div>
                    <div class="gd-sec">Stock</div>
                    <div class="gd-row2">
                      <div class="gd-field"><span class="gd-lbl">Reorder</span><div class="gd-inp"></div></div>
                      <div class="gd-field"><span class="gd-lbl">Opening</span><div class="gd-inp"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="gd-meta">
              <span class="gd-name">Structured</span>
              <span class="gd-desc">ALL-CAPS section labels, unified price band, star pin toggles. Shipped in Products.</span>
            </div>
          </div>

          <!-- ── Design B: Panelled ── -->
          <div class="gd-card">
            <div class="gd-badge gd-badge--draft">○ Concept</div>
            <div class="gd-preview gd-preview--b">
              <div class="gd-mock">
                <div class="gd-split">
                  <div class="gd-col">
                    <div class="gdB-panel">
                      <div class="gdB-head">Product Identity</div>
                      <div class="gdB-body">
                        <div class="gd-field">
                          <div class="gd-fh"><span class="gd-lbl">Name</span><span class="gdB-star">📌</span></div>
                          <div class="gdB-inp"></div>
                        </div>
                        <div class="gd-field">
                          <span class="gd-lbl">Description</span>
                          <div class="gdB-inp gdB-inp--tall"></div>
                        </div>
                      </div>
                    </div>
                    <div class="gdB-panel">
                      <div class="gdB-head">Pricing</div>
                      <div class="gdB-body gdB-price-row">
                        <div class="gd-field"><span class="gd-lbl">Base</span><div class="gdB-inp"></div></div>
                        <div class="gd-field"><span class="gd-lbl">Cost</span><div class="gdB-inp"></div></div>
                        <div class="gd-field"><span class="gd-lbl">Sell</span><div class="gdB-inp"></div></div>
                      </div>
                    </div>
                  </div>
                  <div class="gd-col">
                    <div class="gdB-panel">
                      <div class="gdB-head">Organization</div>
                      <div class="gdB-body">
                        <div class="gd-field">
                          <div class="gd-fh"><span class="gd-lbl">Category</span><span class="gdB-star">📌</span></div>
                          <div class="gdB-inp gdB-inp--sel"></div>
                        </div>
                        <div class="gd-field">
                          <div class="gd-fh"><span class="gd-lbl">Supplier</span><span class="gdB-star">📌</span></div>
                          <div class="gdB-inp gdB-inp--sel"></div>
                        </div>
                      </div>
                    </div>
                    <div class="gdB-panel">
                      <div class="gdB-head">Stock</div>
                      <div class="gdB-body gd-row2">
                        <div class="gd-field"><span class="gd-lbl">Reorder</span><div class="gdB-inp"></div></div>
                        <div class="gd-field"><span class="gd-lbl">Opening</span><div class="gdB-inp"></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="gd-meta">
              <span class="gd-name">Panelled</span>
              <span class="gd-desc">Each group is a bordered card with an orange accent header. Heavier structure, enterprise feel.</span>
            </div>
          </div>

          <!-- ── Design C: Minimal ── -->
          <div class="gd-card">
            <div class="gd-badge gd-badge--draft">○ Concept</div>
            <div class="gd-preview gd-preview--c">
              <div class="gd-mock">
                <div class="gd-split">
                  <div class="gd-col">
                    <div class="gdC-field">
                      <span class="gdC-lbl">PRODUCT NAME</span>
                      <div class="gdC-inp"></div>
                    </div>
                    <div class="gdC-field">
                      <span class="gdC-lbl">DESCRIPTION</span>
                      <div class="gdC-inp gdC-inp--tall"></div>
                    </div>
                    <div class="gdC-price-row">
                      <div class="gdC-price-item">
                        <span class="gdC-lbl">BASE</span>
                        <span class="gdC-price-val">—</span>
                      </div>
                      <div class="gdC-price-item">
                        <span class="gdC-lbl">COST</span>
                        <span class="gdC-price-val">—</span>
                      </div>
                      <div class="gdC-price-item">
                        <span class="gdC-lbl">SELL</span>
                        <span class="gdC-price-val">—</span>
                      </div>
                    </div>
                  </div>
                  <div class="gd-col">
                    <div class="gdC-field">
                      <span class="gdC-lbl">CATEGORY</span>
                      <div class="gdC-inp"></div>
                    </div>
                    <div class="gdC-field">
                      <span class="gdC-lbl">SUPPLIER</span>
                      <div class="gdC-inp"></div>
                    </div>
                    <div class="gdC-row2">
                      <div class="gdC-field">
                        <span class="gdC-lbl">REORDER AT</span>
                        <div class="gdC-inp"></div>
                      </div>
                      <div class="gdC-field">
                        <span class="gdC-lbl">OPENING STOCK</span>
                        <div class="gdC-inp"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="gd-meta">
              <span class="gd-name">Minimal</span>
              <span class="gd-desc">No section cards — just spacing. Bottom-border-only inputs. Labels in tracked uppercase. Linear / Stripe vibe.</span>
            </div>
          </div>

        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { Plus, RefreshCw, Component, LayoutTemplate, Sparkles } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput  from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseCard   from '@/components/base/BaseCard.vue'
import ReportTable from '@/components/ui/ReportTable.vue'
import BaseTable   from '@/components/base/BaseTable.vue'

const tab = ref('components')
const showModal = ref(false)
const switchOn  = ref(true)

/* ─ Modal layout presets ─ map to shared classes in main.css ─ */
const modalPresets = [
  { id: 'twocol',  name: 'TwoCol',     cls: '.modal-2col',   ready: true, layout: 'rows',  rows: [[1,1],[1,1],[1]],
    desc: 'Two fields per row. The default for every form modal (Customer, Supplier, Staff).' },
  { id: 'threecol',name: 'ThreeCol',   cls: '.modal-3col',   ready: true, layout: 'rows',  rows: [[1,1,1]],
    desc: 'Three fields across one row — e.g. the price triplet (Base / Cost / Sell).' },
  { id: 'single',  name: 'SingleCol',  cls: '.modal-form',   ready: true, layout: 'rows',  rows: [[1],[1],[1]],
    desc: 'Stacked single column. For short, simple modals (rename, confirm, one input).' },
  { id: 'split',   name: 'Split',      cls: '.modal-split',  ready: true, layout: 'split',
    desc: 'Two independent stacked columns side by side — the Add Product shape.' },
  { id: 'section', name: 'Sectioned',  cls: '.modal-section',ready: true, layout: 'rows',  rows: [[1,1],'hr',[1,1]],
    desc: 'Grouped block under a labelled divider — like the Attributes section.' },
]

/* ── ReportTable sort demo (static data) ─────────────────── */
const demoCols = [
  { key: 'product', label: 'Product',   type: 'text' },
  { key: 'qty',     label: 'Qty Sold',  type: 'qty' },
  { key: 'revenue', label: 'Revenue',   type: 'currency' },
  { key: 'date',    label: 'Last Sold', type: 'date' },
]
const demoRows = [
  { product: 'Laptop Stand',   qty: 12, revenue: 2400, date: '2026-06-10' },
  { product: 'USB-C Cable',    qty: 48, revenue: 960,  date: '2026-06-18' },
  { product: 'Wireless Mouse', qty: 7,  revenue: 1050, date: '2026-06-02' },
  { product: 'Keyboard',       qty: 21, revenue: 3675, date: '2026-06-15' },
]
const demoTotals = { qty: 88, revenue: 8085 }

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
  gap: 20px;
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
  padding: 14px 16px; margin: 0 0 16px 0;
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

/* ── Tabs ──────────────────────────────────────────────── */
.g-tabs { display: flex; gap: 6px; margin-bottom: 28px; }
.g-tab {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px; cursor: pointer;
  font-size: 13.5px; font-weight: 700; font-family: inherit;
  border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary);
  transition: background-color 140ms var(--ease-out), color 140ms var(--ease-out),
              border-color 140ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.g-tab:hover:not(.active) { color: var(--text-primary); }
.g-tab:active { transform: scale(var(--press-scale)); transition-duration: var(--press-down); }
.g-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* ── Gallery section / card shell (shared by Modal tabs) ── */
.wg-section { margin-bottom: 40px; }
.wg-section-label { margin-bottom: 14px; }
.wg-size-badge {
  display: inline-flex;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  padding: 4px 12px; border-radius: 9999px;
  background: var(--accent-soft); color: var(--accent);
  border: 1px solid rgba(247,143,30,.2);
}
.wg-row { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
.wg-row--wrap { flex-wrap: wrap; overflow-x: visible; }
.wg-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
  overflow: hidden; flex-shrink: 0; transition: box-shadow 150ms, transform 150ms;
}
.wg-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); transform: translateY(-2px); }
.dark .wg-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.4); }
.wg-preview {
  background: var(--bg-app); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.wg-meta { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 12px 14px; }
.wg-meta-left  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wg-meta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.wg-name  { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.wg-desc  { font-size: 11.5px; color: var(--text-muted); line-height: 1.4; }
.wg-dim   { font-size: 10px; font-weight: 700; font-family: monospace; color: var(--text-muted); background: var(--bg-app); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }
.wg-status { font-size: 10.5px; font-weight: 700; white-space: nowrap; }
.status-ready { color: var(--success); }
.status-draft { color: var(--text-muted); }

/* ── Modal layout presets ── */
.ml-intro { font-size: 12.5px; color: var(--text-muted); line-height: 1.6; max-width: 720px; margin: 0 0 18px; }
.ml-intro code { font-family: monospace; font-size: 11.5px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; }
.wg-card--modal { width: 240px; }
.wg-preview--modal { height: 130px; padding: 16px; }
.ml-skel { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.ml-skel-row { display: flex; gap: 8px; }
.ml-cell { height: 16px; border-radius: 5px; background: var(--accent-soft); border: 1px solid rgba(247,143,30,.25); }
.ml-skel-row .ml-cell { flex: 1; }
.ml-hr { height: 1px; background: var(--border); margin: 2px 0; }
.ml-skel--split { flex-direction: row; gap: 10px; }
.ml-skel-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* ── Modal Designs tab ──────────────────────────────────── */
.gd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.gd-card {
  background: var(--bg-card); border: 1.5px solid var(--border);
  border-radius: 16px; overflow: hidden; position: relative;
  transition: box-shadow 160ms, transform 160ms;
}
.gd-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,.12); transform: translateY(-2px); }
.dark .gd-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,.4); }
.gd-badge {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  font-size: 9.5px; font-weight: 800; padding: 3px 8px;
  border-radius: 999px; letter-spacing: .04em;
}
.gd-badge--live  { background: var(--success-soft); color: var(--success); border: 1px solid rgba(34,197,94,.2); }
.gd-badge--draft { background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border); }
.gd-preview {
  background: var(--bg-app); border-bottom: 1.5px solid var(--border);
  padding: 16px; height: 280px; overflow: hidden;
}
.gd-mock { width: 100%; height: 100%; }
.gd-split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 100%; }
.gd-col { display: flex; flex-direction: column; gap: 7px; }
.gd-field { display: flex; flex-direction: column; gap: 3px; }
.gd-fh { display: flex; align-items: center; justify-content: space-between; }
.gd-lbl { font-size: 9px; font-weight: 700; color: var(--text-secondary); letter-spacing: .01em; }
.gd-lbl--xs { font-size: 8.5px; }
.gd-inp { height: 22px; border-radius: 6px; background: var(--bg-card); border: 1.5px solid var(--border); }
.gd-inp--tall { height: 40px; }
.gd-inp--sel { background: var(--bg-card); position: relative; }
.gd-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.gd-sec {
  font-size: 7.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em;
  color: var(--text-muted); padding-bottom: 4px; border-bottom: 1px solid var(--border);
}
.gd-star { font-size: 10px; color: var(--text-muted); line-height: 1; }
.gd-star.on { color: var(--accent); }
.gd-band { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1.5px solid var(--border); border-radius: 7px; overflow: hidden; }
.gd-cell { padding: 5px 6px 4px; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; }
.gd-cell:last-child { border-right: none; }
.gd-price { font-size: 10px; font-weight: 700; color: var(--text-primary); }
.gd-preview--b { background: var(--bg-app); }
.gdB-panel { border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 0; }
.gdB-head {
  background: var(--accent-soft); border-bottom: 1px solid rgba(247,143,30,.2);
  padding: 4px 8px; font-size: 7.5px; font-weight: 900; text-transform: uppercase;
  letter-spacing: .07em; color: var(--accent);
}
.gdB-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.gdB-price-row { flex-direction: row; gap: 6px; }
.gdB-inp { height: 20px; border-radius: 5px; background: var(--bg-app); border: 1.5px solid var(--border); }
.gdB-inp--tall { height: 36px; }
.gdB-inp--sel { background: var(--bg-app); }
.gdB-star { font-size: 9px; color: var(--text-muted); }
.gd-preview--c { background: var(--bg-card); }
.gdC-field { display: flex; flex-direction: column; gap: 3px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.gdC-lbl { font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: .14em; color: var(--text-muted); }
.gdC-inp { height: 20px; border: none; border-bottom: 1.5px solid var(--border); background: transparent; border-radius: 0; }
.gdC-inp--tall { height: 36px; }
.gdC-price-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.gdC-price-item { display: flex; flex-direction: column; gap: 3px; }
.gdC-price-val { font-size: 14px; font-weight: 700; color: var(--text-muted); border-bottom: 1.5px solid var(--border); padding-bottom: 2px; }
.gdC-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.gd-meta { padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.gd-name { font-size: 13.5px; font-weight: 800; color: var(--text-primary); }
.gd-desc { font-size: 11.5px; color: var(--text-muted); line-height: 1.5; }
</style>
