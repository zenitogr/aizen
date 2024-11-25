import { defineStore } from 'pinia'

interface TagCount {
  tag: string
  count: number
  lastUsed: string
}

interface TagsState {
  suggestions: string[]
  recentTags: string[]
  popularTags: TagCount[]
  customTags: string[]
  tagHistory: {
    [tag: string]: {
      count: number
      lastUsed: string
      firstUsed: string
      contexts: string[] // 'journal', 'memory', etc.
    }
  }
}

export const useTagsStore = defineStore('tags', {
  state: (): TagsState => ({
    suggestions: [
      'personal', 'work', 'ideas', 'goals', 'reflection',
      'meditation', 'gratitude', 'milestone', 'achievement',
      'learning', 'health', 'creativity', 'inspiration'
    ],
    recentTags: [],
    popularTags: [],
    customTags: [],
    tagHistory: {}
  }),

  getters: {
    allTags(): string[] {
      return [...new Set([
        ...this.suggestions,
        ...this.customTags
      ])];
    },

    getPopularTags(): TagCount[] {
      return Object.entries(this.tagHistory)
        .map(([tag, data]) => ({
          tag,
          count: data.count,
          lastUsed: data.lastUsed
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },

    getRecentTags(): string[] {
      return Object.entries(this.tagHistory)
        .sort((a, b) => new Date(b[1].lastUsed).getTime() - new Date(a[1].lastUsed).getTime())
        .map(([tag]) => tag)
        .slice(0, 5);
    },

    getTagSuggestions(): string[] {
      return [
        ...this.getRecentTags,
        ...this.getPopularTags.map(t => t.tag),
        ...this.suggestions
      ].filter((tag, index, self) => self.indexOf(tag) === index)
        .slice(0, 15);
    }
  },

  actions: {
    trackTagUsage(tag: string, context: string) {
      const now = new Date().toISOString();
      
      if (!this.tagHistory[tag]) {
        this.tagHistory[tag] = {
          count: 0,
          lastUsed: now,
          firstUsed: now,
          contexts: []
        };
      }

      this.tagHistory[tag].count++;
      this.tagHistory[tag].lastUsed = now;
      
      if (!this.tagHistory[tag].contexts.includes(context)) {
        this.tagHistory[tag].contexts.push(context);
      }

      // Update recent tags
      this.recentTags = this.getRecentTags;
      
      // Update popular tags
      this.popularTags = this.getPopularTags;
    },

    addCustomTag(tag: string) {
      const normalizedTag = tag.toLowerCase().trim();
      if (!this.customTags.includes(normalizedTag)) {
        this.customTags.push(normalizedTag);
      }
    },

    removeCustomTag(tag: string) {
      const index = this.customTags.indexOf(tag);
      if (index !== -1) {
        this.customTags.splice(index, 1);
      }
    }
  }
}); 