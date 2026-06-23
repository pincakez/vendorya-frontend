<template>
  <div class="pos-view" @keydown="onGlobalKey" tabindex="-1" ref="posRoot">

   <!-- Compact scale wrapper: shrinks the POS ~22% but still fills the screen.
        Modals/overlays live OUTSIDE this so they render at full size. -->
   <div class="pos-scale">

    <!-- ─── Top bar ─────────────────────────────────────────── -->
    <div class="pos-topbar">
      <div class="pos-topbar-left">
        <button class="pos-back-btn" @click="goBack" :title="'Back'"><ArrowLeft :size="15" /></button>
        <span class="pos-brand">{{ t('pos.brand') }}</span>
        <span class="pos-divider">|</span>
        <span class="pos-store">{{ auth.storeName }}</span>
      </div>

      <div class="pos-search-wrap" ref="searchWrapEl">
        <Search :size="15" class="pos-search-icon" />
        <input
          ref="searchInputEl"
          v-model="searchQuery"
          @input="onSearchInput"
          @keydown="onSearchKeydown"
          @focus="searchFocused = true"
          @blur="onSearchBlur"
          :placeholder="t('pos.search_placeholder')"
          class="pos-search"
        />
        <kbd class="pos-search-kbd">F1</kbd>

        <div v-if="searchResults.length && searchFocused" class="pos-search-dropdown">
          <div
            v-for="(p, i) in searchResults" :key="p.id"
            :class="['pos-search-item', { highlighted: i === searchIndex }]"
            @mousedown.prevent="addToCart(p)"
            @mouseenter="searchIndex = i"
          >
            <span class="psi-name">{{ p.name }}</span>
            <span class="psi-sku">{{ p.sku_display }}</span>
            <span class="psi-price">{{ fmtNum(p.default_variant_price) }}</span>
          </div>
        </div>
      </div>

      <div class="pos-topbar-right">
        <span class="pos-operator">{{ auth.user?.first_name || auth.displayName }}</span>
        <span class="pos-branch-chip">{{ pos.branchName }}</span>
        <span class="pos-clock">{{ liveTime }}</span>
      </div>
    </div>

    <!-- ─── Body: Left | Center | Right ─────────────────────── -->
    <div class="pos-body">

      <!-- LEFT — Top Selling + Favorites -->
      <div class="pos-left">
        <div class="pos-panel-section">
          <div class="pos-panel-title">{{ t('pos.top_selling') }}</div>
          <div v-if="pos.topSelling.length" class="pos-quick-grid">
            <button
              v-for="p in pos.topSelling" :key="p.id"
              class="pos-quick-btn"
              @click="addToCart(p)"
            >
              <span class="pqb-name">{{ p.name }}</span>
              <span class="pqb-price">{{ fmtNum(p.default_variant_price) }}</span>
            </button>
          </div>
          <div v-else class="pos-panel-empty">{{ t('pos.no_data') }}</div>
        </div>

        <div class="pos-panel-section pos-panel-section--fav">
          <div class="pos-panel-title">{{ t('pos.favorites') }}</div>
          <div v-if="pos.favorites.length" class="pos-quick-grid">
            <button
              v-for="p in pos.favorites" :key="p.id"
              class="pos-quick-btn pos-quick-btn--fav"
              @click="addToCartFromFav(p)"
            >
              <span class="pqb-name">{{ p.product_name }}</span>
              <span class="pqb-price">{{ fmtNum(p.product_price) }}</span>
            </button>
          </div>
          <div v-else class="pos-panel-empty">{{ t('pos.no_favorites') }}</div>
        </div>
      </div>

      <!-- CENTER — Invoice header + cart -->
      <div class="pos-center">
        <div class="pos-invoice-bar">
          <div class="pib-meta">
            <span class="pib-num">{{ pos.currentInvoiceId ? t('pos.draft') : '—' }}</span>
            <span class="pib-branch">{{ pos.branchName }}</span>
          </div>

          <div class="pos-customer-area" ref="customerWrapEl">
            <UserIcon :size="14" class="pos-customer-icon" />
            <span
              v-if="cart.customerObj && !customerFocused"
              class="pos-customer-name"
              @click="openCustomerSearch"
            >{{ cart.customerObj.name }}</span>
            <input
              v-else
              ref="customerInputEl"
              v-model="customerQuery"
              @input="onCustomerInput"
              @keydown="onCustomerKeydown"
              @focus="customerFocused = true"
              @blur="onCustomerBlur"
              :placeholder="t('pos.walk_in')"
              class="pos-customer-input"
            />
            <div v-if="customerFocused && customerQuery.length >= 2" class="pos-customer-dropdown">
              <div
                v-for="(c, i) in customerResults" :key="c.id"
                class="pos-customer-item"
                :class="{ highlighted: i === customerIndex }"
                @mousedown.prevent="selectCustomer(c)"
              >
                <span>{{ c.name }}</span>
                <span class="pci-phone">{{ c.phone_number }}</span>
              </div>
              <!-- Not found row -->
              <div
                v-if="!customerResults.length"
                class="pos-customer-item pci-add"
                @mousedown.prevent="showAddCustomer = true"
              >
                <span>{{ t('pos.no_customer_found') }}</span>
              </div>
            </div>
          </div>

          <div v-if="cart.discount > 0" class="pib-discount-chip">
            − {{ fmtNum(cart.discount) }}
            <button @click="cart.setDiscount(0)"><X :size="10" /></button>
          </div>
        </div>

        <div class="pos-cart-header">
          <span class="pch-item">{{ t('pos.col.item') }}</span>
          <span class="pch-qty">{{ t('pos.col.qty') }}</span>
          <span class="pch-disc">{{ t('pos.col.disc') }}</span>
          <span class="pch-price">{{ t('pos.col.price') }}</span>
          <span></span>
        </div>

        <div class="pos-cart-body">
          <TransitionGroup name="cart-row" tag="div" class="pcr-list">
            <div
              v-for="(item, idx) in cart.items" :key="item.key"
              :class="['pos-cart-row', { 'pcr-selected': idx === selectedRow, 'pcr-flash': item._flash }]"
              @click="selectedRow = idx"
            >
              <div class="pcr-main">
                <button
                  v-if="(item.units?.length || 0) > 1"
                  class="pcr-name pcr-name-btn"
                  :title="t('pos.change_unit')"
                  @click.stop="openUnitChange(item)"
                >
                  <span class="pcr-name-txt">{{ item.name }}<span v-if="item.unit_name" class="pcr-unit"> · {{ item.unit_name }}</span></span>
                  <ChevronDown :size="11" class="pcr-name-caret" />
                </button>
                <span v-else class="pcr-name">{{ item.name }}<span v-if="item.unit_name" class="pcr-unit"> · {{ item.unit_name }}</span></span>
                <div v-if="lineTags(item).length" class="pcr-tags">
                  <span v-for="(tg, ti) in lineTags(item)" :key="ti" class="pcr-tag">{{ tg }}</span>
                </div>
              </div>
              <div class="pcr-qty-ctrl">
                <!-- Weight line: click the value to re-enter the kg off the scale -->
                <button v-if="item.is_weight" class="pcr-weight-val" @click.stop="openWeightEntry(item.key)">
                  {{ fmtQty(item.qty) }} kg
                </button>
                <template v-else>
                  <button class="pcr-qty-btn" @click.stop="cart.updateQty(item.key, item.qty - 1)">−</button>
                  <span class="pcr-qty-val">{{ item.qty }}</span>
                  <button class="pcr-qty-btn" @click.stop="cart.updateQty(item.key, item.qty + 1)">+</button>
                </template>
              </div>
              <button class="pcr-disc" :class="{ 'pcr-disc--set': item.discType }" @click.stop="openLineDiscount(item)">
                {{ lineDiscLabel(item) }}
              </button>
              <span class="pcr-price" :class="{ 'pcr-price--cut': item.discType }">
                <template v-if="item.discType"><s>{{ fmtNum(item.price * item.qty) }}</s> {{ fmtNum(item.price * item.qty - cart.lineDiscount(item)) }}</template>
                <template v-else>{{ fmtNum(item.price * item.qty) }}</template>
              </span>
              <button class="pcr-del" @click.stop="removeItem(item.key)"><X :size="13" /></button>
            </div>
          </TransitionGroup>
          <div v-if="cart.isEmpty" class="pos-cart-empty">
            <ShoppingCart :size="32" class="pce-icon" />
            <span>{{ t('pos.cart_empty') }}</span>
          </div>
        </div>
      </div>

      <!-- RIGHT — Actions + Keypad (scroll) · Total + PAY (pinned) -->
      <div class="pos-right">
        <div class="pos-right-scroll">
          <div class="pos-actions-grid">
            <button class="pac" :class="{ 'pac--held': cart.heldCarts.length }" :data-tip="actionTip('hold')" @click="holdOrResume">
              <Pause :size="15" />
              <span>{{ t('pos.actions.hold') }}<span v-if="cart.heldCarts.length" class="pac-badge">{{ cart.heldCarts.length }}</span></span>
            </button>
            <button class="pac" :data-tip="actionTip('discount')" @click="openInvoiceDiscount">
              <Percent :size="15" />
              <span>{{ t('pos.actions.discount') }}</span>
            </button>
            <button class="pac" :data-tip="actionTip('returns')" @click="$router.push('/finance/returns')">
              <CornerDownLeft :size="15" />
              <span>{{ t('pos.actions.returns') }}</span>
            </button>
            <button class="pac" :data-tip="actionTip('customer')" @click="focusCustomer">
              <UserIcon :size="15" />
              <span>{{ t('pos.actions.customer') }}</span>
            </button>
            <button class="pac" :data-tip="actionTip('reprint')" @click="reprint" :disabled="!pos.lastPostedInvoiceId">
              <Printer :size="15" />
              <span>{{ t('pos.actions.reprint') }}</span>
            </button>
            <button class="pac pac--disabled" :data-tip="actionTip('note')" disabled>
              <FileText :size="15" />
              <span>{{ t('pos.actions.note') }}</span>
            </button>
          </div>

          <PosNumpad class="pos-numpad" ref="numpadRef" @key="onNumpadKey" @mode-change="numpadCalc = $event" />
        </div>

        <div class="pos-right-foot">
          <div class="pos-summary">
            <div class="psum-row">
              <span>{{ t('pos.summary.subtotal') }}</span><span>{{ fmtNum(cart.subtotal) }}</span>
            </div>
            <div v-if="cart.lineDiscountTotal > 0" class="psum-row psum-discount">
              <span>{{ t('pos.line_discount') }}</span><span>− {{ fmtNum(cart.lineDiscountTotal) }}</span>
            </div>
            <div v-if="cart.discount > 0" class="psum-row psum-discount">
              <span>{{ t('pos.summary.discount') }}</span><span>− {{ fmtNum(cart.discount) }}</span>
            </div>
            <div class="psum-divider" />
            <div class="psum-row psum-total">
              <span>{{ t('pos.summary.total') }}</span><span>{{ fmtNum(cart.grandTotal) }}</span>
            </div>
            <div class="psum-items">{{ t('pos.items_count', { n: cart.itemCount }, cart.itemCount) }}</div>
          </div>

          <label class="pos-additive">
            <input type="checkbox" :checked="cart.additive" @change="cart.setAdditive($event.target.checked)" />
            <span>{{ t('pos.additive_label') }}</span>
          </label>

          <button class="pos-pay-btn" :disabled="cart.isEmpty" @click="openPayment">
            <span>{{ t('pos.pay') }}</span>
            <span class="pos-pay-amount">{{ auth.currencySymbol }} {{ fmtNum(cart.grandTotal) }}</span>
          </button>
        </div>
      </div>
    </div>
   </div><!-- /pos-scale -->

    <!-- ─── Scan sweep — a bright beam that races top→bottom ── -->
    <div v-if="pos.animateScan" class="pos-scan-beam" />

    <!-- ─── Modals ─────────────────────────────────────────── -->
    <BranchPickerModal v-if="showBranchPicker" @selected="onBranchSelected" />
    <PaymentModal      v-if="showPayment"   @close="showPayment = false"   @success="onPaymentSuccess" />
    <DiscountModal     v-if="showDiscount"  :context="discountCtx" @close="showDiscount = false" />

    <!-- Unit picker: choose Pack / Strip / Tablet for a multi-unit product -->
    <div v-if="unitPicker" class="pos-unit-overlay" @click.self="unitPicker = null">
      <div class="pos-unit-card">
        <div class="pos-unit-head">{{ unitPicker.product.name }}</div>
        <div class="pos-unit-sub">{{ unitPicker.replaceKey ? t('pos.change_unit') : t('pos.choose_unit') }}</div>
        <div class="pos-unit-list">
          <button
            v-for="u in unitPicker.units" :key="u.id || 'base'"
            class="pos-unit-btn"
            :class="{ 'pos-unit-btn--current': unitPicker.replaceKey && (u.id || null) === unitPicker.currentUnitId }"
            @click="pickUnit(u)"
          >
            <span class="pub-name">{{ u.name }}</span>
            <span class="pub-meta">×{{ fmtNum(u.factor) }} · {{ fmtNum(u.price) }}</span>
          </button>
        </div>
        <button class="pos-unit-cancel" @click="unitPicker = null">{{ t('common.cancel') }}</button>
      </div>
    </div>
    <!-- Weight entry: type the kg off the scale for a per-kg product -->
    <div v-if="weightEntry" class="pos-unit-overlay" @click.self="confirmWeightEntry">
      <div class="pos-unit-card pos-weight-card">
        <div class="pos-unit-head">{{ weightEntry.name }}</div>
        <div class="pos-unit-sub">{{ t('pos.weight.enter') }} · {{ fmtNum(weightEntry.price) }}{{ t('pos.weight.per_kg') }}</div>
        <div class="pos-weight-display">
          <input ref="weightInputEl" v-model="weightEntry.value" class="pos-weight-input"
                 inputmode="decimal" @keyup.enter="confirmWeightEntry"
                 :placeholder="t('pos.weight.kg_placeholder')" />
          <span class="pos-weight-unit">kg</span>
        </div>
        <div class="pos-weight-total">= {{ fmtNum((parseFloat(weightEntry.value) || 0) * weightEntry.price) }}</div>
        <div class="pos-weight-pad">
          <button v-for="k in ['7','8','9','4','5','6','1','2','3','.','0','C']" :key="k"
                  class="pos-weight-key" :class="{ 'pos-weight-key--c': k === 'C' }"
                  @click="weightKey(k)">{{ k }}</button>
        </div>
        <button class="pos-unit-cancel pos-weight-ok" @click="confirmWeightEntry">{{ t('common.done') }}</button>
      </div>
    </div>
    <CustomerFormModal
      :open="showAddCustomer"
      :prefill-name="addCustomerPrefill.name"
      :prefill-phone="addCustomerPrefill.phone"
      @close="showAddCustomer = false"
      @saved="onAddCustomerSaved"
    />

    <!-- ─── Success overlay ────────────────────────────────── -->
    <Transition name="success-pop">
      <div v-if="successInvoice" class="pos-success-overlay">
        <div class="pos-success-card">
          <CheckCircle2 :size="52" class="psc-icon" />
          <div class="psc-label">{{ t('pos.success.title') }}</div>
          <div class="psc-num">{{ t('pos.success.invoice', { num: successInvoice.invoice_number }) }}</div>
          <div class="psc-amount">{{ auth.currencySymbol }} {{ fmtNum(successInvoice.grand_total) }}</div>
          <div class="psc-actions">
            <button class="psc-print" @click="printInvoice(successInvoice.id)">
              <Printer :size="16" /> {{ t('pos.success.print') }}
            </button>
            <button class="psc-new" @click="newSale">{{ t('pos.success.new_sale') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ─── Service modal (F7) ─────────────────────────────── -->
    <ServiceFormModal
      :open="showServiceModal"
      :service-types="posServiceTypes"
      @close="showServiceModal = false"
      @saved="showServiceModal = false"
    />

    <!-- ─── Held carts panel ───────────────────────────────── -->
    <Transition name="held-slide">
      <div v-if="showHeldPanel" class="pos-held-panel">
        <div class="php-header">
          <span>{{ t('pos.held.title', { n: cart.heldCarts.length }) }}</span>
          <button @click="showHeldPanel = false"><X :size="16" /></button>
        </div>
        <div v-for="(held, i) in cart.heldCarts" :key="i" class="php-item" @click="resumeHeld(i)">
          <span class="php-items-label">{{ t('pos.items_count', { n: held.items.length }, held.items.length) }}</span>
          <span class="php-total">{{ auth.currencySymbol }} {{ fmtNum(held.items.reduce((s, it) => s + it.price * it.qty, 0)) }}</span>
        </div>
        <div v-if="!cart.heldCarts.length" class="php-empty">{{ t('pos.held.empty') }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Search, User as UserIcon, X, Pause, Percent, CornerDownLeft,
  Printer, FileText, ShoppingCart, CheckCircle2, ArrowLeft, ChevronDown,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore }  from '@/stores/auth'
import { useCartStore }  from '@/stores/cart'
import { usePosStore }   from '@/stores/pos'
import { useUIStore }    from '@/stores/ui'
import BranchPickerModal   from '@/components/pos/BranchPickerModal.vue'
import PaymentModal        from '@/components/pos/PaymentModal.vue'
import DiscountModal       from '@/components/pos/DiscountModal.vue'
import PosNumpad           from '@/components/pos/PosNumpad.vue'
import CustomerFormModal   from '@/components/shared/CustomerFormModal.vue'
import ServiceFormModal    from '@/views/services/ServiceFormModal.vue'

const router = useRouter()
const { t } = useI18n()

function goBack() {
  const prev = window.history.state?.back
  router.push(prev && prev !== '/pos' ? prev : '/dashboard')
}
const auth   = useAuthStore()
const cart   = useCartStore()
const pos    = usePosStore()
const ui     = useUIStore()

// ── Sidebar + POS mode ───────────────────────────────────────
let prePosSidebarState = false
const posRoot = ref(null)

// ── Service modal (F7) ───────────────────────────────────────
const showServiceModal = ref(false)
const posServiceTypes  = ref([])

onMounted(async () => {
  document.documentElement.classList.add('pos-mode')
  prePosSidebarState = ui.sidebarCollapsed
  ui.setSidebarCollapsed(true)
  await init()
  nextTick(() => posRoot.value?.focus())
})
onUnmounted(() => {
  document.documentElement.classList.remove('pos-mode')
  ui.setSidebarCollapsed(prePosSidebarState)
})

// ── Clock ────────────────────────────────────────────────────
const liveTime = ref(nowStr())
let clockTimer
function nowStr() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
onMounted(() => { clockTimer = setInterval(() => { liveTime.value = nowStr() }, 1000) })
onUnmounted(() => clearInterval(clockTimer))

// ── Init ─────────────────────────────────────────────────────
const showBranchPicker = ref(false)

async function init() {
  // Load payment methods
  try {
    const res = await api.get('/api/finance/payment-methods/')
    pos.paymentMethods = (res.data.results || res.data).filter(m => !m.is_deleted)
  } catch { /* ok */ }

  // Load top-selling + favorites + service types in parallel
  Promise.all([
    api.get('/api/pos/top-selling/').then(r => { pos.topSelling = r.data.results || r.data }).catch(() => {}),
    api.get('/api/pos/favorites/').then(r => { pos.favorites = r.data.results || r.data }).catch(() => {}),
    api.get('/api/core/settings/').then(r => {
      posServiceTypes.value  = r.data.service_types ?? []
      cartDisplayFields.value = Array.isArray(r.data.pos_cart_display_fields) ? r.data.pos_cart_display_fields : []
    }).catch(() => {}),
  ])

  // Branch selection
  try {
    const bRes = await api.get('/api/core/branches/')
    const branches = bRes.data.results || bRes.data
    if (branches.length === 1) {
      pos.initSession(branches[0])
      await loadWalkIn()
      return
    }
    if (auth.user?.default_branch) {
      const branch = branches.find(b => b.id === auth.user.default_branch)
      if (branch) { pos.initSession(branch); await loadWalkIn(); return }
    }
  } catch { /* ok */ }

  showBranchPicker.value = true
}

async function onBranchSelected(branch) {
  showBranchPicker.value = false
  pos.initSession(branch)
  await loadWalkIn()
}

async function loadWalkIn() {
  try {
    const res = await api.get('/api/auth/customers/', { params: { is_walk_in: 'true', page_size: 1 } })
    const walkin = (res.data.results || res.data)[0]
    if (walkin) cart.setCustomer(walkin)
  } catch { /* ok */ }
  nextTick(() => searchInputEl.value?.focus())
}

// ── Search ───────────────────────────────────────────────────
const searchInputEl = ref(null)
const searchWrapEl  = ref(null)
const searchQuery   = ref('')
const searchResults = ref([])
const searchIndex   = ref(-1)
const searchFocused = ref(false)

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  if (searchQuery.value.length < 2) { searchResults.value = []; return }
  searchTimer = setTimeout(runSearch, 200)
}

async function runSearch() {
  try {
    const res = await api.get('/api/inventory/products/', {
      params: { search: searchQuery.value, page_size: 12 }
    })
    searchResults.value = (res.data.results || res.data).filter(p => !p.hide_from_pos)
    searchIndex.value = searchResults.value.length ? 0 : -1
  } catch { /* ok */ }
}

function onSearchKeydown(e) {
  const len = searchResults.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault(); searchIndex.value = Math.min(searchIndex.value + 1, len - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault(); searchIndex.value = Math.max(searchIndex.value - 1, 0)
  } else if (e.key === 'Tab' && len > 0) {
    e.preventDefault()
    if (e.shiftKey) {
      searchIndex.value = searchIndex.value <= 0 ? len - 1 : searchIndex.value - 1
    } else {
      searchIndex.value = searchIndex.value >= len - 1 ? 0 : searchIndex.value + 1
    }
  } else if (e.key === 'Enter' && searchIndex.value >= 0) {
    e.preventDefault(); addToCart(searchResults.value[searchIndex.value])
  } else if (e.key === 'Escape') {
    searchResults.value = []; searchQuery.value = ''
  }
}

function onSearchBlur() {
  setTimeout(() => { searchFocused.value = false }, 200)
}

// ── Add to cart ──────────────────────────────────────────────
const selectedRow = ref(-1)

// Fields the cashier chose (in POS Settings → Cart Display) to show under each
// cart line. Tokens: 'category' or 'attr:<attribute_key>'.
const cartDisplayFields = ref([])
function lineTags(item) {
  const out = []
  for (const tok of cartDisplayFields.value) {
    if (tok === 'category') {
      if (item.category) out.push(item.category)
    } else if (tok.startsWith('attr:')) {
      const v = item.attributes?.[tok.slice(5)]
      if (v) out.push(Array.isArray(v) ? v.join(' / ') : v)
    }
  }
  return out
}

async function addToCart(product, unit = null) {
  if (!pos.branchId) return
  // Guard: a product with no sellable variant would poison the draft invoice
  // (backend rejects the bad pk, the error gets swallowed, and Pay silently dies).
  if (!product.default_variant_id) {
    alert(t('pos.alert_no_variant', { name: product.name || t('pos.alert_no_variant_fallback') }))
    return
  }
  const units = Array.isArray(product.selling_units)
    ? product.selling_units.filter(u => u.sellable !== false)
    : []
  // Multiple sellable units and none chosen yet → ask which (Pack/Strip/Tablet).
  // Single-unit products skip this entirely and add silently, exactly as before.
  if (!unit && units.length > 1) {
    unitPicker.value = { product, units }
    return
  }
  const chosen = unit || units[0] || null
  const isBase = !chosen || chosen.is_base
  const isWeight = !!(chosen && chosen.is_weight)
  cart.addItem({
    id:    product.default_variant_id,
    name:  product.name,
    price: chosen ? chosen.price : product.default_variant_price,
    stock: product.default_variant_stock,
    unit_id:     isBase ? null : chosen.id,
    unit_factor: chosen ? chosen.factor : 1,
    unit_name:   isWeight ? 'kg' : (isBase ? '' : chosen.name),
    is_weight:   isWeight,
    units,       // keep the sellable unit list on the line so it can be re-picked
    attributes: product.attributes_summary || null,
    category:   product.category_name || '',
  })
  unitPicker.value = null
  // Weight product → immediately ask the cashier for the weight off the scale.
  if (isWeight) {
    const key = `${product.default_variant_id}|base`
    openWeightEntry(key)
  }
  searchQuery.value = ''
  searchResults.value = []
  pos.triggerScan()
  playBeep()
  selectedRow.value = cart.items.length - 1
  nextTick(() => {
    searchInputEl.value?.focus()
    searchFocused.value = true  // calling .focus() on an already-focused input won't re-fire @focus, so we set this explicitly
  })
  schedulePatch()
}

// Re-open the unit picker for a line already in the cart so the cashier can
// flip its selling unit (Tablet ↔ Strip ↔ Pack) without deleting + re-adding.
// Rebuilds a product-shaped object from the line so addToCart can replay it.
function openUnitChange(item) {
  const units = Array.isArray(item.units) ? item.units.filter(u => u.sellable !== false) : []
  if (units.length < 2) return
  const base = units.find(u => u.is_base)
  unitPicker.value = {
    product: {
      default_variant_id:    item.variant_id,
      name:                  item.name,
      default_variant_price: base ? base.price : item.price,
      default_variant_stock: item.stock,
      selling_units:         item.units,
      attributes_summary:    item.attributes,
      category_name:         item.category,
    },
    units,
    replaceKey:    item.key,
    replaceQty:    item.qty,
    currentUnitId: item.unit_id || null,
  }
}

// Unit-picker tap handler — branches add (default) vs replace (re-pick on a line).
function pickUnit(u) {
  const p = unitPicker.value
  if (!p) return
  if (p.replaceKey) {
    const qty = p.replaceQty
    cart.removeItem(p.replaceKey)
    addToCart(p.product, u)            // re-adds at qty 1 (closes the picker)
    const newKey = `${p.product.default_variant_id}|${u.id || 'base'}`
    if (qty > 1 && !u.is_weight) cart.updateQty(newKey, qty)   // keep the count across the unit swap
  } else {
    addToCart(p.product, u)
  }
}

function removeLast() {
  if (cart.isEmpty) return
  const last = cart.items[cart.items.length - 1]
  cart.removeItem(last.key)
  schedulePatch()
}

function addToCartFromFav(fav) {
  addToCart({
    default_variant_id:    fav.default_variant_id,
    name:                  fav.product_name,
    default_variant_price: fav.default_variant_price ?? fav.product_price,
    default_variant_stock: fav.default_variant_stock ?? 999,
  })
}

// ── DRAFT invoice management ─────────────────────────────────
let patchTimer = null
function schedulePatch() {
  clearTimeout(patchTimer)
  patchTimer = setTimeout(syncInvoice, 300)
}

async function syncInvoice() {
  if (!pos.branchId || cart.isEmpty) return
  const payload = {
    branch:   pos.branchId,
    customer: cart.customerId,
    date:     new Date().toISOString(),
    status:   'DRAFT',
    discount: cart.invoiceDiscountAmount,
    items:    cart.items.map(i => ({
      variant: i.variant_id,
      unit: i.unit_id,            // null = base unit; backend freezes the factor
      quantity: i.qty,
      unit_price: i.price,
      discount_amount: cart.lineDiscount(i),
    })),
  }
  try {
    if (!pos.currentInvoiceId) {
      const res = await api.post('/api/finance/invoices/', payload)
      pos.setCurrentInvoice(res.data.id)
    } else {
      await api.patch(`/api/finance/invoices/${pos.currentInvoiceId}/`, payload)
    }
  } catch { /* best-effort */ }
}

watch(() => cart.items.map(i => `${i.key}:${i.qty}:${i.discType || ''}:${i.discValue || 0}`).join(), schedulePatch)
watch(() => cart.customerId, schedulePatch)
watch(() => `${cart.invDiscType || ''}:${cart.invDiscValue}:${cart.additive}`, schedulePatch)

function removeItem(key) {
  cart.removeItem(key)
  if (selectedRow.value >= cart.items.length) selectedRow.value = cart.items.length - 1
  schedulePatch()
}

// ── Customer search ──────────────────────────────────────────
const customerWrapEl  = ref(null)
const customerInputEl = ref(null)
const customerQuery   = ref('')
const customerResults = ref([])
const customerFocused = ref(false)
const customerIndex   = ref(-1)

// Add-customer modal (opened when search finds no match)
const showAddCustomer    = ref(false)
const addCustomerPrefill = reactive({ name: '', phone: '' })

let customerTimer = null
function onCustomerInput() {
  clearTimeout(customerTimer)
  customerIndex.value = -1
  customerTimer = setTimeout(runCustomerSearch, 250)
}
async function runCustomerSearch() {
  if (customerQuery.value.length < 2) { customerResults.value = []; return }
  try {
    const res = await api.get('/api/auth/customers/', { params: { search: customerQuery.value, page_size: 8 } })
    customerResults.value = (res.data.results || res.data).filter(c => !c.is_walk_in)
    customerIndex.value = customerResults.value.length ? 0 : -1
  } catch { /* ok */ }
}
function onCustomerBlur() {
  setTimeout(() => { customerFocused.value = false; customerQuery.value = ''; customerResults.value = [] }, 200)
}
function openCustomerSearch() {
  customerFocused.value = true
  nextTick(() => customerInputEl.value?.focus())
}
function selectCustomer(c) {
  cart.setCustomer(c)
  customerQuery.value = ''
  customerResults.value = []
  customerFocused.value = false
  customerIndex.value = -1
  schedulePatch()
}
function focusCustomer() {
  customerFocused.value = true
  nextTick(() => customerInputEl.value?.focus())
}
function onCustomerKeydown(e) {
  const len = customerResults.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault(); customerIndex.value = Math.min(customerIndex.value + 1, len - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault(); customerIndex.value = Math.max(customerIndex.value - 1, 0)
  } else if (e.key === 'Tab' && len > 0) {
    e.preventDefault()
    if (e.shiftKey) {
      customerIndex.value = customerIndex.value <= 0 ? len - 1 : customerIndex.value - 1
    } else {
      customerIndex.value = customerIndex.value >= len - 1 ? 0 : customerIndex.value + 1
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (customerIndex.value >= 0 && customerResults.value[customerIndex.value]) {
      selectCustomer(customerResults.value[customerIndex.value])
    } else if (customerQuery.value.trim().length >= 1) {
      // Not found — open add-customer modal with prefilled data
      const q = customerQuery.value.trim()
      const looksLikePhone = /^[\d\s+()-]{4,}$/.test(q)
      addCustomerPrefill.name  = looksLikePhone ? '' : q
      addCustomerPrefill.phone = looksLikePhone ? q  : ''
      customerFocused.value = false
      showAddCustomer.value = true
    }
  } else if (e.key === 'Escape') {
    customerResults.value = []; customerQuery.value = ''; customerFocused.value = false
  }
}
function onAddCustomerSaved(customer) {
  selectCustomer(customer)
}

// ── Hold / Resume ────────────────────────────────────────────
const showHeldPanel = ref(false)

async function holdOrResume() {
  if (cart.isEmpty && cart.heldCarts.length) {
    showHeldPanel.value = !showHeldPanel.value
    return
  }
  if (!cart.isEmpty) {
    if (pos.currentInvoiceId) {
      api.post(`/api/finance/invoices/${pos.currentInvoiceId}/void/`).catch(() => {})
      pos.clearSession()
    }
    cart.holdCart()
    showHeldPanel.value = true
  } else {
    showHeldPanel.value = !showHeldPanel.value
  }
}

async function resumeHeld(i) {
  if (pos.currentInvoiceId) {
    api.post(`/api/finance/invoices/${pos.currentInvoiceId}/void/`).catch(() => {})
    pos.clearSession()
  }
  cart.resumeHeld(i)
  showHeldPanel.value = false
  schedulePatch()
}

// ── Payment ──────────────────────────────────────────────────
const showPayment    = ref(false)
const showDiscount   = ref(false)
const discountCtx    = ref('invoice')   // 'invoice' or { key, lineTotal }
// Unit picker: set to { product, units } when a multi-unit product needs a
// Pack/Strip/Tablet choice before it can be added to the cart.
const unitPicker     = ref(null)
const successInvoice = ref(null)

// Weight entry: set to { key, name, price, value } when a weight product (sold
// per kg, decimal qty) needs the cashier to type the weight off the scale.
const weightEntry = ref(null)
function openWeightEntry(key) {
  const item = cart.items.find(i => i.key === key)
  if (!item) return
  weightEntry.value = { key, name: item.name, price: item.price, value: String(item.qty || '') }
  nextTick(() => weightInputEl.value?.focus())
}
function weightKey(d) {
  if (!weightEntry.value) return
  if (d === 'C') { weightEntry.value.value = ''; return }
  if (d === '.' && weightEntry.value.value.includes('.')) return
  weightEntry.value.value = (weightEntry.value.value + d).slice(0, 10)
}
function confirmWeightEntry() {
  if (!weightEntry.value) return
  const kg = parseFloat(weightEntry.value.value)
  if (!Number.isFinite(kg) || kg <= 0) { cart.removeItem(weightEntry.value.key) }
  else cart.updateQty(weightEntry.value.key, kg)
  weightEntry.value = null
  nextTick(() => searchInputEl.value?.focus())
}
const weightInputEl = ref(null)

// ── Numpad / calculator ──────────────────────────────────────
const numpadRef  = ref(null)
const numpadCalc = ref(false)

// Keypad mode: a pressed key types into the search bar (touch + physical via numpad).
function onNumpadKey(id) {
  searchInputEl.value?.focus()
  if (id === 'back') searchQuery.value = searchQuery.value.slice(0, -1)
  else               searchQuery.value += id
  onSearchInput()
}

// ── Discount helpers ─────────────────────────────────────────
function openInvoiceDiscount() {
  discountCtx.value = 'invoice'
  showDiscount.value = true
}
function openLineDiscount(item) {
  discountCtx.value = { key: item.key, lineTotal: item.price * item.qty }
  showDiscount.value = true
}
function lineDiscLabel(item) {
  if (!item.discType) return t('pos.add_discount')          // "+"
  if (item.discType === 'free') return t('pos.discount_modal.tab_free')
  if (item.discType === 'percent') return `${item.discValue}%`
  return `−${item.discValue}`
}

async function openPayment() {
  if (cart.isEmpty) return
  // Flush any pending debounced patch so the draft reflects the latest
  // discounts/qty before we checkout the (otherwise stale) server draft.
  clearTimeout(patchTimer)
  await syncInvoice()
  if (pos.currentInvoiceId) {
    showPayment.value = true
  } else {
    // Draft never saved (e.g. a bad cart line). Don't die silently.
    alert(t('pos.alert_no_sale'))
  }
}

function onPaymentSuccess(invoice, printPrefs = {}) {
  showPayment.value = false
  pos.lastPostedInvoiceId = invoice.id
  successInvoice.value = invoice
  // Auto-print per the cashier's choice in the payment modal.
  if (printPrefs.print) printInvoice(invoice.id, printPrefs.copies || 1)
}

function newSale() {
  successInvoice.value = null
  cart.clearCart()
  pos.clearSession()
  loadWalkIn()
}

function printInvoice(id, copies = 1) {
  const q = copies > 1 ? `?auto=1&copies=${copies}` : '?auto=1'
  window.open(`/finance/invoices/${id}/print${q}`, '_blank')
}

function reprint() {
  if (!pos.lastPostedInvoiceId) return
  printInvoice(pos.lastPostedInvoiceId)
}

// ── Global keyboard shortcuts ─────────────────────────────────
const posSettings = computed(() => auth.user?.pos_settings || {})
const shortcuts = computed(() => ({
  focus_search: 'F1',
  pay:          'F9',
  discount:     'F8',
  hold:         'F4',
  reprint:      'F2',
  remove_last:  'F10',
  undo:         'Ctrl+Z',
  redo:         'Ctrl+Y',
  returns:      'Alt+R',
  fav_1:  'Alt+1', fav_2:  'Alt+2', fav_3:  'Alt+3',
  fav_4:  'Alt+4', fav_5:  'Alt+5', fav_6:  'Alt+6',
  fav_7:  'Alt+7', fav_8:  'Alt+8', fav_9:  'Alt+9',
  fav_10: 'Alt+0',
  ...(posSettings.value.shortcuts || {}),
}))

// Hover tooltip text for an action button: "Name · Shortcut" (or just name).
function actionTip(action) {
  const name = t(`pos.actions.${action}`)
  const key  = shortcuts.value[action]   // customer/note have none → name only
  return key ? `${name} · ${key}` : name
}

function buildKeyStr(e) {
  let k = ''
  if (e.ctrlKey && e.key !== 'Control')   k += 'Ctrl+'
  if (e.shiftKey && e.key !== 'Shift')    k += 'Shift+'
  if (e.altKey && e.key !== 'Alt')        k += 'Alt+'

  // For Alt combos use e.code so Mac dead-keys don't mangle the letter (Alt+R → ® on Mac)
  let rawKey
  if (e.altKey && e.code) {
    if (e.code.startsWith('Key'))        rawKey = e.code.slice(3)   // KeyR → R
    else if (e.code.startsWith('Digit')) rawKey = e.code.slice(5)   // Digit1 → 1
    else rawKey = e.key.length === 1 ? e.key.toUpperCase() : e.key
  } else {
    rawKey = e.key.length === 1 ? e.key.toUpperCase() : e.key
  }
  k += rawKey
  return k
}

function onGlobalKey(e) {
  const tag = document.activeElement?.tagName
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA'

  const k = buildKeyStr(e)

  // F1 always focuses search (and drops out of calculator mode)
  if (k === 'F1' || k === (shortcuts.value.focus_search || 'F1')) {
    e.preventDefault(); numpadRef.value?.exitCalc(); searchInputEl.value?.focus(); return
  }

  // Calculator mode: number/operator keys drive the calc, not the search bar
  if (numpadCalc.value) {
    const ek = e.key
    const isCalc = (ek >= '0' && ek <= '9') || ek === '.' || '+-*/'.includes(ek)
      || ek === 'Enter' || ek === '=' || ek === 'Backspace' || ek === 'Escape'
    if (isCalc) { e.preventDefault(); numpadRef.value?.feedKey(ek); return }
  }

  // Function-key shortcuts work even while the search input is focused
  const isFKey = /^F\d+$/.test(k)
  if (inInput && !isFKey) return

  if (k === 'F7')                                  { e.preventDefault(); showServiceModal.value = true; return }
  if (k === (shortcuts.value.pay || 'F9'))         { e.preventDefault(); openPayment(); return }
  if (k === (shortcuts.value.discount || 'F8'))    { e.preventDefault(); openInvoiceDiscount(); return }
  if (k === (shortcuts.value.hold || 'F4'))        { e.preventDefault(); holdOrResume(); return }
  if (k === (shortcuts.value.reprint || 'F2'))     { e.preventDefault(); reprint(); return }
  if (k === (shortcuts.value.remove_last || 'F10')){ e.preventDefault(); removeLast(); return }
  if (shortcuts.value.undo && k === shortcuts.value.undo) { e.preventDefault(); cart.undo(); schedulePatch(); return }
  if (shortcuts.value.redo && k === shortcuts.value.redo) { e.preventDefault(); cart.redo(); schedulePatch(); return }
  if (shortcuts.value.returns && k === shortcuts.value.returns) { e.preventDefault(); router.push('/finance/returns'); return }

  // Favorites 1–10
  for (let i = 0; i < 10; i++) {
    const favKey = `fav_${i + 1}`
    if (shortcuts.value[favKey] && k === shortcuts.value[favKey]) {
      const fav = pos.favorites[i]
      if (fav) { e.preventDefault(); addToCartFromFav(fav) }
      return
    }
  }

  if (inInput) return  // only function keys past here; block non-F-key actions when in input

  // Arrow keys navigate the cart
  if (k === 'ArrowDown') { e.preventDefault(); selectedRow.value = Math.min(selectedRow.value + 1, cart.items.length - 1); return }
  if (k === 'ArrowUp')   { e.preventDefault(); selectedRow.value = Math.max(selectedRow.value - 1, 0); return }
  if ((k === 'Delete' || k === 'Backspace') && selectedRow.value >= 0 && cart.items[selectedRow.value]) {
    e.preventDefault()
    removeItem(cart.items[selectedRow.value].key)
    return
  }

  // Any printable key → focus search (barcode scanner compatible)
  if (k.length === 1) { searchInputEl.value?.focus() }
}

// ── Beep ──────────────────────────────────────────────────────
function playBeep() {
  if (posSettings.value.ux?.scan_beep === false) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 1200
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(); osc.stop(ctx.currentTime + 0.12)
  } catch { /* audio blocked */ }
}

// ── Format helper ─────────────────────────────────────────────
function fmtNum(n) {
  return parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
// Weight qty: up to 3 decimals (gram precision), trailing zeros trimmed (0.250 → 0.25).
function fmtQty(n) {
  return (parseFloat(n) || 0).toFixed(3).replace(/\.?0+$/, '') || '0'
}
</script>

<style scoped>
.pos-view {
  height: 100%;
  background: var(--bg-app); outline: none; position: relative; overflow: hidden;
}

/* ── Unit picker overlay ─────────────────────────────────────── */
.pos-unit-overlay {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
}
.pos-unit-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px; width: 320px; max-width: 90vw;
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}
.pos-unit-head { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.pos-unit-sub  { font-size: 12px; color: var(--text-secondary); margin: 2px 0 12px; }
.pos-unit-list { display: flex; flex-direction: column; gap: 8px; }
.pos-unit-btn {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--bg-app);
  cursor: pointer; transition: transform .08s ease, border-color .12s ease;
}
.pos-unit-btn:hover  { border-color: var(--accent); }
.pos-unit-btn:active { transform: scale(0.97); }
.pos-unit-btn--current { border-color: var(--accent); background: var(--accent-soft); }
.pub-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.pub-meta { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.pos-unit-cancel {
  width: 100%; margin-top: 12px; padding: 9px; border-radius: 9px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text-secondary); font-weight: 600; cursor: pointer;
}

/* ── Weight entry modal ── */
.pos-weight-card { width: 320px; max-width: 92vw; }
.pos-weight-display {
  display: flex; align-items: center; gap: 8px; margin-top: 12px;
  border: 1px solid var(--border); border-radius: 10px; padding: 4px 14px;
  background: var(--surface, transparent);
}
.pos-weight-input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 30px; font-weight: 800; color: var(--text); text-align: right; width: 100%;
}
.pos-weight-unit { font-size: 16px; font-weight: 700; color: var(--text-muted); }
.pos-weight-total { margin-top: 8px; text-align: right; font-size: 15px; font-weight: 700; color: var(--accent); }
.pos-weight-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
.pos-weight-key {
  padding: 14px 0; border-radius: 10px; border: 1px solid var(--border);
  background: var(--surface, transparent); color: var(--text);
  font-size: 18px; font-weight: 700; cursor: pointer; transition: transform .08s, background .12s;
}
.pos-weight-key:hover { background: var(--accent-soft); border-color: var(--accent); }
.pos-weight-key:active { transform: scale(0.9); }
.pos-weight-key--c { color: var(--danger, #dc2626); }
.pos-weight-ok { background: var(--accent); color: #fff; border-color: var(--accent); }
.pcr-weight-val {
  padding: 4px 10px; border-radius: 7px; border: 1px solid var(--accent);
  background: var(--accent-soft); color: var(--accent);
  font-size: 13px; font-weight: 800; cursor: pointer; white-space: nowrap;
}
.pcr-weight-val:active { transform: scale(0.92); }

/* Compact wrapper: render at 1/0.78 size then scale down to 0.78 → ~22% smaller
   while still filling the viewport. transform-origin keeps it pinned top-left. */
.pos-scale {
  display: flex; flex-direction: column;
  width: calc(100% / 0.78); height: calc(100% / 0.78);
  transform: scale(0.78); transform-origin: top left;
}

/* ── Top bar ──────────────────────────────────────────────── */
.pos-topbar {
  display: flex; align-items: center; gap: 14px;
  padding: 0 14px; background: var(--bg-card);
  border-bottom: 1px solid var(--border); height: 54px; flex-shrink: 0;
}
.pos-topbar-left { display: flex; align-items: center; gap: 10px; white-space: nowrap; flex-shrink: 0; }
.pos-back-btn {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  border: 1px solid var(--border); background: var(--bg-app); color: var(--text-muted);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background 120ms, color 120ms, transform 100ms;
}
.pos-back-btn:hover  { background: var(--border); color: var(--text-primary); }
.pos-back-btn:active { transform: scale(0.9); }
.pos-brand { font-size: 15px; font-weight: 900; color: var(--accent); letter-spacing: 0.1em; }
.pos-divider { color: var(--border); font-size: 20px; }
.pos-store  { font-size: 13px; font-weight: 700; color: var(--text-secondary); }

.pos-search-wrap {
  flex: 1; position: relative;
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-app); border: 1.5px solid var(--border);
  border-radius: 12px; padding: 0 14px; height: 38px;
  transition: border-color 150ms;
}
.pos-search-wrap:focus-within { border-color: var(--accent); }
.pos-search-icon { color: var(--text-muted); flex-shrink: 0; }
.pos-search {
  flex: 1; border: none; background: none; outline: none;
  font-size: 13.5px; color: var(--text-primary);
}
.pos-search::placeholder { color: var(--text-muted); }
.pos-search-kbd {
  font-size: 11px; background: var(--border); color: var(--text-muted);
  border-radius: 6px; padding: 2px 7px; font-family: inherit; flex-shrink: 0;
}
.pos-search-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 300;
  background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 14px;
  overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.14); max-height: 320px; overflow-y: auto;
}
.pos-search-item {
  display: flex; align-items: center; gap: 12px; padding: 11px 16px;
  cursor: pointer; transition: background 100ms; border-bottom: 1px solid var(--border);
}
.pos-search-item:last-child { border-bottom: none; }
.pos-search-item:hover, .pos-search-item.highlighted { background: var(--accent-soft); }
.psi-name  { flex: 1; font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.psi-sku   { font-size: 11px; font-family: monospace; color: var(--text-muted); }
.psi-price { font-size: 14px; font-weight: 800; color: var(--accent); white-space: nowrap; }

.pos-topbar-right { display: flex; align-items: center; gap: 10px; white-space: nowrap; flex-shrink: 0; }
.pos-operator    { font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.pos-branch-chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 8px; background: var(--accent-soft); color: var(--accent); }
.pos-clock       { font-size: 13px; font-variant-numeric: tabular-nums; color: var(--text-muted); }

/* ── Body — three floating rounded cards with an inset gap ── */
.pos-body { flex: 1; display: flex; gap: 10px; padding: 10px; overflow: hidden; align-items: stretch; }

/* ── Left panel ───────────────────────────────────────────── */
.pos-left {
  width: 220px; min-width: 220px;
  display: flex; flex-direction: column; overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 16px;
  box-shadow: var(--shadow-card);
}
.pos-panel-section { padding: 12px 10px; display: flex; flex-direction: column; gap: 8px; }
.pos-panel-section--fav { border-top: 1px solid var(--border); flex: 1; }
.pos-panel-title { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); padding: 0 4px; }
.pos-quick-grid { display: flex; flex-direction: column; gap: 4px; }
.pos-quick-btn {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-card); cursor: pointer; text-align: left;
  box-shadow: var(--shadow-card);
  transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out),
              box-shadow 120ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.pos-quick-btn:hover { background: var(--accent-soft); border-color: var(--accent); }
