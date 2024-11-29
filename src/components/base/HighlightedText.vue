<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  text: string
  query: string
}>()

const { text: textProp, query: queryProp } = props;

function highlightText(text: string, query: string) {
  if (!query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const parts = computed(() => {
  if (!queryProp || !textProp) return [textProp];
  return highlightText(textProp, queryProp);
});
</script>

<template>
  <span v-html="parts"></span>
</template>

<style scoped>
:deep(mark) {
  background-color: var(--primary-color);
  color: var(--text-primary);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
}
</style> 