<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLogsStore, type LogLevel, type LogCategory } from '../stores/logs'
import BaseCard from '../components/base/BaseCard.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseInput from '../components/base/BaseInput.vue'
import DateRangePicker from '../components/base/DateRangePicker.vue'

const logsStore = useLogsStore()

// Filter states
const selectedLevels = ref<LogLevel[]>([])
const selectedCategories = ref<LogCategory[]>([])
const selectedStatuses = ref<('success' | 'failure' | 'pending')[]>([])
const searchQuery = ref('')
const dateRange = ref<{ start?: string; end?: string }>({})

const availableLevels: LogLevel[] = ['info', 'warning', 'error', 'debug']
const availableCategories: LogCategory[] = [
  'storage', 
  'journal', 
  'auth', 
  'ai', 
  'system', 
  'navigation',
  'user_action',
  'state_change'
]
const availableStatuses = ['success', 'failure', 'pending']

onMounted(async () => {
  await logsStore.initialize()
})

const filteredLogs = computed(() => {
  return logsStore.filteredLogs({
    level: selectedLevels.value.length ? selectedLevels.value : undefined,
    category: selectedCategories.value.length ? selectedCategories.value : undefined,
    status: selectedStatuses.value.length ? selectedStatuses.value : undefined,
    search: searchQuery.value,
    startDate: dateRange.value.start,
    endDate: dateRange.value.end
  })
})

async function handleExport() {
  const logs = await logsStore.exportLogs()
  // Implement export functionality (e.g., save to file)
}

async function handleClear() {
  if (confirm('Are you sure you want to clear all logs?')) {
    await logsStore.clearLogs()
  }
}

function getLogColor(level: LogLevel): string {
  switch (level) {
    case 'error': return 'var(--status-error)'
    case 'warning': return 'var(--status-warning)'
    case 'info': return 'var(--status-info)'
    case 'debug': return 'var(--text-secondary)'
    default: return 'var(--text-primary)'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <div class="logs-view">
    <header class="view-header">
      <div class="header-content">
        <h1>System Logs</h1>
        <div class="header-actions">
          <BaseButton 
            variant="secondary"
            @click="handleExport"
          >
            Export Logs
          </BaseButton>
          <BaseButton 
            variant="ghost"
            @click="handleClear"
          >
            Clear Logs
          </BaseButton>
        </div>
      </div>
    </header>

    <div class="filters">
      <BaseCard class="filter-card">
        <div class="filter-groups">
          <div class="filter-group">
            <h3>Log Levels</h3>
            <div class="filter-options">
              <label 
                v-for="level in availableLevels" 
                :key="level"
                class="filter-option"
              >
                <input 
                  type="checkbox"
                  v-model="selectedLevels"
                  :value="level"
                />
                {{ level }}
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h3>Categories</h3>
            <div class="filter-options">
              <label 
                v-for="category in availableCategories" 
                :key="category"
                class="filter-option"
              >
                <input 
                  type="checkbox"
                  v-model="selectedCategories"
                  :value="category"
                />
                {{ category.replace('_', ' ') }}
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h3>Status</h3>
            <div class="filter-options">
              <label 
                v-for="status in availableStatuses" 
                :key="status"
                class="filter-option"
              >
                <input 
                  type="checkbox"
                  v-model="selectedStatuses"
                  :value="status"
                />
                {{ status }}
              </label>
            </div>
          </div>
        </div>

        <div class="search-filters">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search logs..."
          />
          <DateRangePicker
            v-model="dateRange"
            placeholder="Filter by date..."
          />
        </div>
      </BaseCard>
    </div>

    <div class="logs-container">
      <BaseCard 
        v-for="log in filteredLogs" 
        :key="log.id"
        class="log-entry"
        :class="log.level"
      >
        <div class="log-header">
          <span 
            class="log-level"
            :style="{ color: getLogColor(log.level) }"
          >
            {{ log.level.toUpperCase() }}
          </span>
          <span class="log-category">{{ log.category }}</span>
          <span class="log-timestamp">{{ formatDate(log.timestamp) }}</span>
        </div>

        <div class="log-content">
          <div class="log-action">{{ log.action }}</div>
          <div class="log-message">{{ log.message }}</div>
          <pre v-if="log.details" class="log-details">{{ JSON.stringify(log.details, null, 2) }}</pre>
          <div v-if="log.error" class="log-error">{{ log.error }}</div>
        </div>

        <div class="log-status" :class="log.status">
          {{ log.status }}
        </div>
      </BaseCard>

      <div v-if="filteredLogs.length === 0" class="empty-state">
        <p>No logs found matching your filters</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logs-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  width: 100%;
}

/* Add the rest of the styles... */
</style> 