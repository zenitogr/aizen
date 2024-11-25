<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseButton from './BaseButton.vue';

interface Props {
  message: string
  duration?: number
  showUndo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 5000,
  showUndo: false
});

const emit = defineEmits<{
  close: []
  undo: []
}>();

const isVisible = ref(true);
let timeout: number;

onMounted(() => {
  timeout = window.setTimeout(() => {
    isVisible.value = false;
    emit('close');
  }, props.duration);
});

function handleUndo() {
  clearTimeout(timeout);
  emit('undo');
  emit('close');
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="isVisible" class="toast">
      <p class="toast-message">{{ message }}</p>
      <div class="toast-actions">
        <BaseButton 
          v-if="showUndo"
          variant="ghost"
          size="sm"
          @click="handleUndo"
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
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  min-width: 300px;
  max-width: 90vw;
}

.toast-message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.toast-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-left: auto;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translate(-50%, 100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}
</style> 