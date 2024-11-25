<script setup lang="ts">
import { ref } from 'vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';

const entries = ref([
  {
    id: 1,
    title: 'My First Entry',
    preview: 'Today I started my journey with AiZEN...',
    date: new Date().toISOString(),
  }
]);
</script>

<template>
  <div class="journal-view">
    <header class="view-header">
      <h1>Journal</h1>
      <BaseButton>New Entry</BaseButton>
    </header>

    <div class="entries-grid">
      <BaseCard 
        v-for="entry in entries" 
        :key="entry.id"
        variant="elevated"
        class="entry-card"
      >
        <h3>{{ entry.title }}</h3>
        <p class="entry-preview">{{ entry.preview }}</p>
        <time>{{ new Date(entry.date).toLocaleDateString() }}</time>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.journal-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  width: 100%;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.entry-card {
  cursor: pointer;
}

.entry-card:hover {
  transform: translateY(-2px);
}

.entry-preview {
  color: var(--text-secondary);
  margin: var(--spacing-sm) 0;
  font-size: 0.875rem;
}

time {
  color: var(--text-disabled);
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .journal-view {
    padding: var(--spacing-md);
  }
  
  .view-header {
    margin-bottom: var(--spacing-lg);
  }
}
</style> 