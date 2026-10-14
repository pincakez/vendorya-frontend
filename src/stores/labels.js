import { defineStore } from 'pinia'

// The label print page shows (and prints) at most this many stickers at once; a bigger job is split
// into batches so 2,000+ barcodes never freeze the browser (s167, PROLINE-PARITY Upgrade 14).
export const LABEL_BATCH = 500
// The server takes at most this many products per label request (ProductViewSet.LABEL_MAX_PRODUCTS).
export const LABEL_MAX_PRODUCTS = 2000

export const useLabelsStore = defineStore('labels', {
  state: () => ({
    job: null,
    // job shape: { source: 'purchase' | 'products', preset: { width_mm, height_mm, show_* }, store_name,
    //              items: [{ product_name, sku, sku2, barcode, sell_price, quantity, specs }] }
    // `specs` (s168) = the category's spec values on one line; printed only when preset.show_specs.
    // Filled by Purchases.vue (a received purchase) and ProductLabelsModal.vue (product list / product page).
  }),
  actions: {
    setJob(job) { this.job = job },
    clear()     { this.job = null },
  },
})
