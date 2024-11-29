<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { SystemMonitoringService } from '../../services/systemMonitoring';
import { PerformanceService } from '../../services/performance';
import BaseCard from '../base/BaseCard.vue';
import { useLogsStore } from '../../stores/logs';

const logsStore = useLogsStore();
const refreshInterval = ref<number | null>(null);
const metrics = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const updateMetrics = async () => {
  try {
    loading.value = true;
    error.value = null;

    const systemStatus = await SystemMonitoringService.checkSystemStatus();
    const performanceMetrics = await PerformanceService.getMetrics();

    metrics.value = {
      system: systemStatus,
      performance: performanceMetrics
    };

    await logsStore.addLog({
      level: 'info',
      category: 'performance',
      action: 'metrics_update',
      message: 'Performance metrics updated',
      details: metrics.value,
      status: 'success'
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update metrics';
    await logsStore.addLog({
      level: 'error',
      category: 'performance',
      action: 'metrics_update',
      message: 'Failed to update performance metrics',
      error: error.value,
      status: 'failure'
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await updateMetrics();
  refreshInterval.value = setInterval(updateMetrics, 30000) as unknown as number;
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success': return 'var(--status-success)';
    case 'failure': return 'var(--status-error)';
    case 'pending': return 'var(--status-warning)';
    default: return 'var(--text-secondary)';
  }
};
</script>

<template>
  <div class="performance-metrics">
    <BaseCard v-if="loading" class="loading-card">
      <p>Loading metrics...</p>
    </BaseCard>

    <BaseCard v-else-if="error" class="error-card">
      <p>{{ error }}</p>
      <BaseButton @click="updateMetrics">Retry</BaseButton>
    </BaseCard>

    <template v-else>
      <BaseCard class="metrics-card">
        <h3>System Health</h3>
        <div class="metrics-grid">
          <div class="metric">
            <span class="metric-label">Memory Usage</span>
            <span class="metric-value">{{ formatBytes(metrics.system.health.performance.memory.used) }}</span>
            <div class="memory-bar">
              <div 
                class="memory-used"
                :style="{
                  width: `${(metrics.system.health.performance.memory.used / metrics.system.health.performance.memory.total) * 100}%`
                }"
              ></div>
            </div>
          </div>

          <div class="metric">
            <span class="metric-label">Load Time</span>
            <span class="metric-value">{{ formatDuration(metrics.system.health.performance.loadTime) }}</span>
          </div>

          <div class="metric">
            <span class="metric-label">Response Time</span>
            <span class="metric-value">{{ formatDuration(metrics.system.health.performance.responseTime) }}</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="metrics-card">
        <h3>Services Status</h3>
        <div class="services-grid">
          <div 
            v-for="(status, service) in metrics.system.health.services" 
            :key="service"
            class="service-status"
          >
            <span class="service-name">{{ service }}</span>
            <span 
              class="status-indicator"
              :style="{ backgroundColor: getStatusColor(status ? 'success' : 'failure') }"
            ></span>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="metrics-card">
        <h3>Storage Health</h3>
        <div class="storage-metrics">
          <div class="metric">
            <span class="metric-label">Last Backup</span>
            <span class="metric-value">{{ metrics.system.health.storage.lastBackup || 'Never' }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Status</span>
            <span 
              class="metric-value"
              :style="{ color: getStatusColor(metrics.system.health.storage.available ? 'success' : 'failure') }"
            >
              {{ metrics.system.health.storage.available ? 'Available' : 'Unavailable' }}
            </span>
          </div>
        </div>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.performance-metrics {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.metrics-card {
  padding: var(--spacing-md);
}

.metrics-grid {
  display: grid;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.metric-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 500;
}

.memory-bar {
  height: 4px;
  background: var(--surface-light);
  border-radius: 2px;
  overflow: hidden;
  margin-top: var(--spacing-xs);
}

.memory-used {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.services-grid {
  display: grid;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.service-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.storage-metrics {
  display: grid;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.loading-card, .error-card {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-xl);
}
</style> 