import { defineStore } from 'pinia';

interface ToastState {
  messages: ToastMessage[]
}

interface ToastMessage {
  id: string
  text: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  undoAction?: () => void
}

export const useToastStore = defineStore('toast', {
  state: (): ToastState => ({
    messages: []
  }),

  actions: {
    showToast(message: Omit<ToastMessage, 'id'>) {
      const id = crypto.randomUUID()
      const toast = { ...message, id }
      
      this.messages.push(toast)

      if (message.duration !== 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, message.duration || 5000)
      }

      return id
    },

    showUndoToast(text: string, undoAction: () => void) {
      return this.showToast({
        text,
        type: 'info',
        duration: 5000,
        undoAction
      })
    },

    removeToast(id: string) {
      const index = this.messages.findIndex(m => m.id === id)
      if (index !== -1) {
        this.messages.splice(index, 1)
      }
    },

    clearToasts() {
      this.messages = []
    }
  }
}) 