.pos-quick-btn:active { transform: scale(0.97); box-shadow: none; transition-duration: var(--press-down); }
.pos-quick-btn--fav { background: rgba(247,143,30,0.06); border-color: rgba(247,143,30,0.3); }
.pqb-name  { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
.pqb-price { font-size: 11.5px; font-weight: 800; color: var(--accent); flex-shrink: 0; }
.pos-panel-empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 14px 0; }

/* ── Center ───────────────────────────────────────────────── */
.pos-center {
  flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.pos-invoice-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 0 14px; background: var(--bg-card);
  border-bottom: 1px solid var(--border); height: 46px; flex-shrink: 0;
  border-radius: 16px 16px 0 0;
}
.pib-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pib-num    { font-size: 11px; font-family: monospace; color: var(--text-muted); }
.pib-branch { font-size: 12px; font-weight: 700; color: var(--text-secondary); }

.pos-customer-area {
  flex: 1; position: relative;
  display: flex; align-items: center; gap: 8px; min-width: 0;
}
.pos-customer-icon { color: var(--text-muted); flex-shrink: 0; }
.pos-customer-name {
  font-size: 13px; font-weight: 700; color: var(--accent); cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pos-customer-name:hover { text-decoration: underline; }
.pos-customer-input {
  flex: 1; border: none; background: none; outline: none;
  font-size: 13px; color: var(--text-primary); font-weight: 600; min-width: 0;
}
.pos-customer-input::placeholder { color: var(--text-muted); font-weight: 400; }
.pos-customer-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; min-width: 280px; z-index: 300;
  background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 12px;
  overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.12); max-height: 240px; overflow-y: auto;
}
.pos-customer-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; cursor: pointer; transition: background 100ms;
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}
.pos-customer-item:last-child { border-bottom: none; }
.pos-customer-item:hover, .pos-customer-item.highlighted { background: var(--accent-soft); color: var(--accent); }
.pos-customer-item.highlighted .pci-phone { color: var(--accent); }
.pci-phone { font-size: 12px; color: var(--text-muted); font-weight: 400; }
.pci-add   { font-size: 12px; color: var(--text-muted); font-style: italic; justify-content: center; }

