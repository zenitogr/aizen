<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  text: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  showUndo?: boolean
}>()

const emit = defineEmits<{
  close: []
  undo: []
}>()

const toastClass = computed(() => ({
  'base-toast': true,
  [`toast-${props.type || 'info'}`]: true
}))
</script>

<template>
  <div :class="toastClass">
    <span class="toast-text">{{ text }}</span>
    <div class="toast-actions">
      <BaseButton 
        v-if="showUndo"
        variant="ghost"
        size="sm"
        @click="emit('undo')"
      >
        Undo
      </BaseButton>
      <BaseButton
        variant="ghost"
        size="sm"
        @click="emit('close')"
      >
        ×
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.base-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-dark);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: var(--spacing-sm);
}

.toast-text {
  margin-right: var(--spacing-md);
}

.toast-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.toast-success {
  border-left: 4px solid var(--status-success);
}

.toast-error {
  border-left: 4px solid var(--status-error);
}

.toast-warning {
  border-left: 4px solid var(--status-warning);
}

.toast-info {
  border-left: 4px solid var(--status-info);
}
</style> 