import { defineStore } from 'pinia'

export const useLabelsStore = defineStore('labels', {
  state: () => ({
    job: null,
    // job shape: { preset: { width_mm, height_mm, show_* }, store_name, items: [{ product_name, sku, barcode, sell_price, quantity }] }
  }),
  actions: {
    setJob(job) { this.job = job },
    clear()     { this.job = null },
  },
})
