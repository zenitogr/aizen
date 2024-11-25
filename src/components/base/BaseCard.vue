<script setup lang="ts">
interface Props {
  variant?: 'default' | 'elevated'
  padding?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md'
})
</script>

<template>
  <div :class="['base-card', `variant-${variant}`, `padding-${padding}`]">
    <slot></slot>
  </div>
</template>

<style scoped>
.base-card {
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: var(--transition-default);
}

/* Variants */
.variant-default {
  background: var(--surface-dark);
}

.variant-elevated {
  background: var(--surface-light);
  box-shadow: var(--shadow-md);
}

/* Padding */
.padding-sm {
  padding: var(--spacing-sm);
}

.padding-md {
  padding: var(--spacing-md);
}

.padding-lg {
  padding: var(--spacing-lg);
}

/* Hover Effect */
.variant-elevated:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
</style> 