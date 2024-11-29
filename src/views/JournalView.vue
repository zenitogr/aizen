<script setup lang="ts">
import { ref, computed } from 'vue';
import { useJournalStore } from '../stores/journal';
import { useSearchStore } from '../stores/search';
import JournalEditor from '../components/journal/JournalEditor.vue';
import SearchBar from '../components/search/SearchBar.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import HighlightedText from '../components/base/HighlightedText.vue';
import { useAppStore } from '../stores/app';

const journalStore = useJournalStore();
const searchStore = useSearchStore();
const appStore = useAppStore();

const showEditor = computed(() => journalStore.isEditing);
const currentEntry = computed(() => journalStore.currentEntry);

// Make sure we have entries before filtering
const filteredEntries = computed(() => {
  const entries = journalStore.activeEntries;
  if (!entries || !Array.isArray(entries)) return [];
  if (!searchStore.query) return entries;
  
  const query = searchStore.query.toLowerCase();
  return entries.filter(entry => 
    entry?.title?.toLowerCase().includes(query) ||
    entry?.content?.toLowerCase().includes(query) ||
    entry?.tags?.some(tag => tag.toLowerCase().includes(query))
  );
});

function handleNewEntry() {
  journalStore.setEditing(true, null);
}

function handleEditEntry(entryId: string) {
  journalStore.setEditing(true, entryId);
}

async function handleSaveEntry(data: { title: string; content: string; tags?: string[] }) {
  if (currentEntry.value) {
    await journalStore.updateEntry(currentEntry.value.id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } else {
    await journalStore.createEntry({
      title: data.title,
      content: data.content,
      tags: data.tags || []
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
        :initial-tags="currentEntry?.tags"
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

      <div v-if="appStore.isLoading" class="loading-state">
        <p>Loading entries...</p>
      </div>
      <div v-else>
        <div class="entries-grid" v-if="filteredEntries.length > 0">
          <BaseCard 
            v-for="entry in filteredEntries" 
            :key="entry.id"
            variant="elevated"
            class="entry-card"
            @click="handleEditEntry(entry.id)"
          >
            <div class="entry-header">
              <h3>
                <HighlightedText 
                  :text="entry.title"
                  :query="searchStore.query"
                />
              </h3>
              <BaseButton 
                variant="ghost"
                size="sm"
                class="delete-button"
                @click="(e) => handleDeleteClick(e, entry.id)"
              >
                ×
              </BaseButton>
            </div>

            <p class="entry-preview">
              <HighlightedText 
                :text="entry.content.slice(0, 150) + '...'"
                :query="searchStore.query"
              />
            </p>

            <div class="entry-meta">
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
        <div v-else class="empty-state">
          <p>No journal entries yet</p>
        </div>
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
  margin-bottom: var(--spacing-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.entry-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-2px);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.delete-button {
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
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
  margin-top: var(--spacing-md);
}

time {
  color: var(--text-disabled);
  font-size: 0.75rem;
}

.entry-tags {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  flex-wrap: wrap;
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

.loading-state {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .journal-view {
    padding: var(--spacing-md);
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
}
</style> 