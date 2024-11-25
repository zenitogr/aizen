<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSearchStore } from '../stores/search';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import SearchBar from '../components/search/SearchBar.vue';
import HighlightedText from '../components/base/HighlightedText.vue';

const searchStore = useSearchStore();

const practices = ref([
  {
    id: 1,
    title: 'Daily Meditation',
    duration: '10 min',
    type: 'mindfulness',
    tags: ['meditation', 'daily'],
    description: 'A guided meditation to start your day with clarity and purpose.'
  },
  {
    id: 2,
    title: 'Breathing Exercise',
    duration: '5 min',
    type: 'mindfulness',
    tags: ['breathing', 'stress-relief'],
    description: 'Simple breathing techniques to reduce stress and increase focus.'
  },
  {
    id: 3,
    title: 'Gratitude Practice',
    duration: '15 min',
    type: 'mindfulness',
    tags: ['reflection', 'gratitude'],
    description: 'Reflect on the things you are grateful for to cultivate positivity.'
  }
]);

const filteredPractices = computed(() => {
  let result = practices.value;
  const query = searchStore.query.toLowerCase();
  const filters = searchStore.filters;

  if (query) {
    result = result.filter(practice => 
      practice.title.toLowerCase().includes(query) ||
      practice.description.toLowerCase().includes(query) ||
      practice.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  if (filters.tags.length > 0) {
    result = result.filter(practice =>
      filters.tags.every(tag => practice.tags.includes(tag))
    );
  }

  if (filters.type) {
    result = result.filter(practice => practice.type === filters.type);
  }

  return result;
});
</script>

<template>
  <div class="mindfulness-view">
    <header class="view-header">
      <div class="header-content">
        <h1>Mindfulness</h1>
        <div class="header-stats">
          <BaseCard padding="sm" class="stat-card">
            <span class="stat-label">Practice Streak</span>
            <span class="stat-value">3 days</span>
          </BaseCard>
          <BaseCard padding="sm" class="stat-card">
            <span class="stat-label">Total Minutes</span>
            <span class="stat-value">120</span>
          </BaseCard>
        </div>
      </div>

      <SearchBar />
    </header>

    <div class="practices-grid">
      <BaseCard 
        v-for="practice in filteredPractices" 
        :key="practice.id"
        variant="elevated"
        class="practice-card"
      >
        <div class="practice-header">
          <h3>
            <HighlightedText 
              :text="practice.title"
              :query="searchStore.query"
            />
          </h3>
          <span class="duration">{{ practice.duration }}</span>
        </div>
        <p class="practice-description">
          <HighlightedText 
            :text="practice.description"
            :query="searchStore.query"
          />
        </p>
        <div class="practice-tags">
          <span 
            v-for="tag in practice.tags" 
            :key="tag"
            class="tag"
          >
            <HighlightedText 
              :text="tag"
              :query="searchStore.query"
            />
          </span>
        </div>
        <BaseButton variant="secondary" class="start-button">
          Start Practice
        </BaseButton>
      </BaseCard>
    </div>

    <div v-if="filteredPractices.length === 0" class="empty-state">
      <p v-if="searchStore.query || searchStore.filters.tags.length > 0">
        No practices match your search criteria
      </p>
      <p v-else>
        No mindfulness practices available at the moment.
      </p>
    </div>
  </div>
</template>

<style scoped>
.mindfulness-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  width: 100%;
}

.view-header {
  margin-bottom: var(--spacing-xl);
}

.header-stats {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
}

.practices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.practice-card {
  display: flex;
  flex-direction: column;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.duration {
  background: var(--surface-light);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.practice-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
  flex-grow: 1;
}

.start-button {
  width: 100%;
}

.practice-tags {
  display: flex;
  gap: var(--spacing-xs);
  margin: var(--spacing-md) 0;
  flex-wrap: wrap;
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

.header-content {
  margin-bottom: var(--spacing-md);
}

@media (max-width: 768px) {
  .mindfulness-view {
    padding: var(--spacing-md);
  }
  
  .header-stats {
    flex-wrap: wrap;
  }
  
  .stat-card {
    flex: 1;
    min-width: 100px;
  }
}
</style> 