<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { SystemMonitoringService } from '../../services/systemMonitoring';
import { BackupMonitoringService } from '../../services/backupMonitoring';
import { DataIntegrityService } from '../../services/dataIntegrity';
import { useLogsStore } from '../../stores/logs';
import BaseCard from '../base/BaseCard.vue';
import BaseButton from '../base/BaseButton.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';

const logsStore = useLogsStore();
const refreshInterval = ref<number | null>(null);
const systemStatus = ref<any>(null);
const backupStatus = ref<any>(null);
const integrityStatus = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const updateStatus = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Get system status
    systemStatus.value = await SystemMonitoringService.checkSystemStatus();
    
    // Get latest backup status
    const backupHistory = await BackupMonitoringService.getBackupHistory();
    backupStatus.value = backupHistory[0];
    
    // Run integrity check
    integrityStatus.value = await DataIntegrityService.checkJournalEntries();

    await logsStore.addLog({
      level: 'info',
      category: 'health',
      action: 'dashboard_update',
      message: 'System health dashboard updated',
      details: {
        system: systemStatus.value,
        backup: backupStatus.value,
        integrity: integrityStatus.value
      },
      status: 'success'
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update system status';
    await logsStore.addLog({
      level: 'error',
      category: 'health',
      action: 'dashboard_update',
      message: 'Failed to update system health dashboard',
      error: error.value,
      status: 'failure'
    });
  } finally {
    loading.value = false;
  }
};

const handleBackup = async () => {
  try {
    const result = await BackupMonitoringService.createBackup();
    backupStatus.value = result;
  } catch (error) {
    console.error('Backup failed:', error);
  }
};

const handleIntegrityCheck = async () => {
  try {
    integrityStatus.value = await DataIntegrityService.checkJournalEntries();
  } catch (error) {
    console.error('Integrity check failed:', error);
  }
};

onMounted(async () => {
  await updateStatus();
  refreshInterval.value = setInterval(updateStatus, 60000) as unknown as number;
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

const getStatusColor = (status: string | boolean): string => {
  if (typeof status === 'boolean') {
    return status ? 'var(--status-success)' : 'var(--status-error)';
  }
  switch (status) {
    case 'success': return 'var(--status-success)';
    case 'failure': return 'var(--status-error)';
    case 'pending': return 'var(--status-warning)';
    default: return 'var(--text-secondary)';
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};
</script>

<template>
  <div class="system-health-dashboard">
    <header class="dashboard-header">
      <h2>System Health Dashboard</h2>
      <div class="header-actions">
        <BaseButton 
          variant="secondary"
          size="sm"
          @click="handleBackup"
        >
          Create Backup
        </BaseButton>
        <BaseButton 
          variant="secondary"
          size="sm"
          @click="handleIntegrityCheck"
        >
          Check Integrity
        </BaseButton>
        <BaseButton 
          variant="ghost"
          size="sm"
          @click="updateStatus"
        >
          Refresh
        </BaseButton>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <p>Loading system status...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <BaseButton @click="updateStatus">Retry</BaseButton>
    </div>

    <template v-else>
      <div class="dashboard-grid">
        <!-- System Status -->
        <BaseCard class="status-card">
          <h3>System Status</h3>
          <div class="status-grid">
            <div 
              v-for="(status, service) in systemStatus?.health.services" 
              :key="service"
              class="status-item"
            >
              <span class="status-label">{{ service }}</span>
              <span 
                class="status-indicator"
                :style="{ backgroundColor: getStatusColor(status) }"
              ></span>
            </div>
          </div>
        </BaseCard>

        <!-- Backup Status -->
        <BaseCard class="status-card">
          <h3>Backup Status</h3>
          <div class="backup-info">
            <div class="info-item">
              <span class="info-label">Last Backup</span>
              <span class="info-value">{{ backupStatus ? formatDate(backupStatus.timestamp) : 'Never' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span 
                class="info-value"
                :style="{ color: getStatusColor(backupStatus?.status || 'failure') }"
              >
                {{ backupStatus?.status || 'No backup' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Entries</span>
              <span class="info-value">{{ backupStatus?.entryCount || 0 }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Integrity Status -->
        <BaseCard class="status-card">
          <h3>Data Integrity</h3>
          <div class="integrity-info">
            <div class="info-item">
              <span class="info-label">Status</span>
              <span 
                class="info-value"
                :style="{ color: getStatusColor(integrityStatus?.passed || false) }"
              >
                {{ integrityStatus?.passed ? 'Passed' : 'Failed' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Checked Entries</span>
              <span class="info-value">{{ integrityStatus?.checkedEntries || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Issues Found</span>
              <span class="info-value">{{ integrityStatus?.errors.length || 0 }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Performance Metrics -->
        <PerformanceMetrics />
      </div>

      <div v-if="integrityStatus?.errors.length" class="issues-panel">
        <h3>Integrity Issues</h3>
        <ul class="issues-list">
          <li 
            v-for="(error, index) in integrityStatus.errors" 
            :key="index"
            class="issue-item"
          >
            {{ error }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.system-health-dashboard {
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

.dashboard-grid {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.status-card {
  padding: var(--spacing-md);
}

.status-grid {
  display: grid;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.info-label {
  color: var(--text-secondary);
}

.issues-panel {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--surface-dark);
  border-radius: 8px;
}

.issues-list {
  margin-top: var(--spacing-md);
  list-style: none;
  padding: 0;
}

.issue-item {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  color: var(--status-error);
}

.loading-state, .error-state {
  text-align: center;
  padding: var(--spacing-xl);
}
</style> 