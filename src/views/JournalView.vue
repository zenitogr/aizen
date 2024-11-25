<script setup lang="ts">
import { ref, computed } from 'vue';
import { useJournalStore } from '../stores/journal';
import { useSearchStore } from '../stores/search';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import JournalEditor from '../components/journal/JournalEditor.vue';
import SearchBar from '../components/search/SearchBar.vue';
import HighlightedText from '../components/base/HighlightedText.vue';

const journalStore = useJournalStore();
const searchStore = useSearchStore();

const showEditor = computed(() => journalStore.isEditing);

// Filter entries based on search and filters
const filteredEntries = computed(() => {
  let entries = journalStore.sortedEntries;
  const query = searchStore.query.toLowerCase();
  const filters = searchStore.filters;

  if (query) {
    entries = entries.filter(entry => 
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  if (filters.tags.length > 0) {
    entries = entries.filter(entry =>
      filters.tags.every(tag => entry.tags.includes(tag))
    );
  }

  if (filters.type) {
    entries = entries.filter(entry => entry.type === filters.type);
  }

  if (filters.dateRange?.start && filters.dateRange?.end) {
    entries = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt).getTime();
      const start = new Date(filters.dateRange!.start).getTime();
      const end = new Date(filters.dateRange!.end).getTime();
      return entryDate >= start && entryDate <= end;
    });
  }

  return entries;
});

const currentEntry = computed(() => journalStore.currentEntry);

function handleNewEntry() {
  journalStore.setEditing(true);
}

function handleEditEntry(entryId: string) {
  journalStore.setEditing(true, entryId);
}

async function handleSaveEntry({ title, content }: { title: string, content: string }) {
  if (currentEntry.value) {
    await journalStore.updateEntry(currentEntry.value.id, { title, content });
  } else {
    await journalStore.createEntry({ 
      title, 
      content,
      tags: [],
    });
  }
  journalStore.setEditing(false);
}

function handleCancel() {
  journalStore.setEditing(false);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function handleDeleteClick(event: Event, entryId: string) {
  event.stopPropagation();
  journalStore.softDeleteEntry(entryId);
}
</script>

<template>
  <div class="journal-view">
    <template v-if="showEditor">
      <JournalEditor
        :initial-title="currentEntry?.title"
        :initial-content="currentEntry?.content"
        @save="handleSaveEntry"
        @cancel="handleCancel"
      />
    </template>
    <template v-else>
      <header class="view-header">
        <div class="header-content">
          <h1>Journal</h1>
          <BaseButton @click="handleNewEntry">New Entry</BaseButton>
        </div>
        
        <SearchBar />
      </header>

      <div class="entries-grid">
        <BaseCard 
          v-for="entry in filteredEntries" 
          :key="entry.id"
          variant="elevated"
          class="entry-card"
          @click="handleEditEntry(entry.id)"
        >
          <div class="entry-actions">
            <BaseButton 
              variant="ghost"
              size="sm"
              class="delete-button"
              @click="(e) => handleDeleteClick(e, entry.id)"
            >
              ×
            </BaseButton>
          </div>
          <h3>
            <HighlightedText 
              :text="entry.title"
              :query="searchStore.query"
            />
          </h3>
          <p class="entry-preview">
            <HighlightedText 
              :text="entry.content.slice(0, 150) + '...'"
              :query="searchStore.query"
            />
          </p>
          <div class="entry-footer">
            <time>{{ formatDate(entry.createdAt) }}</time>
            <div class="entry-tags">
              <span 
                v-for="tag in entry.tags" 
                :key="tag"
                class="tag"
              >
                <HighlightedText 
                  :text="tag"
                  :query="searchStore.query"
                />
              </span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-if="filteredEntries.length === 0" class="empty-state">
        <p v-if="searchStore.query || searchStore.filters.tags.length > 0">
          No entries match your search criteria
        </p>
        <p v-else>
          No journal entries yet. Click "New Entry" to get started.
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.journal-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  width: 100%;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.entry-card {
  cursor: pointer;
  position: relative;
}

.entry-card:hover {
  transform: translateY(-2px);
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

.entry-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
}

time {
  color: var(--text-disabled);
  font-size: 0.75rem;
}

.entry-tags {
  display: flex;
  gap: var(--spacing-xs);
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.entry-actions {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  opacity: 0;
  transition: opacity 0.2s;
}

.entry-card:hover .entry-actions {
  opacity: 1;
}

.delete-button {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--status-error);
  border-color: var(--status-error);
}

.delete-button:hover {
  background: var(--status-error);
  color: var(--text-primary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .journal-view {
    padding: var(--spacing-md);
  }
  
  .view-header {
    margin-bottom: var(--spacing-lg);
  }

  .header-content {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
}
</style> 