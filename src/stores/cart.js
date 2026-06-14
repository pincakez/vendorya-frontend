import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    customerId: null,
    customerObj: null,
    discount: 0,
    heldCarts: [],
    activeShift: null,
    _history: [],  // undo stack (max 50 snapshots)
    _future: [],   // redo stack
  }),
  getters: {
    subtotal:   s => s.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    grandTotal: s => Math.max(0, s.items.reduce((sum, i) => sum + i.price * i.qty, 0) - s.discount),
    itemCount:  s => s.items.reduce((sum, i) => sum + i.qty, 0),
    hasShift:   s => !!s.activeShift,
    isEmpty:    s => s.items.length === 0,
    canUndo:    s => s._history.length > 0,
    canRedo:    s => s._future.length > 0,
  },
  actions: {
    _snapshot() {
      this._history.push({
        items:       this.items.map(i => ({ ...i })),
        customerId:  this.customerId,
        customerObj: this.customerObj ? { ...this.customerObj } : null,
        discount:    this.discount,
      })
      this._future = []
      if (this._history.length > 50) this._history.shift()
    },
    addItem(variant) {
      this._snapshot()
      const existing = this.items.find(i => i.variant_id === variant.id)
      if (existing) {
        existing.qty++
      } else {
        this.items.push({
          variant_id: variant.id,
          name: variant.name,
          price: parseFloat(variant.price) || 0,
          qty: 1,
          stock: variant.stock,
          attributes: variant.attributes || null,  // { key: [values] } from attributes_summary
          category: variant.category || '',
          _flash: true,
        })
        const item = this.items[this.items.length - 1]
        setTimeout(() => { item._flash = false }, 600)
      }
    },
    removeItem(variantId) {
      this._snapshot()
      this.items = this.items.filter(i => i.variant_id !== variantId)
    },
    updateQty(variantId, qty) {
      this._snapshot()
      const item = this.items.find(i => i.variant_id === variantId)
      if (item) {
        if (qty <= 0) this.items = this.items.filter(i => i.variant_id !== variantId)
        else item.qty = qty
      }
    },
    setCustomer(customer) {
      this._snapshot()
      this.customerId = customer?.id || null
      this.customerObj = customer || null
    },
    setDiscount(amount) {
      this._snapshot()
      this.discount = Math.max(0, parseFloat(amount) || 0)
    },
    undo() {
      if (!this._history.length) return
      this._future.push({
        items:       this.items.map(i => ({ ...i })),
        customerId:  this.customerId,
        customerObj: this.customerObj ? { ...this.customerObj } : null,
        discount:    this.discount,
      })
      const prev = this._history.pop()
      this.items       = prev.items
      this.customerId  = prev.customerId
      this.customerObj = prev.customerObj
      this.discount    = prev.discount
    },
    redo() {
      if (!this._future.length) return
      this._history.push({
        items:       this.items.map(i => ({ ...i })),
        customerId:  this.customerId,
        customerObj: this.customerObj ? { ...this.customerObj } : null,
        discount:    this.discount,
      })
      const next = this._future.pop()
      this.items       = next.items
      this.customerId  = next.customerId
      this.customerObj = next.customerObj
      this.discount    = next.discount
    },
    holdCart() {
      if (!this.isEmpty) {
        this.heldCarts.push({
          items: [...this.items],
          customerId: this.customerId,
          customerObj: this.customerObj,
          discount: this.discount,
        })
        this.clearCart()
      }
    },
    resumeHeld(index) {
      const held = this.heldCarts[index]
      if (held) {
        this.items = held.items
        this.customerId = held.customerId
        this.customerObj = held.customerObj
        this.discount = held.discount
        this.heldCarts.splice(index, 1)
      }
    },
    clearCart() {
      this.items = []
      this.customerId = null
      this.customerObj = null
      this.discount = 0
      this._history = []  // fresh start after payment
      this._future = []
    },
    setShift(shift) { this.activeShift = shift },
    clearShift() { this.activeShift = null },
  },
})
