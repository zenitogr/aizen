<script setup lang="ts">
import { ref } from 'vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';

const practices = ref([
  {
    id: 1,
    title: 'Daily Meditation',
    duration: '10 min',
    type: 'meditation',
    description: 'A guided meditation to start your day with clarity and purpose.'
  },
  {
    id: 2,
    title: 'Breathing Exercise',
    duration: '5 min',
    type: 'breathing',
    description: 'Simple breathing techniques to reduce stress and increase focus.'
  },
  {
    id: 3,
    title: 'Gratitude Practice',
    duration: '15 min',
    type: 'reflection',
    description: 'Reflect on the things you are grateful for to cultivate positivity.'
  }
]);
</script>

<template>
  <div class="mindfulness-view">
    <header class="view-header">
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
    </header>

    <div class="practices-grid">
      <BaseCard 
        v-for="practice in practices" 
        :key="practice.id"
        variant="elevated"
        class="practice-card"
      >
        <div class="practice-header">
          <h3>{{ practice.title }}</h3>
          <span class="duration">{{ practice.duration }}</span>
        </div>
        <p class="practice-description">{{ practice.description }}</p>
        <BaseButton variant="secondary" class="start-button">
          Start Practice
        </BaseButton>
      </BaseCard>
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