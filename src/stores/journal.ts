import { defineStore } from 'pinia'

export interface JournalEntry {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
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
}

export const useJournalStore = defineStore('journal', {
  state: (): JournalState => ({
    entries: [],
    isEditing: false,
    currentEntryId: null
  }),

  getters: {
    sortedEntries: (state) => {
      return [...state.entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    },
    
    currentEntry: (state) => {
      return state.currentEntryId 
        ? state.entries.find(entry => entry.id === state.currentEntryId)
        : null
    }
  },

  actions: {
    async createEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

    async deleteEntry(id: string) {
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