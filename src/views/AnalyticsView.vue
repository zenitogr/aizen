<script setup lang="ts">
import { ref } from 'vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import TagAnalytics from '../components/analytics/TagAnalytics.vue';

const activeTab = ref('tags');

const tabs = [
  { id: 'tags', label: 'Tags' },
  { id: 'activity', label: 'Activity' },
  { id: 'insights', label: 'Insights' }
];
</script>

<template>
  <div class="analytics-view">
    <header class="view-header">
      <h1>Analytics</h1>
      <div class="tab-navigation">
        <BaseButton
          v-for="tab in tabs"
          :key="tab.id"
          variant="ghost"
          size="sm"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </BaseButton>
      </div>
    </header>

    <div class="analytics-content">
      <Transition name="fade" mode="out-in">
        <div v-if="activeTab === 'tags'" key="tags">
          <TagAnalytics />
        </div>
        <div v-else-if="activeTab === 'activity'" key="activity" class="coming-soon">
          <BaseCard>
            <p>Activity analytics coming soon</p>
          </BaseCard>
        </div>
        <div v-else-if="activeTab === 'insights'" key="insights" class="coming-soon">
          <BaseCard>
            <p>AI-powered insights coming soon</p>
          </BaseCard>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.analytics-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  width: 100%;
}

.view-header {
  margin-bottom: var(--spacing-xl);
}

.tab-navigation {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-sm);
}

.tab-navigation .base-button {
  border-radius: 6px 6px 0 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-navigation .base-button.active {
  border-bottom-color: var(--primary-color);
}

.analytics-content {
  min-height: 400px;
}

.coming-soon {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .analytics-view {
    padding: var(--spacing-md);
  }

  .tab-navigation {
    overflow-x: auto;
    padding-bottom: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
  }

  .tab-navigation::-webkit-scrollbar {
    display: none;
  }
}
</style> 