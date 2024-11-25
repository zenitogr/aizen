import { defineStore } from 'pinia'

interface UserState {
  name: string
  preferences: {
    theme: 'light' | 'dark'
    fontSize: 'small' | 'medium' | 'large'
  }
  lastActive: Date | null
  initialized: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    name: '',
    preferences: {
      theme: 'dark',
      fontSize: 'medium'
    },
    lastActive: null,
    initialized: false
  }),
  
  getters: {
    isSetup: (state) => !!state.name,
    currentTheme: (state) => state.preferences.theme
  },
  
  actions: {
    setName(name: string) {
      this.name = name
      this.updateLastActive()
    },
    
    updateLastActive() {
      this.lastActive = new Date()
    },
    
    toggleTheme() {
      this.preferences.theme = this.preferences.theme === 'dark' ? 'light' : 'dark'
    },
    
    setFontSize(size: 'small' | 'medium' | 'large') {
      this.preferences.fontSize = size
    },

    initialize() {
      this.initialized = true
      this.updateLastActive()
    }
  }
}) 