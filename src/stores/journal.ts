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

      const logsStore = useLogsStore()
      try {
        const savedEntries = await Storage.load('journal-entries')
        console.log('Loaded entries from storage:', savedEntries?.map(e => ({
          id: e.id,
          title: e.title,
          state: e.state,
          deletedAt: e.deletedAt
        })));
        
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
          
          this.initialized = true
          
          // Remove checkDeletedEntries call from here since it might be causing issues
          // await this.checkDeletedEntries()
        } else {
          this.entries = []
          this.initialized = true
        }

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
      }
    },

    async softDeleteEntry(id: string) {
      const logsStore = useLogsStore()
      console.log('Soft deleting entry:', id);
      console.log('Entry state before deletion:', this.entries.find(e => e.id === id)?.state);
      
      await logsStore.addLog({
        level: 'info',
        category: 'journal',
        action: 'soft_delete',
        message: `Attempting to soft delete entry: ${id}`,
        status: 'pending'
      })

      const index = this.entries.findIndex(e => e.id === id)
      
      if (index !== -1) {
        const entry = this.entries[index]
        const toastStore = useToastStore()
        const previousState = entry.state
        
        // Create a new array to ensure reactivity
        this.entries = [
          ...this.entries.slice(0, index),
          {
            ...entry,
            state: 'recently_deleted',
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          ...this.entries.slice(index + 1)
        ]

        await this.saveState()
        await logsStore.addLog({
          level: 'info',
          category: 'journal',
          action: 'soft_delete',
          message: `Successfully soft deleted entry: ${entry.title}`,
          details: { entryId: id, title: entry.title },
          status: 'success'
        })

        // Set up auto-hide after 30 days
        const timeoutId = setTimeout(async () => {
          const currentIndex = this.entries.findIndex(e => e.id === id)
          if (currentIndex !== -1 && this.entries[currentIndex].state === 'recently_deleted') {
            this.entries = [
              ...this.entries.slice(0, currentIndex),
              {
                ...this.entries[currentIndex],
                state: 'hidden',
                updatedAt: new Date().toISOString()
              },
              ...this.entries.slice(currentIndex + 1)
            ]
            await this.saveState()
          }
        }, this.recentlyDeletedTimeout)

        // Show undo toast
        toastStore.showUndoToast(
          `"${entry.title}" moved to Recently Deleted`,
          async () => {
            const currentIndex = this.entries.findIndex(e => e.id === id)
            if (currentIndex !== -1) {
              this.entries = [
                ...this.entries.slice(0, currentIndex),
                {
                  ...this.entries[currentIndex],
                  state: previousState,
                  deletedAt: undefined,
                  updatedAt: new Date().toISOString()
                },
                ...this.entries.slice(currentIndex + 1)
              ]
              clearTimeout(timeoutId)
              await this.saveState()
            }
          }
        )
      } else {
        await logsStore.addLog({
          level: 'error',
          category: 'journal',
          action: 'soft_delete',
          message: `Entry not found: ${id}`,
          status: 'failure'
        })
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
          text: `"${entry.title}" restored`,
          type: 'success'
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
          text: `"${entry.title}" moved to Hidden`,
          type: 'info'
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