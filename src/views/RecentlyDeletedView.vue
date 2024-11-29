<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useJournalStore } from '../stores/journal';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseInput from '../components/base/BaseInput.vue';
import HighlightedText from '../components/base/HighlightedText.vue';

const journalStore = useJournalStore();
const searchQuery = ref('');

// Add debug logging
onMounted(async () => {
  console.log('Recently Deleted View Mounted');
  // Ensure store is initialized
  await journalStore.initialize();
  console.log('All entries:', journalStore.entries);
  console.log('Recently deleted entries:', journalStore.recentlyDeletedEntries);
});

const recentlyDeleted = computed(() => {
  console.log('Computing recently deleted entries');
  const entries = journalStore.recentlyDeletedEntries;
  console.log('Base entries:', entries);
  
  if (!searchQuery.value) return entries;
  
  const query = searchQuery.value.toLowerCase();
  const filtered = entries.filter(entry => 
    entry?.title?.toLowerCase().includes(query) ||
    entry?.content?.toLowerCase().includes(query) ||
    entry?.tags?.some(tag => tag.toLowerCase().includes(query))
  );
  
  console.log('Filtered entries:', filtered);
  return filtered;
});

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function handleRestore(entryId: string) {
  journalStore.restoreEntry(entryId);
}

function handleHide(entryId: string) {
  journalStore.hideEntry(entryId);
}
</script>

<template>
  <div class="recently-deleted-view">
    <header class="view-header">
      <div class="header-content">
        <h1>Recently Deleted</h1>
        <p class="subtitle">Items here will be automatically hidden after 30 days</p>
      </div>
      
      <div class="search-bar">
        <BaseInput
          v-model="searchQuery"
          placeholder="Search deleted items..."
        />
      </div>
    </header>

    <div class="entries-grid">
      <BaseCard 
        v-for="entry in recentlyDeleted" 
        :key="entry.id"
        variant="elevated"
        class="entry-card"
      >
        <div class="entry-type-badge">{{ entry.type || 'Journal' }}</div>
        
        <h3>{{ entry.title }}</h3>
        <p class="entry-preview">{{ entry.content.slice(0, 150) }}...</p>
        
        <div class="entry-meta">
          <div class="entry-dates">
            <time class="deleted-date">
              Deleted: {{ formatDate(entry.deletedAt || '') }}
            </time>
            <time class="created-date">
              Created: {{ formatDate(entry.createdAt) }}
            </time>
          </div>
          
          <div class="entry-tags">
            <span 
              v-for="tag in entry.tags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="entry-actions">
          <BaseButton 
            variant="secondary"
            size="sm"
            @click="handleRestore(entry.id)"
          >
            Restore
          </BaseButton>
          <BaseButton 
            variant="ghost"
            size="sm"
            @click="handleHide(entry.id)"
          >
            Hide
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <div v-if="recentlyDeleted.length === 0" class="empty-state">
      <p>No recently deleted items</p>
    </div>
  </div>
</template>

<style scoped>
.recently-deleted-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  width: 100%;
}

.view-header {
  margin-bottom: var(--spacing-xl);
}

.header-content {
  margin-bottom: var(--spacing-md);
}

.subtitle {
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.search-bar {
  max-width: 600px;
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.entry-card {
  position: relative;
}

.entry-type-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: var(--surface-light);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.entry-preview {
  color: var(--text-secondary);
  margin: var(--spacing-sm) 0;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.entry-meta {
  margin: var(--spacing-md) 0;
}

.entry-dates {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

time {
  color: var(--text-disabled);
  font-size: 0.75rem;
}

.deleted-date {
  color: var(--status-error);
}

.entry-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.entry-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .recently-deleted-view {
    padding: var(--spacing-md);
  }
  
  .entry-actions {
    flex-direction: column;
  }
}
</style> 