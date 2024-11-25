<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSearchStore } from '../../stores/search';
import BaseInput from '../base/BaseInput.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseCard from '../base/BaseCard.vue';
import DateRangePicker from '../base/DateRangePicker.vue';

const searchStore = useSearchStore();
const showFilters = ref(false);
const localQuery = ref(searchStore.query);

// Sync local query with store
watch(() => searchStore.query, (newQuery) => {
  localQuery.value = newQuery;
});

watch(localQuery, (newQuery) => {
  searchStore.setQuery(newQuery);
});

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

function clearSearch() {
  searchStore.clearAll();
  localQuery.value = '';
}

function removeTag(tag: string) {
  searchStore.removeTag(tag);
}

function handleDateRangeChange(start: string, end: string) {
  if (start && end) {
    searchStore.setDateRange(start, end);
  } else {
    searchStore.clearDateRange();
  }
}
</script>

<template>
  <div class="search-container">
    <div class="search-bar">
      <BaseInput
        v-model="localQuery"
        placeholder="Search..."
        class="search-input"
      >
        <template #prefix>
          <i class="search-icon">🔍</i>
        </template>
        <template #suffix>
          <BaseButton
            v-if="localQuery"
            variant="ghost"
            size="sm"
            class="clear-button"
            @click="clearSearch"
          >
            ×
          </BaseButton>
        </template>
      </BaseInput>
      
      <BaseButton
        variant="ghost"
        size="sm"
        :class="{ active: showFilters }"
        @click="toggleFilters"
      >
        Filters
      </BaseButton>
    </div>

    <Transition name="slide">
      <BaseCard v-if="showFilters" class="filters-panel" padding="sm">
        <div class="filters-content">
          <div class="filter-group">
            <h4>Date Range</h4>
            <DateRangePicker
              :start-date="searchStore.filters.dateRange?.start"
              :end-date="searchStore.filters.dateRange?.end"
              @update:start-date="(date) => handleDateRangeChange(date, searchStore.filters.dateRange?.end || '')"
              @update:end-date="(date) => handleDateRangeChange(searchStore.filters.dateRange?.start || '', date)"
            />
          </div>

          <div class="filter-group">
            <h4>Tags</h4>
            <div class="tags">
              <span 
                v-for="tag in searchStore.filters.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
                <button 
                  class="remove-tag"
                  @click="removeTag(tag)"
                >
                  ×
                </button>
              </span>
            </div>
          </div>

          <div class="filter-group">
            <h4>Type</h4>
            <div class="type-filters">
              <BaseButton
                v-for="type in ['journal', 'memory', 'mindfulness']"
                :key="type"
                variant="ghost"
                size="sm"
                :class="{ active: searchStore.filters.type === type }"
                @click="searchStore.setType(searchStore.filters.type === type ? undefined : type)"
              >
                {{ type }}
              </BaseButton>
            </div>
          </div>

          <div class="filter-actions">
            <BaseButton
              variant="ghost"
              size="sm"
              @click="searchStore.clearFilters"
            >
              Clear Filters
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </Transition>
  </div>
</template>

<style scoped>
.search-container {
  width: 100%;
  position: relative;
}

.search-bar {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.search-input {
  flex: 1;
}

.search-icon {
  opacity: 0.5;
  font-style: normal;
}

.clear-button {
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filters-panel {
  margin-top: var(--spacing-sm);
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.filter-group {
  margin-bottom: var(--spacing-md);
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group h4 {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.remove-tag {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.remove-tag:hover {
  opacity: 1;
}

.type-filters {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-out;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
  }
}
</style> 