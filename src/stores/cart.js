import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    customerId: null,
    customerObj: null,
    discount: 0,
    heldCarts: [],
    activeShift: null,
  }),
  getters: {
    subtotal:   s => s.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    grandTotal: s => Math.max(0, s.items.reduce((sum, i) => sum + i.price * i.qty, 0) - s.discount),
    itemCount:  s => s.items.reduce((sum, i) => sum + i.qty, 0),
    hasShift:   s => !!s.activeShift,
    isEmpty:    s => s.items.length === 0,
  },
  actions: {
    addItem(variant) {
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
          _flash: true,
        })
        // Clear flash after animation
        const item = this.items[this.items.length - 1]
        setTimeout(() => { item._flash = false }, 600)
      }
    },
    removeItem(variantId) { this.items = this.items.filter(i => i.variant_id !== variantId) },
    updateQty(variantId, qty) {
      const item = this.items.find(i => i.variant_id === variantId)
      if (item) {
        if (qty <= 0) this.removeItem(variantId)
        else item.qty = qty
      }
    },
    setCustomer(customer) {
      this.customerId = customer?.id || null
      this.customerObj = customer || null
    },
    setDiscount(amount) {
      this.discount = Math.max(0, parseFloat(amount) || 0)
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
    },
    setShift(shift) { this.activeShift = shift },
    clearShift() { this.activeShift = null },
  },
})
