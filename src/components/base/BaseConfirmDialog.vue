<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseButton from './BaseButton.vue';
import BaseCard from './BaseCard.vue';

interface Props {
  show: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel'
});

const emit = defineEmits<{
  confirm: []
  cancel: []
}>();

const isVisible = ref(props.show);

watch(() => props.show, (newValue) => {
  isVisible.value = newValue;
});
</script>

<template>
  <Transition name="fade">
    <div v-if="isVisible" class="dialog-overlay">
      <BaseCard variant="elevated" class="dialog-content">
        <h3>{{ title }}</h3>
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <BaseButton 
            variant="ghost"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </BaseButton>
          <BaseButton 
            variant="primary"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.dialog-content {
  width: 100%;
  max-width: 400px;
}

.dialog-message {
  color: var(--text-secondary);
  margin: var(--spacing-md) 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dialog-content {
  transition: transform 0.2s;
}

.fade-enter-from .dialog-content,
.fade-leave-to .dialog-content {
  transform: translateY(-20px);
}
</style> 