<script setup lang="ts">
import { useToastStore } from '../../stores/toast';
import BaseToast from './BaseToast.vue';

const toastStore = useToastStore();
</script>

<template>
  <div class="toast-container">
    <BaseToast
      v-for="toast in toastStore.toasts"
      :key="toast.id"
      :message="toast.message"
      :duration="toast.duration"
      :show-undo="toast.showUndo"
      @close="toastStore.remove(toast.id)"
      @undo="toast.undoAction?.(); toastStore.remove(toast.id)"
    />
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column-reverse;
  gap: var(--spacing-sm);
  pointer-events: none;
}

.toast-container :deep(.toast) {
  pointer-events: auto;
}
</style> 