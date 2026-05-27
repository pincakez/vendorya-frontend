import { defineStore } from 'pinia'

export const useQABStore = defineStore('qab', {
  state: () => ({
    isOpen: false,
    positionY: 50,
    actions: [],
  }),
  getters: {
    hasActions: s => s.actions.length > 0,
  },
  actions: {
    toggle() { this.isOpen = !this.isOpen },
    open() { this.isOpen = true },
    close() { this.isOpen = false },
    setActions(actions) { this.actions = actions; this.isOpen = false },
    clearActions() { this.actions = []; this.isOpen = false },
    setPosition(y) { this.positionY = Math.min(Math.max(y, 10), 90) }
  }
})
