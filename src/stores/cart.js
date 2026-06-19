import { defineStore } from 'pinia'

// Flat discount amount for a single cart line, derived from its type + value.
// free → whole line; percent → % of line; fixed → capped at the line total.
function lineDiscountAmount(item) {
  const lineTotal = (item.price || 0) * (item.qty || 0)
  if (!item.discType) return 0
  if (item.discType === 'free') return lineTotal
  const v = parseFloat(item.discValue) || 0
  if (v <= 0) return 0
  if (item.discType === 'percent') return Math.min(lineTotal, (lineTotal * v) / 100)
  return Math.min(lineTotal, v) // fixed
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    customerId: null,
    customerObj: null,
    // Whole-invoice discount, stored as type + value so it stays reactive to cart changes.
    invDiscType: null,   // null | 'percent' | 'fixed'
    invDiscValue: 0,
    additive: false,     // false = shield discounted lines from the invoice discount
    heldCarts: [],
    activeShift: null,
    _history: [],  // undo stack (max 50 snapshots)
    _future: [],   // redo stack
  }),
  getters: {
    // gross subtotal, before any discount
    itemsSubtotal: s => s.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    // flat per-line discount lookup
    lineDiscount: () => item => lineDiscountAmount(item),
    // subtotal after per-line discounts
    discountedSubtotal: s => s.items.reduce((sum, i) => sum + (i.price * i.qty - lineDiscountAmount(i)), 0),
    // sum of all per-line discounts (for display)
    lineDiscountTotal: s => s.items.reduce((sum, i) => sum + lineDiscountAmount(i), 0),
    // base the invoice discount is calculated on:
    //  additive  → the full discounted subtotal (stacks on already-discounted lines)
    //  shield    → only lines that carry no per-line discount of their own
    invoiceDiscountBase(s) {
      if (s.additive) return this.discountedSubtotal
      return s.items.reduce((sum, i) => sum + (i.discType ? 0 : i.price * i.qty), 0)
    },
    invoiceDiscountAmount(s) {
      if (!s.invDiscType) return 0
      const v = parseFloat(s.invDiscValue) || 0
      if (v <= 0) return 0
      if (s.invDiscType === 'percent') return Math.min(this.invoiceDiscountBase, (this.invoiceDiscountBase * v) / 100)
      return Math.min(this.discountedSubtotal, v) // fixed: flat off the discounted subtotal
    },
    // back-compat alias: existing templates read `cart.discount`
    discount() { return this.invoiceDiscountAmount },
    // display subtotal kept as the gross subtotal (line discounts shown separately)
    subtotal: s => s.itemsSubtotal,
    grandTotal() { return Math.max(0, this.discountedSubtotal - this.invoiceDiscountAmount) },
    itemCount:  s => s.items.reduce((sum, i) => sum + i.qty, 0),
    hasShift:   s => !!s.activeShift,
    isEmpty:    s => s.items.length === 0,
    canUndo:    s => s._history.length > 0,
    canRedo:    s => s._future.length > 0,
  },
  actions: {
    _state() {
      return {
        items:        this.items.map(i => ({ ...i })),
        customerId:   this.customerId,
        customerObj:  this.customerObj ? { ...this.customerObj } : null,
        invDiscType:  this.invDiscType,
        invDiscValue: this.invDiscValue,
        additive:     this.additive,
      }
    },
    _restore(snap) {
      this.items        = snap.items
      this.customerId   = snap.customerId
      this.customerObj  = snap.customerObj
      this.invDiscType  = snap.invDiscType ?? null
      this.invDiscValue = snap.invDiscValue ?? 0
      this.additive     = snap.additive ?? false
    },
    _snapshot() {
      this._history.push(this._state())
      this._future = []
      if (this._history.length > 50) this._history.shift()
    },
    addItem(variant) {
      this._snapshot()
      // A line is identified by variant + chosen unit, so the same product sold
      // as a Pack and as a single Tablet sit on separate lines. unit_id null =
      // the base unit (factor 1) — i.e. exactly how every product behaved before.
      const unitId = variant.unit_id || null
      const key = `${variant.id}|${unitId || 'base'}`
      const existing = this.items.find(i => i.key === key)
      if (existing) {
        existing.qty++
      } else {
        this.items.push({
          key,
          variant_id: variant.id,
          unit_id: unitId,
          unit_factor: parseFloat(variant.unit_factor) || 1,
          unit_name: variant.unit_name || '',
          name: variant.name,
          price: parseFloat(variant.price) || 0,
          qty: 1,
          stock: variant.stock,
          attributes: variant.attributes || null,  // { key: [values] } from attributes_summary
          category: variant.category || '',
          discType: null,   // null | 'percent' | 'fixed' | 'free'
          discValue: 0,
          _flash: true,
        })
        const item = this.items[this.items.length - 1]
        setTimeout(() => { item._flash = false }, 600)
      }
    },
    removeItem(key) {
      this._snapshot()
      this.items = this.items.filter(i => i.key !== key)
    },
    updateQty(key, qty) {
      this._snapshot()
      const item = this.items.find(i => i.key === key)
      if (item) {
        if (qty <= 0) this.items = this.items.filter(i => i.key !== key)
        else item.qty = qty
      }
    },
    setLineDiscount(key, type, value) {
      this._snapshot()
      const item = this.items.find(i => i.key === key)
      if (!item) return
      if (!type) { item.discType = null; item.discValue = 0; return }
      item.discType = type
      item.discValue = type === 'free' ? 0 : (parseFloat(value) || 0)
    },
    setCustomer(customer) {
      this._snapshot()
      this.customerId = customer?.id || null
      this.customerObj = customer || null
    },
    setInvoiceDiscount(type, value) {
      this._snapshot()
      if (!type) { this.invDiscType = null; this.invDiscValue = 0; return }
      this.invDiscType = type
      this.invDiscValue = parseFloat(value) || 0
    },
    setAdditive(on) { this.additive = !!on },
    // back-compat: the discount chip's clear button calls setDiscount(0)
    setDiscount(amount) {
      if (!amount) { this.setInvoiceDiscount(null); return }
      this.setInvoiceDiscount('fixed', amount)
    },
    undo() {
      if (!this._history.length) return
      this._future.push(this._state())
      this._restore(this._history.pop())
    },
    redo() {
      if (!this._future.length) return
      this._history.push(this._state())
      this._restore(this._future.pop())
    },
    holdCart() {
      if (!this.isEmpty) {
        this.heldCarts.push(this._state())
        this.clearCart()
      }
    },
    resumeHeld(index) {
      const held = this.heldCarts[index]
      if (held) {
        this._restore({ ...held, items: held.items.map(i => ({ ...i })) })
        this.heldCarts.splice(index, 1)
      }
    },
    clearCart() {
      this.items = []
      this.customerId = null
      this.customerObj = null
      this.invDiscType = null
      this.invDiscValue = 0
      // `additive` is a cashier preference — keep it across sales
      this._history = []  // fresh start after payment
      this._future = []
    },
    setShift(shift) { this.activeShift = shift },
    clearShift() { this.activeShift = null },
  },
})
