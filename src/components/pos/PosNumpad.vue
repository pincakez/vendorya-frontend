<template>
  <div class="numpad" :class="{ calc: calcMode }">
    <div class="np-head">
      <button type="button" class="np-title" @click="toggleCalc">
        {{ calcMode ? t('pos.numpad.calculator') : t('pos.numpad.title') }}
      </button>
      <span class="np-lock" :class="{ on: numLockOn }">
        <component :is="numLockOn ? Lock : LockOpen" :size="11" />
        {{ t('pos.numpad.num_lock') }}
      </span>
    </div>

    <!-- Calculator display — slides in when calc mode turns on -->
    <Transition name="np-disp">
      <div v-if="calcMode" class="np-display">
        <div class="np-disp-expr">{{ display || '0' }}</div>
        <div class="np-disp-result">{{ resultPreview }}</div>
      </div>
    </Transition>

    <!-- KEYPAD MODE: tactile number pad that types into the search bar -->
    <div v-if="!calcMode" class="np-grid">
      <button
        v-for="k in keys" :key="k.id"
        type="button"
        class="np-key"
        :class="{ 'np-flash': flashKey === k.id }"
        @mousedown.prevent="press(k.id)"
        @touchstart.prevent="press(k.id)"
      >
        <component :is="k.icon" v-if="k.icon" :size="15" />
        <span v-else>{{ k.label }}</span>
      </button>
    </div>

    <!-- CALCULATOR MODE: full 4-column calculator -->
    <div v-else class="np-calc-grid">
      <button
        v-for="(k, i) in calcKeys" :key="k.id"
        type="button"
        class="np-key motion-preset-fade"
        :class="[k.cls, { 'np-flash': flashKey === k.id, 'np-wide': k.wide }]"
        :style="{ animationDelay: (i * 18) + 'ms' }"
        @mousedown.prevent="press(k.id)"
        @touchstart.prevent="press(k.id)"
      >
        <component :is="k.icon" v-if="k.icon" :size="15" />
        <span v-else>{{ k.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock, LockOpen, Delete } from 'lucide-vue-next'

const { t } = useI18n()
const emit = defineEmits(['key', 'mode-change'])

// 3×4 numeric pad. In keypad mode pressing it (mouse/touch/physical) types into
// the search bar via the `key` event. In calc mode it drives the calculator.
const keys = [
  { id: '7', label: '7' }, { id: '8', label: '8' }, { id: '9', label: '9' },
  { id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' },
  { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' },
  { id: '0', label: '0' }, { id: '.', label: '.' }, { id: 'back', icon: Delete },
]

// Calculator layout (4 cols). op ids use JS operators internally.
const calcKeys = [
  { id: 'C',  label: 'C',  cls: 'np-clear' }, { id: 'CE', label: 'CE', cls: 'np-clear' }, { id: 'back', icon: Delete }, { id: '/', label: '÷', cls: 'np-op' },
  { id: '7', label: '7' }, { id: '8', label: '8' }, { id: '9', label: '9' }, { id: '*', label: '×', cls: 'np-op' },
  { id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' }, { id: '-', label: '−', cls: 'np-op' },
  { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }, { id: '+', label: '+', cls: 'np-op' },
  { id: '0', label: '0', wide: true }, { id: '.', label: '.' }, { id: '=', label: '=', cls: 'np-eq' },
]

const numLockOn = ref(true)
const flashKey  = ref(null)
let flashTimer = null

const calcMode = ref(false)
const expr     = ref('')   // internal expression using JS operators (* /)

const display = computed(() =>
  expr.value.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/-/g, ' − ').replace(/\+/g, ' + ')
)
const resultPreview = computed(() => {
  const r = safeEval(expr.value)
  return r === null ? '' : '= ' + (Math.round(r * 1e6) / 1e6)
})

function toggleCalc() {
  calcMode.value = !calcMode.value
  if (!calcMode.value) expr.value = ''
  emit('mode-change', calcMode.value)
}
function exitCalc() {
  if (!calcMode.value) return
  calcMode.value = false
  expr.value = ''
  emit('mode-change', false)
}

function flash(id) {
  flashKey.value = null
  requestAnimationFrame(() => {
    flashKey.value = id
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { flashKey.value = null }, 220)
  })
}

// A single press handler for mouse/touch and (via feedKey) physical keys.
function press(id) {
  flash(id)
  if (!calcMode.value) { emit('key', id); return }
  applyCalc(id)
}

function applyCalc(id) {
  if (id === 'C')   { expr.value = ''; return }
  if (id === 'CE')  { expr.value = expr.value.replace(/[\d.]+$/, ''); return }
  if (id === 'back'){ expr.value = expr.value.slice(0, -1); return }
  if (id === '=')   { const r = safeEval(expr.value); if (r !== null) expr.value = String(Math.round(r * 1e6) / 1e6); return }
  if ('+-*/'.includes(id)) {
    if (!expr.value && id !== '-') return                 // no leading operator (except minus)
    if (/[+\-*/]$/.test(expr.value)) expr.value = expr.value.slice(0, -1) // replace trailing op
    expr.value += id; return
  }
  // digit or '.'
  if (id === '.') {
    const lastNum = expr.value.split(/[+\-*/]/).pop()
    if (lastNum.includes('.')) return                     // one dot per number
  }
  expr.value += id
}

// Safe arithmetic evaluator — tokenize, then */ pass, then +- pass. No eval().
function safeEval(s) {
  if (!s || /[+\-*/.]$/.test(s)) return null
  const tokens = s.match(/(\d+\.?\d*|\.\d+|[+\-*/])/g)
  if (!tokens) return null
  // collapse a leading unary minus into the first number
  const nums = [], ops = []
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i]
    if ('+-*/'.includes(tk) && (i === 0 || '+-*/'.includes(tokens[i - 1]))) {
      if (tk === '-') { tokens[i + 1] = '-' + tokens[i + 1]; continue }
      return null
    }
    if ('+-*/'.includes(tk)) ops.push(tk); else nums.push(parseFloat(tk))
  }
  if (nums.length !== ops.length + 1) return null
  // multiply / divide first
  for (let i = 0; i < ops.length; ) {
    if (ops[i] === '*' || ops[i] === '/') {
      const v = ops[i] === '*' ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1]
      if (!isFinite(v)) return null
      nums.splice(i, 2, v); ops.splice(i, 1)
    } else i++
  }
  let acc = nums[0]
  for (let i = 0; i < ops.length; i++) acc = ops[i] === '+' ? acc + nums[i + 1] : acc - nums[i + 1]
  return isFinite(acc) ? acc : null
}

