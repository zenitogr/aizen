<script setup lang="ts">
import { ref } from 'vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseInput from '../components/base/BaseInput.vue';

const searchQuery = ref('');
const memories = ref([
  {
    id: 1,
    title: 'First Memory',
    type: 'image',
    tags: ['personal', 'milestone'],
    date: new Date().toISOString(),
  }
]);
</script>

<template>
  <div class="memory-vault-view">
    <header class="view-header">
      <div class="header-top">
        <h1>Memory Vault</h1>
        <BaseButton>Add Memory</BaseButton>
      </div>
      
      <div class="search-bar">
        <BaseInput
          v-model="searchQuery"
          placeholder="Search memories..."
        />
      </div>
    </header>

    <div class="memories-grid">
      <BaseCard 
        v-for="memory in memories" 
        :key="memory.id"
        variant="elevated"
        class="memory-card"
      >
        <div class="memory-preview">
          <!-- Placeholder for memory preview -->
          <div class="preview-placeholder"></div>
        </div>
        <h3>{{ memory.title }}</h3>
        <div class="memory-tags">
          <span 
            v-for="tag in memory.tags" 
            :key="tag" 
            class="tag"
          >
            {{ tag }}
          </span>
        </div>
        <time>{{ new Date(memory.date).toLocaleDateString() }}</time>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.memory-vault-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  width: 100%;
}

.view-header {
  margin-bottom: var(--spacing-xl);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.search-bar {
  max-width: 600px;
}

.memories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.memory-card {
  cursor: pointer;
}

.memory-card:hover {
  transform: translateY(-2px);
}

.memory-preview {
  aspect-ratio: 16/9;
  margin-bottom: var(--spacing-sm);
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  background: var(--surface-light);
  border-radius: 8px;
}

.memory-tags {
  display: flex;
  gap: var(--spacing-xs);
  margin: var(--spacing-xs) 0;
  flex-wrap: wrap;
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

time {
  color: var(--text-disabled);
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .memory-vault-view {
    padding: var(--spacing-md);
  }
  
  .view-header {
    margin-bottom: var(--spacing-lg);
  }
}
</style> 