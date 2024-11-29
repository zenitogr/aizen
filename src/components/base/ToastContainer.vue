<script setup lang="ts">
import { useToastStore } from '../../stores/toast';
import BaseToast from './BaseToast.vue';

const toastStore = useToastStore();
</script>

<template>
  <div class="toast-container">
    <BaseToast
      v-for="message in toastStore.messages"
      :key="message.id"
      :text="message.text"
      :type="message.type"
      :show-undo="!!message.undoAction"
      @close="toastStore.removeToast(message.id)"
      @undo="message.undoAction?.(); toastStore.removeToast(message.id)"
    />
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

.toast-container :deep(.base-toast) {
  pointer-events: auto;
}

@media (max-width: 768px) {
  .toast-container {
    bottom: var(--spacing-md);
    right: var(--spacing-md);
    left: var(--spacing-md);
  }
}
</style> 