.pib-discount-chip {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  font-size: 12px; font-weight: 700; color: var(--danger);
  padding: 4px 10px; border-radius: 8px; background: var(--danger-soft); border: 1px solid #fecaca;
}
.pib-discount-chip button { background: none; border: none; cursor: pointer; color: var(--danger); display: flex; align-items: center; padding: 0; }

.pos-cart-header {
  display: grid; grid-template-columns: 1fr 96px 64px 90px 36px;
  padding: 7px 14px; background: var(--bg-app);
  font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--text-muted); flex-shrink: 0;
}
.pch-qty, .pch-disc, .pch-price { text-align: center; }

.pos-cart-body { flex: 1; overflow-y: auto; background: var(--bg-app); padding: 5px 0; }
.pcr-list { position: relative; }
.pos-cart-row {
  display: grid; grid-template-columns: 1fr 96px 64px 90px 36px;
  align-items: center; padding: 9px 12px; cursor: pointer;
  margin: 5px 8px; border-radius: 12px;
  background: var(--bg-card); border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out),
              box-shadow 120ms var(--ease-out);
}
.pos-cart-row:hover    { border-color: var(--accent); }
.pos-cart-row.pcr-selected { background: var(--accent-soft); border-color: var(--accent); }
.pos-cart-row.pcr-flash { animation: pos-flash 0.5s var(--ease-out); }
@keyframes pos-flash {
  0%   { background: var(--accent-soft); }
  100% { background: var(--bg-card); }
}
.pcr-main { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pcr-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pcr-name-btn { display: inline-flex; align-items: center; gap: 3px; min-width: 0; max-width: 100%; background: none; border: none; padding: 0; margin: 0; font: inherit; text-align: left; cursor: pointer; }
.pcr-name-btn .pcr-name-txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pcr-name-caret { flex-shrink: 0; color: var(--accent); opacity: 0.5; transition: opacity 0.12s ease; }
.pcr-name-btn:hover { color: var(--accent); }
.pcr-name-btn:hover .pcr-name-caret { opacity: 1; }
.pcr-name-btn:active { transform: scale(0.97); transition-duration: var(--press-down); }
.pcr-unit { font-size: 11px; font-weight: 700; color: var(--accent); }
.pcr-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.pcr-tag {
  font-size: 10px; font-weight: 700; color: var(--text-secondary);
  background: var(--bg-app); border: 1px solid var(--border);
  padding: 0 6px; border-radius: 5px; line-height: 16px; white-space: nowrap;
}
.pcr-qty-ctrl { display: flex; align-items: center; justify-content: center; gap: 5px; }
.pcr-qty-btn {
  width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--bg-card); cursor: pointer; font-size: 14px; font-weight: 700;
  color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
  transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out),
              color 120ms var(--ease-out), transform var(--press-back) var(--ease-spring);
  line-height: 1;
}
.pcr-qty-btn:hover { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
.pcr-qty-btn:active { transform: scale(0.88); transition-duration: var(--press-down); }
.pcr-qty-val { font-size: 13px; font-weight: 800; min-width: 20px; text-align: center; }
.pcr-disc {
  justify-self: center; min-width: 44px; padding: 2px 6px; border-radius: 7px;
  border: 1px dashed var(--border); background: var(--bg-app); cursor: pointer;
  font-size: 11px; font-weight: 800; color: var(--text-muted); line-height: 18px;
  transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out),
              color 120ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.pcr-disc:hover { border-color: var(--accent); color: var(--accent); }
.pcr-disc:active { transform: scale(0.9); transition-duration: var(--press-down); }
.pcr-disc.pcr-disc--set {
  border-style: solid; border-color: var(--danger); color: var(--danger);
  background: var(--danger-soft);
}
.pcr-price { font-size: 13.5px; font-weight: 800; color: var(--text-primary); text-align: center; }
.pcr-price--cut { display: flex; flex-direction: column; align-items: center; line-height: 1.2; }
.pcr-price--cut s { font-size: 11px; font-weight: 600; color: var(--text-muted); }
.pcr-del {
  width: 28px; height: 28px; border-radius: 7px; border: none; background: none;
  cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;
  transition: background 120ms var(--ease-out), color 120ms var(--ease-out),
              transform var(--press-back) var(--ease-spring);
  justify-self: center;
}
.pcr-del:hover { background: var(--danger-soft); color: var(--danger); }
.pcr-del:active { transform: scale(0.88); transition-duration: var(--press-down); }
.pos-cart-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 48px 24px; color: var(--text-muted); font-size: 13.5px;
}
.pce-icon { opacity: 0.3; }