// Drive the calculator from physical keys (called by POS.vue while in calc mode).
function feedKey(key) {
  let id = null
  if (key >= '0' && key <= '9') id = key
  else if (key === '.') id = '.'
  else if (key === 'Backspace') id = 'back'
  else if (key === 'Enter' || key === '=') id = '='
  else if (key === 'Escape') id = 'C'
  else if (key === 'c' || key === 'C') id = 'C'
  else if ('+-*/'.includes(key)) id = key
  if (id) press(id)
}

function onKey(e) {
  if (typeof e.getModifierState === 'function') {
    numLockOn.value = e.getModifierState('NumLock')
  }
  // In calc mode, POS.vue routes physical keys to feedKey(); just track NumLock here.
  if (calcMode.value) return
  let id = null
  if (e.key >= '0' && e.key <= '9') id = e.key
  else if (e.key === '.')           id = '.'
  else if (e.key === 'Backspace')   id = 'back'
  if (id) flash(id)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(flashTimer)
})

defineExpose({ feedKey, exitCalc })
</script>

<style scoped>
.numpad {
  background: var(--bg-app); border: 1px solid var(--border);
  border-radius: 14px; padding: 8px;
}
.np-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 7px; }
.np-title {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 2px 4px;
  border-radius: 6px; transition: color 140ms var(--ease-out), background 140ms var(--ease-out);
}
.np-title:hover { color: var(--accent); background: var(--accent-soft); }
.numpad.calc .np-title { color: var(--accent); }
.np-lock {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-muted); opacity: 0.55;
  transition: color 160ms var(--ease-out), opacity 160ms var(--ease-out);
}
.np-lock.on { color: var(--accent); opacity: 1; }

/* Calculator display */
.np-display {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px;
  padding: 8px 12px; margin-bottom: 8px; overflow: hidden;
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
}
.np-disp-expr   { font-size: 16px; font-weight: 800; color: var(--text-primary); min-height: 20px; word-break: break-all; text-align: right; }
.np-disp-result { font-size: 12px; font-weight: 700; color: var(--accent); min-height: 14px; }
.np-disp-enter-active, .np-disp-leave-active { transition: max-height 280ms var(--ease-out), opacity 220ms var(--ease-out), transform 280ms var(--ease-spring); }
.np-disp-enter-from, .np-disp-leave-to { max-height: 0; opacity: 0; transform: translateY(-8px); margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
.np-disp-enter-to, .np-disp-leave-from { max-height: 80px; opacity: 1; }

.np-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.np-calc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.np-wide { grid-column: span 2; }

.np-key {
  position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  height: 34px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--bg-card);
  font-size: 15px; font-weight: 800; color: var(--text-secondary);
  cursor: pointer; user-select: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out),
              box-shadow 120ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.np-key:hover { border-color: var(--accent); color: var(--accent); }
.np-key:active { transform: scale(0.92); box-shadow: none; transition-duration: var(--press-down); }

.np-op    { color: var(--accent); }
.np-clear { color: var(--danger, #dc2626); }
.np-clear:hover { border-color: var(--danger, #dc2626); color: var(--danger, #dc2626); }
.np-eq    { background: var(--accent); color: #fff; border-color: var(--accent); }
.np-eq:hover { color: #fff; opacity: 0.92; }

/* White flash feedback — fires on press (mouse/touch) or matching physical key */
.np-flash::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: #fff; pointer-events: none;
  animation: np-flash 220ms var(--ease-out);
}
@keyframes np-flash {
  from { opacity: 0.92; }
  to   { opacity: 0; }
}
</style>
