import { defineStore } from 'pinia'

export interface SearchFilters {
  tags: string[]
  type?: string
  dateRange?: {
    start: string
    end: string
  }
}

interface SearchState {
  query: string
  filters: SearchFilters
  isSearching: boolean
}

export const useSearchStore = defineStore('search', {
  state: (): SearchState => ({
    query: '',
    filters: {
      tags: []
    },
    isSearching: false
  }),

  getters: {
    hasActiveFilters(state): boolean {
      return state.filters.tags.length > 0 || 
        !!state.filters.type || 
        !!(state.filters.dateRange?.start && state.filters.dateRange?.end);
    }
  },

  actions: {
    setQuery(query: string) {
      this.query = query
    },

    addTag(tag: string) {
      if (!this.filters.tags.includes(tag)) {
        this.filters.tags.push(tag)
      }
    },

    removeTag(tag: string) {
      const index = this.filters.tags.indexOf(tag)
      if (index !== -1) {
        this.filters.tags.splice(index, 1)
      }
    },

    setDateRange(start: string, end: string) {
      this.filters.dateRange = { start, end }
    },

    clearDateRange() {
      this.filters.dateRange = undefined
    },

    setType(type: string | undefined) {
      this.filters.type = type
    },

    clearFilters() {
      this.filters = {
        tags: []
      }
    },

    clearAll() {
      this.query = ''
      this.clearFilters()
    }
  }
}) 