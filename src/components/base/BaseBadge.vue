<script setup lang="ts">
interface Props {
  count: number
  variant?: 'primary' | 'error' | 'warning'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary'
})
</script>

<template>
  <span 
    v-if="count > 0"
    :class="['base-badge', `variant-${variant}`]"
  >
    {{ count > 99 ? '99+' : count }}
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
}

.variant-primary {
  background: var(--primary-color);
}

.variant-error {
  background: var(--status-error);
}

.variant-warning {
  background: var(--status-warning);
}
</style> 