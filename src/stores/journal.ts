import { defineStore } from 'pinia'
import { useToastStore } from './toast'

export type DeletionState = 'active' | 'recently_deleted' | 'hidden'

export interface JournalEntry {
  id: string
  title: string
  content: string
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
    recentlyDeletedTimeout: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  }),

  getters: {
    activeEntries(state): JournalEntry[] {
      return state.entries.filter(entry => entry.state === 'active')
    },

    recentlyDeletedEntries(state): JournalEntry[] {
      return state.entries.filter(entry => entry.state === 'recently_deleted')
    },

    hiddenEntries(state): JournalEntry[] {
      return state.entries.filter(entry => entry.state === 'hidden')
    },

    sortedEntries(state): JournalEntry[] {
      return state.entries
        .filter(entry => entry.state === 'active')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    
    currentEntry(state): JournalEntry | null {
      if (!state.currentEntryId) return null;
      return state.entries.find(entry => entry.id === state.currentEntryId) || null;
    }
  },

  actions: {
    async createEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'state'>) {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        state: 'active',
        ...entry
      }
      
      this.entries.push(newEntry)
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
      const entry = this.entries.find(e => e.id === id)
      if (entry) {
        const toastStore = useToastStore()
        const previousState = entry.state
        
        entry.state = 'recently_deleted'
        entry.deletedAt = new Date().toISOString()

        // Schedule move to hidden after timeout
        setTimeout(() => {
          if (entry.state === 'recently_deleted') {
            entry.state = 'hidden'
          }
        }, this.recentlyDeletedTimeout)

        // Show undo toast
        toastStore.showUndoToast(
          `"${entry.title}" moved to Recently Deleted`,
          () => {
            entry.state = previousState
            entry.deletedAt = undefined
          }
        )
      }
    },

    async restoreEntry(id: string) {
      const entry = this.entries.find(e => e.id === id)
      if (entry && entry.state !== 'active') {
        entry.state = 'active'
        entry.deletedAt = undefined
        entry.updatedAt = new Date().toISOString()
      }
    },

    async hideEntry(id: string) {
      const entry = this.entries.find(e => e.id === id)
      if (entry) {
        entry.state = 'hidden'
        entry.updatedAt = new Date().toISOString()
      }
    },

    async permanentlyDeleteEntry(id: string) {
      const index = this.entries.findIndex(e => e.id === id)
      if (index !== -1) {
        this.entries.splice(index, 1)
      }
    },

    setEditing(isEditing: boolean, entryId: string | null = null) {
      this.isEditing = isEditing
      this.currentEntryId = entryId
    }
  }
}) 