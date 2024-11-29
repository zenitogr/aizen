import { defineStore } from 'pinia'

interface AppState {
  isLoading: boolean
  currentView: string
  errors: string[]
  initialized: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    isLoading: false,
    currentView: 'welcome',
    errors: [],
    initialized: false
  }),
  
  getters: {
    hasErrors: (state) => state.errors.length > 0,
    isRecentlyDeletedView: (state) => state.currentView === 'recently-deleted'
  },
  
  actions: {
    setLoading(status: boolean) {
      this.isLoading = status
    },
    
    setCurrentView(view: string) {
      this.currentView = view
    },
    
    addError(error: string) {
      this.errors.push(error)
    },
    
    clearErrors() {
      this.errors = []
    },

    initialize() {
      this.initialized = true
    },

    async resetStore(): Promise<boolean> {
      // @ts-ignore - resetStorage is added by plugin
      const success = await this.resetStorage()
      if (!success) {
        this.addError('Failed to reset store')
      }
      return success
    },

    async reloadStore(): Promise<boolean> {
      // @ts-ignore - reloadFromStorage is added by plugin
      const success = await this.reloadFromStorage()
      if (!success) {
        this.addError('Failed to reload store')
      }
      return success
    }
  }
}) 