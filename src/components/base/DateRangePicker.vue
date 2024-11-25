<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseInput from './BaseInput.vue';

interface Props {
  startDate?: string
  endDate?: string
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:startDate': [date: string]
  'update:endDate': [date: string]
}>();

const startDate = ref(props.startDate || '');
const endDate = ref(props.endDate || '');

watch(startDate, (newDate) => {
  emit('update:startDate', newDate);
});

watch(endDate, (newDate) => {
  emit('update:endDate', newDate);
});

// Ensure end date is not before start date
watch(startDate, (newStartDate) => {
  if (endDate.value && newStartDate > endDate.value) {
    endDate.value = newStartDate;
  }
});

watch(endDate, (newEndDate) => {
  if (startDate.value && newEndDate < startDate.value) {
    startDate.value = newEndDate;
  }
});
</script>

<template>
  <div class="date-range-picker">
    <div class="date-input">
      <label>From</label>
      <BaseInput
        v-model="startDate"
        type="date"
        :max="endDate"
      />
    </div>
    <div class="date-input">
      <label>To</label>
      <BaseInput
        v-model="endDate"
        type="date"
        :min="startDate"
      />
    </div>
  </div>
</template>

<style scoped>
.date-range-picker {
  display: flex;
  gap: var(--spacing-md);
}

.date-input {
  flex: 1;
}

label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

@media (max-width: 768px) {
  .date-range-picker {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style> 