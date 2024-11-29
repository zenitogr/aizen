import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'log';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  timestamp: number;
  undoAction?: () => void;
  deletedAt?: Date;
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
    hiddenToasts: [] as Toast[],
  }),

  actions: {
    showToast(message: Omit<Toast, 'id'>) {
      const id = crypto.randomUUID()
      const toast = { ...message, id }
      
      this.toasts.push(toast)

      if (message.duration !== 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, message.duration || 5000)
      }

      return id
    },

    showUndoToast(text: string, undoAction: () => void) {
      return this.showToast({
        message: text,
        type: 'info',
        duration: 5000,
        undoAction,
        timestamp: Date.now(),
      })
    },

    removeToast(id: string) {
      const index = this.toasts.findIndex(m => m.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    },

    clearToasts() {
      this.toasts = []
    },

    logEntryCreated(entryId: string, title: string) {
      this.addToast({
        type: 'log',
        message: `Entry created: "${title}" (ID: ${entryId})`,
        duration: 0,
        timestamp: Date.now(),
      });
    },

    logEntryDeleted(entryId: string, title: string, deletionDate: Date) {
      const formattedDate = deletionDate.toLocaleDateString();
      this.addToast({
        type: 'log',
        message: `Entry "${title}" marked for deletion (ID: ${entryId}). Will be removed on ${formattedDate}`,
        duration: 0,
        timestamp: Date.now(),
      });
      
      this.logEntryStateChange(entryId, title, 'active', 'hidden');
    },

    logEntryHidden(entryId: string, title: string, reason?: string) {
      this.addToast({
        type: 'log',
        message: `Entry "${title}" marked as hidden${reason ? ` - Reason: ${reason}` : ''} (ID: ${entryId})`,
        duration: 0,
        timestamp: Date.now(),
      });
    },

    logEntryRestored(entryId: string, title: string) {
      this.addToast({
        type: 'log',
        message: `Entry "${title}" restored (ID: ${entryId})`,
        duration: 0,
        timestamp: Date.now(),
      });
    },

    addToast({ type, message, duration = 3000 }: Partial<Toast> & { type: ToastType; message: string }) {
      const toast: Toast = {
        id: nanoid(),
        type,
        message,
        duration,
        timestamp: Date.now(),
      };
      this.toasts.push(toast);
    },

    logEntryStateChange(entryId: string, title: string, fromState: string, toState: string) {
      this.addToast({
        type: 'log',
        message: `Entry "${title}" (ID: ${entryId}) state changed: ${fromState} → ${toState}`,
        duration: 0,
        timestamp: Date.now(),
      });
    },

    softDeleteEntry(entryId: string) {
      const now = new Date()
      this.toasts = this.toasts.map(toast => {
        if (toast.id === entryId) {
          return {
            ...toast,
            deletedAt: now
          }
        }
        return toast
      })
    },

    hideDeletedToast(toastId: string) {
      const toast = this.toasts.find(t => t.id === toastId)
      if (toast) {
        this.hiddenToasts.push(toast)
        this.toasts = this.toasts.filter(t => t.id !== toastId)
      }
    },

    checkExpiredToasts() {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      this.toasts = this.toasts.filter(toast => {
        if (toast.deletedAt) {
          const shouldHide = new Date(toast.deletedAt) < oneMonthAgo
          if (shouldHide) {
            this.hiddenToasts.push(toast)
          }
          return !shouldHide
        }
        return true
      })
    }
  }
}) 