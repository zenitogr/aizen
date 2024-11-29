import { defineStore } from 'pinia'
import { Storage } from '../utils/storage'

export type LogLevel = 'info' | 'warning' | 'error' | 'debug'
export type LogCategory = 
  | 'storage' 
  | 'journal' 
  | 'auth' 
  | 'ai' 
  | 'system'
  | 'navigation'
  | 'user_action'
  | 'state_change'
  | 'performance'
  | 'analytics'
  | 'health'
  | 'backup'
  | 'security'
  | 'error'
  | 'search'

export interface LogMetadata {
  component?: string;
  duration?: number;
  memoryUsage?: number;
  route?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  action: string
  message: string
  details?: {
    query?: string
    resultCount?: number
    [key: string]: any
  }
  status: 'success' | 'failure' | 'pending'
  error?: string
  metadata?: LogMetadata
}

interface LogState {
  entries: LogEntry[]
  maxEntries: number
  initialized: boolean
  retentionDays: number
}

interface FilterOptions {
  level?: LogLevel[]
  category?: LogCategory[]
  status?: ('success' | 'failure' | 'pending')[]
  search?: string
  startDate?: string
  endDate?: string
  action?: string[]
}

export const useLogsStore = defineStore('logs', {
  state: (): LogState => ({
    entries: [],
    maxEntries: 1000,
    initialized: false,
    retentionDays: 7
  }),

  getters: {
    filteredLogs: (state) => {
      return (options?: FilterOptions) => {
        let filtered = state.entries

        if (options?.level?.length) {
          filtered = filtered.filter(log => options.level?.includes(log.level))
        }

        if (options?.category?.length) {
          filtered = filtered.filter(log => options.category?.includes(log.category))
        }

        if (options?.status?.length) {
          filtered = filtered.filter(log => options.status?.includes(log.status))
        }

        if (options?.action?.length) {
          filtered = filtered.filter(log => options.action?.includes(log.action))
        }

        if (options?.search) {
          const search = options.search.toLowerCase()
          filtered = filtered.filter(log => 
            log.message.toLowerCase().includes(search) ||
            log.action.toLowerCase().includes(search) ||
            (log.error && log.error.toLowerCase().includes(search))
          )
        }

        if (options?.startDate) {
          filtered = filtered.filter(log => 
            new Date(log.timestamp) >= new Date(options.startDate!)
          )
        }

        if (options?.endDate) {
          filtered = filtered.filter(log => 
            new Date(log.timestamp) <= new Date(options.endDate!)
          )
        }

        return filtered.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }
    }
  },

  actions: {
    async initialize() {
      if (this.initialized) return

      const savedLogs = await Storage.load('app-logs')
      if (savedLogs && Array.isArray(savedLogs)) {
        this.entries = savedLogs
      }
      this.initialized = true
    },

    async addLog(log: Omit<LogEntry, 'id' | 'timestamp'>) {
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...log
      }

      this.entries.unshift(newLog)

      // Trim old logs if exceeding maxEntries
      if (this.entries.length > this.maxEntries) {
        this.entries = this.entries.slice(0, this.maxEntries)
      }

      await Storage.save('app-logs', this.entries)
      return newLog
    },

    async clearLogs() {
      this.entries = []
      await Storage.save('app-logs', this.entries)
    },

    async exportLogs() {
      return JSON.stringify(this.entries, null, 2)
    },

    async cleanupOldLogs() {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      this.entries = this.entries.filter(entry => 
        new Date(entry.timestamp) > cutoffDate
      );

      await Storage.save('app-logs', this.entries);
    },

    async exportLogsToFile() {
      const exportData = {
        timestamp: new Date().toISOString(),
        entries: this.entries,
        metadata: {
          totalEntries: this.entries.length,
          dateRange: {
            start: this.entries[this.entries.length - 1]?.timestamp,
            end: this.entries[0]?.timestamp
          }
        }
      };

      return JSON.stringify(exportData, null, 2);
    }
  }
}) 