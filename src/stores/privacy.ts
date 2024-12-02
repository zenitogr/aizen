import { defineStore } from 'pinia'

export interface PrivacyFeature {
  enabled: boolean
  lastUsed: string | null
  description: string
}

interface PrivacyState {
  isFullyOffline: boolean
  onlineFeatures: {
    groqAI: PrivacyFeature
    cloudBackup: PrivacyFeature
  }
}

export const usePrivacyStore = defineStore('privacy', {
  state: (): PrivacyState => ({
    isFullyOffline: true,
    onlineFeatures: {
      groqAI: {
        enabled: false,
        lastUsed: null,
        description: 'AI analysis using GROQ API'
      },
      cloudBackup: {
        enabled: false,
        lastUsed: null,
        description: 'Encrypted cloud backup'
      }
    }
  }),

  getters: {
    privacyStatus(): string {
      return this.isFullyOffline ? 'Fully Offline' : 'Online Features Active'
    },
    
    activeOnlineFeatures(): string[] {
      return Object.entries(this.onlineFeatures)
        .filter(([_, feature]) => feature.enabled)
        .map(([name]) => name)
    }
  },

  actions: {
    toggleFeature(featureName: keyof PrivacyState['onlineFeatures']) {
      const feature = this.onlineFeatures[featureName]
      feature.enabled = !feature.enabled
      feature.lastUsed = feature.enabled ? new Date().toISOString() : null
      this.isFullyOffline = this.activeOnlineFeatures.length === 0
    }
  }
}) 