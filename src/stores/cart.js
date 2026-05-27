import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    customerId: null,
    heldCarts: [],
    activeShift: null,
  }),
  getters: {
    grandTotal: s => s.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    itemCount: s => s.items.reduce((sum, i) => sum + i.qty, 0),
    hasShift: s => !!s.activeShift,
    isEmpty: s => s.items.length === 0,
  },
  actions: {
    addItem(variant) {
      const existing = this.items.find(i => i.variant_id === variant.id)
      if (existing) {
        existing.qty++
      } else {
        this.items.push({ variant_id: variant.id, name: variant.name, price: variant.price, qty: 1, stock: variant.stock })
      }
    },
    removeItem(variantId) { this.items = this.items.filter(i => i.variant_id !== variantId) },
    updateQty(variantId, qty) {
      const item = this.items.find(i => i.variant_id === variantId)
      if (item) item.qty = qty
    },
    holdCart() {
      if (!this.isEmpty) {
        this.heldCarts.push({ items: [...this.items], customerId: this.customerId })
        this.clearCart()
      }
    },
    resumeHeld(index) {
      const held = this.heldCarts[index]
      if (held) { this.items = held.items; this.customerId = held.customerId; this.heldCarts.splice(index, 1) }
    },
    clearCart() { this.items = []; this.customerId = null },
    setShift(shift) { this.activeShift = shift },
    clearShift() { this.activeShift = null }
  }
})
