<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSearchStore } from '../stores/search';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import SearchBar from '../components/search/SearchBar.vue';

const searchStore = useSearchStore();
const memories = ref([
  {
    id: 1,
    title: 'First Memory',
    type: 'memory',
    tags: ['personal', 'milestone'],
    date: new Date().toISOString(),
  }
]);

const filteredMemories = computed(() => {
  let result = memories.value;
  const query = searchStore.query.toLowerCase();
  const filters = searchStore.filters;

  if (query) {
    result = result.filter(memory => 
      memory.title.toLowerCase().includes(query) ||
      memory.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  if (filters.tags.length > 0) {
    result = result.filter(memory =>
      filters.tags.every(tag => memory.tags.includes(tag))
    );
  }

  if (filters.type) {
    result = result.filter(memory => memory.type === filters.type);
  }

  if (filters.dateRange?.start && filters.dateRange?.end) {
    result = result.filter(memory => {
      const memoryDate = new Date(memory.date).getTime();
      const start = new Date(filters.dateRange!.start).getTime();
      const end = new Date(filters.dateRange!.end).getTime();
      return memoryDate >= start && memoryDate <= end;
    });
  }

  return result;
});
</script>

<template>
  <div class="memory-vault-view">
    <header class="view-header">
      <div class="header-content">
        <h1>Memory Vault</h1>
        <BaseButton>Add Memory</BaseButton>
      </div>
      
      <SearchBar />
    </header>

    <div class="memories-grid">
      <BaseCard 
        v-for="memory in filteredMemories" 
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

    <div v-if="filteredMemories.length === 0" class="empty-state">
      <p v-if="searchStore.query || searchStore.filters.tags.length > 0">
        No memories match your search criteria
      </p>
      <p v-else>
        No memories yet. Click "Add Memory" to get started.
      </p>
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
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

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .memory-vault-view {
    padding: var(--spacing-md);
  }
  
  .view-header {
    margin-bottom: var(--spacing-lg);
  }

  .header-content {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
}
</style> 