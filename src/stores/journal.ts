import { defineStore } from 'pinia'
import { useToastStore } from './toast'
import { useLogsStore } from './logs'
import { Storage } from '../utils/storage'

export type DeletionState = 'active' | 'recently_deleted' | 'hidden'
export type EntryType = 'journal' | 'memory' | 'mindfulness'

export interface JournalEntry {
  id: string
  title: string
  content: string
  type: EntryType
  createdAt: string
  updatedAt: string
  deletedAt?: string
  state: DeletionState
  tags: string[]
  mood?: string
  aiAnalysis?: {
    topics: string[]
    sentiment: string
    insights: string[]
  }
}

interface JournalState {
  entries: JournalEntry[]
  isEditing: boolean
  currentEntryId: string | null
  recentlyDeletedTimeout: number
  initialized: boolean
}

export const useJournalStore = defineStore('journal', {
  state: (): JournalState => ({
    entries: [],
    isEditing: false,
    currentEntryId: null,
    recentlyDeletedTimeout: 30 * 24 * 60 * 60 * 1000,
    initialized: false
  }),

  getters: {
    activeEntries(): JournalEntry[] {
      return this.entries.filter(entry => !entry.state || entry.state === 'active')
    },

    recentlyDeletedEntries(): JournalEntry[] {
      const entries = this.entries.filter(entry => entry.state === 'recently_deleted');
      console.log('Recently deleted entries getter:', entries.map(e => ({
        id: e.id,
        title: e.title,
        state: e.state,
        deletedAt: e.deletedAt
      })));
      return entries;
    },

    hiddenEntries(): JournalEntry[] {
      return this.entries.filter(entry => entry.state === 'hidden')
    },

    currentEntry(): JournalEntry | null {
      if (!this.currentEntryId) return null
      return this.entries.find(entry => entry.id === this.currentEntryId) || null
    }
  },

  actions: {
    setEditing(isEditing: boolean, entryId: string | null = null) {
      this.isEditing = isEditing
      this.currentEntryId = entryId
    },

    async initialize() {
      if (this.initialized) {
        console.log('Store already initialized, skipping')
        return
      }

      console.log('Initializing journal store...')
      
      try {
        const savedEntries = await Storage.load('journal-entries')
        console.log('Loaded entries from storage:', 
          Array.isArray(savedEntries) ? savedEntries.map((e: JournalEntry) => ({
            id: e.id,
            title: e.title,
            state: e.state,
          })) : []
        );
        
        if (savedEntries && Array.isArray(savedEntries)) {
          this.entries = savedEntries.map(entry => {
            const mappedEntry = {
              ...entry,
              state: entry.state || 'active'
            }
            console.log(`Mapping entry ${entry.id}:`, {
              before: entry.state,
              after: mappedEntry.state
            });
            return mappedEntry;
          })
        } else {
          this.entries = []
        }
        
        this.initialized = true
        console.log('Journal store initialized with entries:', this.entries.length)
        
      } catch (error) {
        console.error('Failed to initialize:', error)
        this.entries = []
        this.initialized = true
      }
    },

    async saveState() {
      console.log('Before saving state:', this.entries.map(e => ({
        id: e.id,
        title: e.title,
        state: e.state,
        deletedAt: e.deletedAt
      })));
      
      try {
        await Storage.save('journal-entries', this.entries)
        console.log('After saving state:', await Storage.load('journal-entries'));
      } catch (error) {
        console.error('Failed to save journal state:', error)
      }
    },

    async createEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'state' | 'type'>) {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        type: 'journal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        state: 'active',
        ...entry
      }
      
      this.entries.push(newEntry)
      await this.saveState()
      return newEntry
    },

    async updateEntry(id: string, updates: Partial<JournalEntry>) {
      const entry = this.entries.find(e => e.id === id)
      if (entry) {
        Object.assign(entry, {
          ...updates,
          updatedAt: new Date().toISOString()
        })
        await this.saveState()
      }
    },

    async softDeleteEntry(entryId: string) {
      const entry = this.entries.find(e => e.id === entryId);
      if (!entry) return;

      // Set the deletedAt timestamp
      entry.deletedAt = new Date().toISOString();
      entry.state = 'recently_deleted';

      // Save the entry with its new status BEFORE marking it hidden
      await this.saveEntry(entry);

      const toastStore = useToastStore();
      toastStore.logEntryDeleted(entryId, entry.title || 'Untitled', new Date(entry.deletedAt || ''));

      // Don't automatically set to hidden - let the checkExpiredEntries handle that
      // or wait for manual user action
    },

    async checkExpiredEntries() {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      for (const entry of this.entries) {
        if (entry.state === 'recently_deleted' && entry.deletedAt) {
          if (new Date(entry.deletedAt) < oneMonthAgo) {
            entry.state = 'hidden';
            await this.saveEntry(entry);

            const toastStore = useToastStore();
            toastStore.logEntryHidden(entry.id, entry.title || 'Untitled', 'Expired after 30 days');
          }
        }
      }
    },

    async hideDeletedEntry(entryId: string) {
      const entry = this.entries.find(e => e.id === entryId);
      if (!entry) return;

      entry.state = 'hidden';
      await this.saveEntry(entry);

      const toastStore = useToastStore();
      toastStore.logEntryHidden(entryId, entry.title || 'Untitled', 'Manually hidden');
    },

    async saveEntry(entry: JournalEntry) {
      // Ensure we're working with a copy to prevent state mutations during save
      const entryToSave = { ...entry };
      
      // Log the state before save
      console.log('Saving entry with status:', entryToSave.state);
      
      try {
        // Update the store state FIRST
        const index = this.entries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          this.entries[index] = entryToSave;
        } else {
          this.entries.push(entryToSave);
        }

        // Save both the individual entry and the full state
        await Promise.all([
          Storage.save(`entry:${entry.id}`, entryToSave),
          this.saveState()  // Add this to ensure the main journal-entries storage is updated
        ]);
        
        // Log the state after save
        console.log('Entry saved with status:', entryToSave.state);
      } catch (error) {
        console.error('Error saving entry:', error);
        throw error;
      }
    },

    async restoreEntry(id: string) {
      const logsStore = useLogsStore()
      const entry = this.entries.find(e => e.id === id)
      
      if (entry) {
        await logsStore.addLog({
          level: 'info',
          category: 'journal',
          action: 'restore_entry',
          message: `Restoring entry: ${entry.title}`,
          status: 'pending'
        })

        const index = this.entries.findIndex(e => e.id === id)
        
        // Create a new array to ensure reactivity
        this.entries = [
          ...this.entries.slice(0, index),
          {
            ...entry,
            state: 'active',
            deletedAt: undefined,
            updatedAt: new Date().toISOString()
          },
          ...this.entries.slice(index + 1)
        ]

        await this.saveState()
        
        await logsStore.addLog({
          level: 'info',
          category: 'journal',
          action: 'restore_entry',
          message: `Successfully restored entry: ${entry.title}`,
          details: { entryId: id, title: entry.title },
          status: 'success'
        })

        const toastStore = useToastStore()
        toastStore.showToast({
          message: `"${entry.title}" restored`,
          type: 'success',
          timestamp: Date.now()
        })
      }
    },

    async hideEntry(id: string) {
      const logsStore = useLogsStore()
      const entry = this.entries.find(e => e.id === id)
      
      if (entry) {
        await logsStore.addLog({
          level: 'info',
          category: 'journal',
          action: 'hide_entry',
          message: `Hiding entry: ${entry.title}`,
          status: 'pending'
        })

        const index = this.entries.findIndex(e => e.id === id)
        
        // Create a new array to ensure reactivity
        this.entries = [
          ...this.entries.slice(0, index),
          {
            ...entry,
            state: 'hidden',
            updatedAt: new Date().toISOString()
          },
          ...this.entries.slice(index + 1)
        ]

        await this.saveState()
        
        await logsStore.addLog({
          level: 'info',
          category: 'journal',
          action: 'hide_entry',
          message: `Successfully hid entry: ${entry.title}`,
          details: { entryId: id, title: entry.title },
          status: 'success'
        })

        const toastStore = useToastStore()
        toastStore.showToast({
          message: `"${entry.title}" moved to Hidden`,
          type: 'info',
          timestamp: Date.now()
        })
      }
    },

    async checkDeletedEntries() {
      console.log('Starting checkDeletedEntries');
      console.log('Current entries:', this.entries.map(e => ({
        id: e.id,
        title: e.title,
        state: e.state,
        deletedAt: e.deletedAt
      })));

      const now = new Date().getTime()
      const entriesToHide = this.entries.filter(entry => {
        if (entry.state === 'recently_deleted' && entry.deletedAt) {
          const deletedAt = new Date(entry.deletedAt).getTime()
          const daysSinceDeleted = (now - deletedAt) / (1000 * 60 * 60 * 24)
          console.log(`Entry ${entry.id} state:${entry.state} deleted:${daysSinceDeleted} days ago`)
          return daysSinceDeleted > 30
        }
        return false
      })

      console.log('Entries to hide:', entriesToHide);

      for (const entry of entriesToHide) {
        await this.hideEntry(entry.id)
      }
    }
  }
})

// Modified initialization approach
export const initJournalStore = async () => {
  const store = useJournalStore()
  if (!store.initialized) {
    await store.initialize()
  }
  return store
}

// Add a composable to ensure store is initialized
export const useInitializedJournalStore = async () => {
  const store = useJournalStore()
  if (!store.initialized) {
    await store.initialize()
  }
  return store
} 