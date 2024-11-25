import { defineStore } from 'pinia'

interface AppState {
  isLoading: boolean
  currentView: string
  errors: string[]
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    isLoading: false,
    currentView: 'welcome',
    errors: []
  }),
  
  getters: {
    hasErrors: (state) => state.errors.length > 0
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
    }
  }
}) 