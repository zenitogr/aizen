<script setup lang="ts">
import { ref, computed } from 'vue';
import { useJournalStore } from '../stores/journal';
import { useToastStore } from '../stores/toast';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import JournalEditor from '../components/journal/JournalEditor.vue';

const journalStore = useJournalStore();
const toastStore = useToastStore();

const showEditor = computed(() => journalStore.isEditing);
const entries = computed(() => journalStore.sortedEntries);
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
        <h1>Journal</h1>
        <BaseButton @click="handleNewEntry">New Entry</BaseButton>
      </header>

      <div class="entries-grid">
        <BaseCard 
          v-for="entry in entries" 
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
          <h3>{{ entry.title }}</h3>
          <p class="entry-preview">{{ entry.content.slice(0, 150) }}...</p>
          <div class="entry-footer">
            <time>{{ formatDate(entry.createdAt) }}</time>
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
        </BaseCard>
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

@media (max-width: 768px) {
  .journal-view {
    padding: var(--spacing-md);
  }
  
  .view-header {
    margin-bottom: var(--spacing-lg);
  }
}
</style> 