/* Add → drops down from under the search bar; Delete → drops down and fades.
   Ease-in-out throughout. Leaving rows go absolute so siblings glide up. */
.cart-row-enter-active { transition: transform 260ms var(--ease-in-out), opacity 260ms var(--ease-in-out); }
.cart-row-leave-active { transition: transform 240ms var(--ease-in-out), opacity 240ms var(--ease-in-out); position: absolute; left: 0; right: 0; }
.cart-row-enter-from { opacity: 0; transform: translateY(-18px); }
.cart-row-leave-to   { opacity: 0; transform: translateY(18px); }
.cart-row-move       { transition: transform 260ms var(--ease-in-out); }

/* ── Right panel ──────────────────────────────────────────── */
.pos-right {
  width: 268px; min-width: 268px; height: 100%;
  display: flex; flex-direction: column;
  padding: 10px; background: var(--bg-card); overflow: hidden;
  border: 1px solid var(--border); border-radius: 16px;
  box-shadow: var(--shadow-card);
}
/* Everything above PAY scrolls if the viewport is short (e.g. browser zoom),
   so the PAY button stays pinned and visible at all zoom levels. */
.pos-right-scroll {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
}

.pos-actions-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
.pac {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 6px 3px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--bg-card);
  cursor: pointer; position: relative;
  font-size: 9.5px; font-weight: 700; color: var(--text-secondary);
  box-shadow: var(--shadow-card);
  transition: background 140ms var(--ease-out), border-color 140ms var(--ease-out),
              color 140ms var(--ease-out), box-shadow 140ms var(--ease-out),
              transform var(--press-back) var(--ease-spring);
}
.pac span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.pac:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.pac:active:not(:disabled) { transform: scale(var(--press-scale)); box-shadow: none; transition-duration: var(--press-down); }
.pac--held { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.pac--disabled { opacity: 0.35; cursor: not-allowed; }
.pac-badge {
  position: absolute; top: 3px; right: 3px;
  background: var(--accent); color: #fff; font-size: 8px; font-weight: 800;
  border-radius: 5px; padding: 0 4px; min-width: 12px; text-align: center;
}
/* Hover annotation: "Name · Shortcut" — drops below the button so the top
   row isn't clipped by the scroll container. */
.pac[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute; top: calc(100% + 5px); left: 50%; transform: translateX(-50%);
  background: var(--text-primary); color: var(--bg-card);
  font-size: 11px; font-weight: 700; white-space: nowrap;
  padding: 4px 9px; border-radius: 7px; z-index: 60;
  pointer-events: none; box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}

.pos-summary {
  background: var(--bg-app); border-radius: 14px; padding: 14px;
  display: flex; flex-direction: column; gap: 7px;
}
.psum-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-secondary); }
.psum-discount { color: var(--danger); font-size: 12px; }
.psum-divider  { height: 1px; background: var(--border); margin: 2px 0; }
.psum-total    { font-size: 17px; font-weight: 900; color: var(--text-primary); }
.psum-items    { font-size: 11px; color: var(--text-muted); text-align: right; }

