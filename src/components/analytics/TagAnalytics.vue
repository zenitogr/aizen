<script setup lang="ts">
import { computed } from 'vue';
import { useTagsStore } from '../../stores/tags';
import BaseCard from '../base/BaseCard.vue';

const tagStore = useTagsStore();

const popularTags = computed(() => tagStore.getPopularTags);
const recentTags = computed(() => tagStore.getRecentTags);

const maxCount = computed(() => {
  if (popularTags.value.length === 0) return 0;
  return Math.max(...popularTags.value.map(t => t.count));
});

function getBarWidth(count: number): string {
  if (maxCount.value === 0) return '0%';
  return `${(count / maxCount.value) * 100}%`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<template>
  <div class="tag-analytics">
    <div class="analytics-grid">
      <BaseCard class="analytics-card">
        <h3>Popular Tags</h3>
        <div class="tag-list">
          <div 
            v-for="tag in popularTags" 
            :key="tag.tag"
            class="tag-item"
          >
            <div class="tag-info">
              <span class="tag-name">{{ tag.tag }}</span>
              <span class="tag-count">{{ tag.count }}</span>
            </div>
            <div class="tag-bar-container">
              <div 
                class="tag-bar"
                :style="{ width: getBarWidth(tag.count) }"
              ></div>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="analytics-card">
        <h3>Recent Tags</h3>
        <div class="tag-list">
          <div 
            v-for="tag in recentTags" 
            :key="tag"
            class="tag-item"
          >
            <div class="tag-info">
              <span class="tag-name">{{ tag }}</span>
              <span class="tag-date">
                {{ formatDate(tagStore.tagHistory[tag]?.lastUsed || '') }}
              </span>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.tag-analytics {
  width: 100%;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.analytics-card {
  height: 100%;
}

.analytics-card h3 {
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
  font-size: 1rem;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tag-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.tag-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-name {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.tag-count,
.tag-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.tag-bar-container {
  width: 100%;
  height: 4px;
  background: var(--surface-light);
  border-radius: 2px;
  overflow: hidden;
}

.tag-bar {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style> 