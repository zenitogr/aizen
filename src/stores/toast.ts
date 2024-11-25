import { defineStore } from 'pinia';

export interface Toast {
  id: string
  message: string
  duration?: number
  showUndo?: boolean
  undoAction?: () => void
}

interface ToastState {
  toasts: Toast[]
}

export const useToastStore = defineStore('toast', {
  state: (): ToastState => ({
    toasts: []
  }),

  actions: {
    show(toast: Omit<Toast, 'id'>) {
      const id = crypto.randomUUID();
      this.toasts.push({ ...toast, id });

      if (toast.duration !== 0) {
        setTimeout(() => {
          this.remove(id);
        }, toast.duration || 5000);
      }

      return id;
    },

    remove(id: string) {
      const index = this.toasts.findIndex(t => t.id === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    },

    showUndoToast(message: string, undoAction: () => void) {
      return this.show({
        message,
        showUndo: true,
        undoAction,
        duration: 7000 // Give more time for undo
      });
    }
  }
}); 