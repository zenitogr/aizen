<script setup lang="ts">
interface Props {
  modelValue: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()
</script>

<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="{ 'has-error': error }"
      class="base-input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    />
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.base-input {
  height: 40px;
  padding: 0 var(--spacing-md);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-dark);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: 0.875rem;
  transition: var(--transition-default);
}

.base-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.1);
}

.base-input:disabled {
  background: var(--surface-light);
  cursor: not-allowed;
  opacity: 0.7;
}

.base-input.has-error {
  border-color: var(--status-error);
}

.error-message {
  color: var(--status-error);
  font-size: 0.75rem;
  margin: 0;
}
</style> 