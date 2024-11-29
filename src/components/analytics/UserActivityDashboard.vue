<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { UserAnalyticsService } from '../../services/userAnalytics';
import { useLogsStore } from '../../stores/logs';
import BaseCard from '../base/BaseCard.vue';
import BaseButton from '../base/BaseButton.vue';

const logsStore = useLogsStore();
const refreshInterval = ref<number | null>(null);
const metrics = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const updateMetrics = async () => {
  try {
    loading.value = true;
    error.value = null;

    metrics.value = await UserAnalyticsService.analyzeUserActivity();

    await logsStore.addLog({
      level: 'info',
      category: 'analytics',
      action: 'metrics_update',
      message: 'User activity metrics updated',
      details: metrics.value,
      status: 'success'
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update metrics';
    await logsStore.addLog({
      level: 'error',
      category: 'analytics',
      action: 'metrics_update',
      message: 'Failed to update user activity metrics',
      error: error.value,
      status: 'failure'
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await updateMetrics();
  refreshInterval.value = setInterval(updateMetrics, 60000) as unknown as number;
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
};

const getStatusColor = (value: number, thresholds: { low: number; medium: number }): string => {
  if (value >= thresholds.medium) return 'var(--status-success)';
  if (value >= thresholds.low) return 'var(--status-warning)';
  return 'var(--status-error)';
};
</script>

<template>
  <div class="user-activity-dashboard">
    <header class="dashboard-header">
      <h2>User Activity Analytics</h2>
      <BaseButton 
        variant="ghost"
        size="sm"
        @click="updateMetrics"
      >
        Refresh
      </BaseButton>
    </header>

    <div v-if="loading" class="loading-state">
      <p>Loading activity metrics...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <BaseButton @click="updateMetrics">Retry</BaseButton>
    </div>

    <template v-else>
      <div class="metrics-grid">
        <!-- Session Overview -->
        <BaseCard class="metrics-card">
          <h3>Session Overview</h3>
          <div class="metrics-list">
            <div class="metric">
              <span class="metric-label">Active Time</span>
              <span class="metric-value">{{ formatDuration(metrics.activeTime) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Total Interactions</span>
              <span class="metric-value">{{ metrics.interactions.total }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Journal Activity -->
        <BaseCard class="metrics-card">
          <h3>Journal Activity</h3>
          <div class="metrics-list">
            <div class="metric">
              <span class="metric-label">Entries Created</span>
              <span class="metric-value">{{ metrics.features.journal.entriesCreated }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Average Words</span>
              <span 
                class="metric-value"
                :style="{ color: getStatusColor(metrics.features.journal.averageWordCount, { low: 50, medium: 100 }) }"
              >
                {{ formatNumber(metrics.features.journal.averageWordCount) }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Total Words</span>
              <span class="metric-value">{{ formatNumber(metrics.features.journal.totalWords) }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- AI Usage -->
        <BaseCard class="metrics-card">
          <h3>AI Features</h3>
          <div class="metrics-list">
            <div class="metric">
              <span class="metric-label">Prompts Generated</span>
              <span class="metric-value">{{ metrics.features.ai.promptsGenerated }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Analysis Requested</span>
              <span class="metric-value">{{ metrics.features.ai.analysisRequested }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Success Rate</span>
              <span 
                class="metric-value"
                :style="{ color: getStatusColor(metrics.features.ai.successRate, { low: 70, medium: 90 }) }"
              >
                {{ formatNumber(metrics.features.ai.successRate) }}%
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Navigation -->
        <BaseCard class="metrics-card">
          <h3>Navigation</h3>
          <div class="path-visits">
            <div 
              v-for="(count, path) in metrics.navigation.pathVisits" 
              :key="path"
              class="path-stat"
            >
              <span class="path-name">{{ path || '/' }}</span>
              <span class="visit-count">{{ count }} visits</span>
              <div class="time-spent">
                {{ formatDuration(metrics.navigation.averageTimePerPath[path] || 0) }}
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Error Overview -->
        <BaseCard class="metrics-card">
          <h3>Error Overview</h3>
          <div class="error-stats">
            <div class="metric">
              <span class="metric-label">Total Errors</span>
              <span 
                class="metric-value"
                :style="{ color: getStatusColor(100 - metrics.errors.total, { low: 50, medium: 80 }) }"
              >
                {{ metrics.errors.total }}
              </span>
            </div>
            <div class="error-categories">
              <div 
                v-for="(count, category) in metrics.errors.byCategory" 
                :key="category"
                class="error-category"
              >
                <span class="category-name">{{ category }}</span>
                <span class="error-count">{{ count }}</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-activity-dashboard {
  padding: var(--spacing-lg);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.metrics-grid {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.metrics-card {
  padding: var(--spacing-md);
}

.metrics-list {
  display: grid;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: var(--text-secondary);
}

.metric-value {
  font-size: 1.125rem;
  font-weight: 500;
}

.path-visits {
  margin-top: var(--spacing-md);
}

.path-stat {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--border-color);
}

.path-name {
  color: var(--text-secondary);
}

.visit-count {
  color: var(--text-primary);
}

.time-spent {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.error-stats {
  margin-top: var(--spacing-md);
}

.error-categories {
  margin-top: var(--spacing-md);
}

.error-category {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--border-color);
}

.category-name {
  color: var(--text-secondary);
}

.error-count {
  color: var(--status-error);
}

.loading-state, .error-state {
  text-align: center;
  padding: var(--spacing-xl);
}
</style> 