/* Total box + PAY are pinned at the bottom (always visible); buttons + keypad
   scroll above them when the viewport is short. */
.pos-right-foot { flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
.pos-additive {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  font-size: 12px; font-weight: 700; color: var(--text-secondary);
  padding: 2px 2px; user-select: none;
}
.pos-additive input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }

.pos-pay-btn {
  width: 100%; padding: 16px 12px; border-radius: 14px; border: none;
  background: var(--success); color: #fff; cursor: pointer;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 18px; font-weight: 900; letter-spacing: 0.08em;
  box-shadow: 0 4px 14px rgba(34,197,94,0.28);
  transition: opacity 150ms var(--ease-out), box-shadow 150ms var(--ease-out),
              transform var(--press-back) var(--ease-spring);
}
.pos-pay-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pos-pay-btn:not(:disabled):hover { opacity: 0.9; }
.pos-pay-btn:not(:disabled):active { transform: scale(0.97); transition-duration: var(--press-down); }
.pos-pay-amount { font-size: 14px; font-weight: 700; opacity: 0.9; }

/* ── Scan beam — a thin bright line that races from top to bottom,
   like a barcode scanner's light. One-shot, very fast. ──────── */
.pos-scan-beam {
  position: absolute; left: 0; right: 0; top: -480px; height: 480px;
  background: linear-gradient(to bottom,
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.5) 50%,
    rgba(255,255,255,0) 100%);
  pointer-events: none; z-index: 500; will-change: transform;
  animation: pos-scan-sweep 320ms var(--ease-in-out) forwards;
}
@keyframes pos-scan-sweep {
  0%   { transform: translateY(0);                 opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(calc(100vh + 480px)); opacity: 0.9; }
}

