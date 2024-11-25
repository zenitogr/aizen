<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button'
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type"
    :class="[
      'base-button',
      `variant-${variant}`,
      `size-${size}`,
      { loading }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="loader"></span>
    <span :class="{ 'content-hidden': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-weight: 500;
  border: 1px solid transparent;
  transition: var(--transition-default);
  gap: var(--spacing-xs);
  white-space: nowrap;
}

/* Variants */
.variant-primary {
  background: var(--primary-color);
  color: var(--text-primary);
}

.variant-secondary {
  background: transparent;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.variant-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

/* Sizes */
.size-sm {
  height: 32px;
  padding: 0 var(--spacing-md);
  font-size: 0.875rem;
  border-radius: 6px;
}

.size-md {
  height: 40px;
  padding: 0 var(--spacing-lg);
  font-size: 0.875rem;
  border-radius: 8px;
}

.size-lg {
  height: 48px;
  padding: 0 var(--spacing-xl);
  font-size: 1rem;
  border-radius: 10px;
}

/* States */
.base-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.base-button:active:not(:disabled) {
  transform: translateY(0);
}

.base-button:disabled {
  background: var(--text-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

/* Loading State */
.loading {
  cursor: wait;
}

.content-hidden {
  opacity: 0;
}

.loader {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 