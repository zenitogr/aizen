<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLogsStore, type LogCategory } from '../../stores/logs';
import BaseCard from '../base/BaseCard.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseInput from '../base/BaseInput.vue';

const logsStore = useLogsStore();
const refreshInterval = ref<number | null>(null);
const searchQuery = ref('');
const selectedCategories = ref<LogCategory[]>([]);
const selectedTimeframe = ref<'hour' | 'day' | 'week' | 'all'>('day');

const timeframes: Record<string, number> = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  all: 0
};

const errorLogs = computed(() => {
  let logs = logsStore.filteredLogs({
    level: ['error'],
    category: selectedCategories.value.length ? selectedCategories.value : undefined,
    search: searchQuery.value || undefined
  });

  if (selectedTimeframe.value !== 'all') {
    const cutoff = new Date(Date.now() - (timeframes[selectedTimeframe.value] || 0));
    logs = logs.filter(log => new Date(log.timestamp) > cutoff);
  }

  return logs;
});

const errorCategories = computed(() => {
  const categories = new Set<LogCategory>();
  errorLogs.value.forEach(log => categories.add(log.category));
  return Array.from(categories);
});

const errorsByCategory = computed(() => {
  const byCategory: Record<LogCategory, number> = {} as Record<LogCategory, number>;
  errorLogs.value.forEach(log => {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
  });
  return byCategory;
});

const errorTrends = computed(() => {
  const trends: Record<string, { count: number, trend: 'up' | 'down' | 'stable' }> = {};
  const now = Date.now();
  const previousPeriod = now - timeframes[selectedTimeframe.value];
  const currentPeriod = previousPeriod + timeframes[selectedTimeframe.value];

  errorCategories.value.forEach(category => {
    const currentErrors = errorLogs.value.filter(log => 
      log.category === category && 
      new Date(log.timestamp).getTime() > previousPeriod &&
      new Date(log.timestamp).getTime() <= currentPeriod
    ).length;

    const previousErrors = errorLogs.value.filter(log => 
      log.category === category && 
      new Date(log.timestamp).getTime() <= previousPeriod &&
      new Date(log.timestamp).getTime() > previousPeriod - timeframes[selectedTimeframe.value]
    ).length;

    trends[category] = {
      count: currentErrors,
      trend: currentErrors > previousErrors ? 'up' : 
             currentErrors < previousErrors ? 'down' : 'stable'
    };
  });

  return trends;
});

const updateInterval = 30000; // 30 seconds

onMounted(() => {
  refreshInterval.value = setInterval(() => {
    // Refresh logs
  }, updateInterval) as unknown as number;
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const getStatusColor = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return 'var(--status-error)';
    case 'down': return 'var(--status-success)';
    default: return 'var(--text-secondary)';
  }
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
};
</script>

<template>
  <div class="error-reporting-dashboard">
    <header class="dashboard-header">
      <h2>Error Reports</h2>
      <div class="header-actions">
        <div class="timeframe-selector">
          <BaseButton 
            v-for="timeframe in ['hour', 'day', 'week', 'all']"
            :key="timeframe"
            variant="ghost"
            size="sm"
            :class="{ active: selectedTimeframe === timeframe }"
            @click="() => selectedTimeframe = timeframe as 'hour' | 'day' | 'week' | 'all'"
          >
            {{ timeframe }}
          </BaseButton>
        </div>
      </div>
    </header>

    <div class="filters">
      <BaseInput
        v-model="searchQuery"
        placeholder="Search errors..."
      />
      <div class="category-filters">
        <BaseButton
          v-for="category in errorCategories"
          :key="category"
          variant="ghost"
          size="sm"
          :class="{ active: selectedCategories.includes(category) }"
          @click="selectedCategories = selectedCategories.includes(category as LogCategory) 
            ? selectedCategories.filter((c: LogCategory) => c !== category as LogCategory)
            : [...selectedCategories, category as LogCategory]"
        >
          {{ category }}
        </BaseButton>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Error Overview -->
      <BaseCard class="overview-card">
        <h3>Error Overview</h3>
        <div class="overview-stats">
          <div class="stat">
            <span class="stat-label">Total Errors</span>
            <span class="stat-value">{{ errorLogs.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Categories</span>
            <span class="stat-value">{{ errorCategories.length }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- Error Trends -->
      <BaseCard class="trends-card">
        <h3>Error Trends</h3>
        <div class="trends-list">
          <div 
            v-for="(data, category) in errorTrends" 
            :key="category"
            class="trend-item"
          >
            <span class="category">{{ category }}</span>
            <span class="count">{{ data.count }}</span>
            <span 
              class="trend-indicator"
              :style="{ color: getStatusColor(data.trend) }"
            >
              {{ getTrendIcon(data.trend) }}
            </span>
          </div>
        </div>
      </BaseCard>

      <!-- Error List -->
      <BaseCard class="errors-card">
        <h3>Recent Errors</h3>
        <div class="error-list">
          <div 
            v-for="error in errorLogs" 
            :key="error.id"
            class="error-item"
          >
            <div class="error-header">
              <span class="error-category">{{ error.category }}</span>
              <span class="error-time">{{ formatDate(error.timestamp) }}</span>
            </div>
            <div class="error-message">{{ error.message }}</div>
            <div v-if="error.error" class="error-details">{{ error.error }}</div>
          </div>
        </div>
      </BaseCard>

      <!-- Error Distribution -->
      <BaseCard class="metrics-card">
        <h3>Error Distribution</h3>
        <div class="error-distribution">
          <div 
            v-for="(count, category) in errorsByCategory" 
            :key="category"
            class="distribution-item"
          >
            <span class="category-name">{{ category }}</span>
            <span class="category-count">{{ count }}</span>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.error-reporting-dashboard {
  padding: var(--spacing-lg);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.timeframe-selector {
  display: flex;
  gap: var(--spacing-xs);
}

.filters {
  margin-bottom: var(--spacing-lg);
}

.category-filters {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  flex-wrap: wrap;
}

.dashboard-grid {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.overview-stats {
  display: grid;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 500;
}

.trends-list {
  margin-top: var(--spacing-md);
}

.trend-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.category {
  color: var(--text-secondary);
}

.trend-indicator {
  font-weight: bold;
}

.error-list {
  margin-top: var(--spacing-md);
}

.error-item {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.error-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.error-category {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.error-time {
  color: var(--text-disabled);
  font-size: 0.875rem;
}

.error-message {
  color: var(--status-error);
  margin-bottom: var(--spacing-xs);
}

.error-details {
  font-family: monospace;
  font-size: 0.875rem;
  padding: var(--spacing-sm);
  background: var(--surface-dark);
  border-radius: 4px;
  white-space: pre-wrap;
}

.active {
  background: var(--surface-light);
  color: var(--text-primary);
}
</style> 