/* ── Success overlay ──────────────────────────────────────── */
.pos-success-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 9000;
}
.pos-success-card {
  background: var(--bg-card); border-radius: 24px; padding: 40px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  min-width: 340px; box-shadow: 0 24px 80px rgba(0,0,0,0.3);
}
.psc-icon   { color: var(--success); }
.psc-label  { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; }
.psc-num    { font-size: 22px; font-weight: 900; color: var(--text-primary); }
.psc-amount { font-size: 34px; font-weight: 900; color: var(--text-primary); }
.psc-actions { display: flex; gap: 12px; margin-top: 10px; }
.psc-print {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 20px; border-radius: 12px; border: 2px solid var(--border);
  background: none; cursor: pointer; font-size: 14px; font-weight: 700; color: var(--text-secondary);
  transition: background 140ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.psc-print:hover { background: var(--bg-app); }
.psc-print:active { transform: scale(var(--press-scale)); transition-duration: var(--press-down); }
.psc-new {
  padding: 12px 28px; border-radius: 12px; border: none;
  background: var(--accent); color: #fff; cursor: pointer;
  font-size: 14px; font-weight: 800;
  transition: opacity 150ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.psc-new:hover { opacity: 0.9; }
.psc-new:active { transform: scale(var(--press-scale)); transition-duration: var(--press-down); }
.success-pop-enter-active { transition: all 280ms cubic-bezier(0.34,1.56,0.64,1); }
.success-pop-leave-active { transition: all 200ms ease; }
.success-pop-enter-from, .success-pop-leave-to { opacity: 0; transform: scale(0.85); }

/* ── Held panel ───────────────────────────────────────────── */
.pos-held-panel {
  position: fixed; right: 280px; top: 100px; z-index: 600;
  background: var(--bg-card); border: 1.5px solid var(--border);
  border-radius: 16px; min-width: 260px; overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.php-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  font-size: 13px; font-weight: 800; color: var(--text-primary);
}
.php-header button { background: none; border: none; cursor: pointer; color: var(--text-muted); border-radius: 6px; padding: 2px; }
.php-header button:hover { background: var(--border); }
.php-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; cursor: pointer; transition: background 120ms;
  border-bottom: 1px solid var(--border);
}
.php-item:last-child { border-bottom: none; }
.php-item:hover { background: var(--bg-app); }
.php-items-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.php-total  { font-size: 13px; font-weight: 800; color: var(--accent); }
.php-empty  { padding: 16px; text-align: center; font-size: 13px; color: var(--text-muted); }
.held-slide-enter-active, .held-slide-leave-active { transition: all 200ms ease; }
.held-slide-enter-from, .held-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
