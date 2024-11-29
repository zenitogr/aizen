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
}

export const useJournalStore = defineStore('journal', {
  state: (): JournalState => ({
    entries: [],
    isEditing: false,
    currentEntryId: null,
    recentlyDeletedTimeout: 30 * 24 * 60 * 60 * 1000
  }),

  getters: {
    activeEntries(): JournalEntry[] {
      return this.entries.filter(entry => !entry.state || entry.state === 'active')
    },

    recentlyDeletedEntries(): JournalEntry[] {
      return this.entries.filter(entry => entry.state === 'recently_deleted')
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
      const logsStore = useLogsStore()
      try {
        await logsStore.addLog({
          level: 'info',
          category: 'journal',
          action: 'initialize',
          message: 'Initializing journal store',
          status: 'pending'
        })

        const savedEntries = await Storage.load('journal-entries')
        
        if (savedEntries && Array.isArray(savedEntries)) {
          this.entries = [...savedEntries]
          await logsStore.addLog({
            level: 'info',
            category: 'journal',
            action: 'initialize',
            message: `Loaded ${savedEntries.length} entries`,
            details: { entryCount: savedEntries.length },
            status: 'success'
          })
        } else {
          this.entries = []
          await logsStore.addLog({
            level: 'warning',
            category: 'journal',
            action: 'initialize',
            message: 'No valid entries found, starting with empty array',
            status: 'success'
          })
        }
      } catch (error) {
        await logsStore.addLog({
          level: 'error',
          category: 'journal',
          action: 'initialize',
          message: 'Failed to initialize journal store',
          error: error instanceof Error ? error.message : String(error),
          status: 'failure'
        })
        this.entries = []
      }
    },

    async saveState() {
      console.log('Saving journal state:', this.entries)
      try {
        await Storage.save('journal-entries', this.entries)
        console.log('State saved successfully')
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
      const entry = this.entries.find(e => e.id === id);
      if (entry) {
        entry.state = 'active';
        entry.deletedAt = undefined;
        entry.updatedAt = new Date().toISOString();
        await this.saveState();
      }
    },

    async hideEntry(id: string) {
      const entry = this.entries.find(e => e.id === id);
      if (entry) {
        entry.state = 'hidden';
        entry.updatedAt = new Date().toISOString();
        await this.saveState();
      }
    }
  }
}) 