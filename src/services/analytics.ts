import { useLogsStore } from '../stores/logs'
import type { JournalEntry } from '../stores/journal'

export interface AnalyticsData {
  timestamp: string
  metrics: {
    entries: {
      total: number
      active: number
      deleted: number
      hidden: number
      averageLength: number
      totalWords: number
    }
    tags: {
      total: number
      popular: Array<{ tag: string; count: number }>
      trending: Array<{ tag: string; growth: number }>
    }
    activity: {
      dailyEntries: number
      weeklyEntries: number
      monthlyEntries: number
      peakHours: Array<{ hour: number; count: number }>
    }
    ai: {
      promptsGenerated: number
      analysisRequested: number
      successRate: number
      averageResponseTime: number
    }
    search: {
      queries: Array<{ term: string; count: number }>
      averageResults: number
      noResultQueries: string[]
    }
  }
}

export class AnalyticsService {
  private static data: AnalyticsData | null = null

  static async collectMetrics(entries: JournalEntry[]): Promise<AnalyticsData> {
    const logsStore = useLogsStore()
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'analytics',
        action: 'collect_metrics',
        message: 'Starting metrics collection',
        status: 'pending'
      })

      const now = new Date()
      const metrics = {
        entries: this.analyzeEntries(entries),
        tags: this.analyzeTags(entries),
        activity: this.analyzeActivity(entries),
        ai: await this.analyzeAIUsage(),
        search: await this.analyzeSearchBehavior()
      }

      this.data = {
        timestamp: now.toISOString(),
        metrics
      }

      await logsStore.addLog({
        level: 'info',
        category: 'analytics',
        action: 'collect_metrics',
        message: 'Metrics collection completed',
        details: metrics,
        status: 'success'
      })

      return this.data
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'analytics',
        action: 'collect_metrics',
        message: 'Failed to collect metrics',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }

  private static analyzeEntries(entries: JournalEntry[]) {
    const totalWords = entries.reduce((sum, entry) => 
      sum + entry.content.split(/\s+/).length, 0
    )

    return {
      total: entries.length,
      active: entries.filter(e => e.state === 'active').length,
      deleted: entries.filter(e => e.state === 'recently_deleted').length,
      hidden: entries.filter(e => e.state === 'hidden').length,
      averageLength: totalWords / entries.length || 0,
      totalWords
    }
  }

  private static analyzeTags(entries: JournalEntry[]) {
    const tagCounts = new Map<string, number>()
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const popular = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // Calculate tag growth over last week
    const trending = this.calculateTagTrends(entries)

    return {
      total: tagCounts.size,
      popular,
      trending
    }
  }

  private static calculateTagTrends(entries: JournalEntry[]) {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentTagCounts = new Map<string, number>()
    const oldTagCounts = new Map<string, number>()

    entries.forEach(entry => {
      const entryDate = new Date(entry.createdAt)
      const countMap = entryDate > weekAgo ? recentTagCounts : oldTagCounts

      entry.tags.forEach(tag => {
        countMap.set(tag, (countMap.get(tag) || 0) + 1)
      })
    })

    const trends = Array.from(recentTagCounts.keys()).map(tag => {
      const recentCount = recentTagCounts.get(tag) || 0
      const oldCount = oldTagCounts.get(tag) || 0
      const growth = oldCount ? (recentCount - oldCount) / oldCount : 1

      return { tag, growth }
    })

    return trends
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5)
  }

  private static analyzeActivity(entries: JournalEntry[]) {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const hourCounts = new Map<number, number>()
    entries.forEach(entry => {
      const date = new Date(entry.createdAt)
      const hour = date.getHours()
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    })

    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour, count }))

    return {
      dailyEntries: entries.filter(e => new Date(e.createdAt) > dayAgo).length,
      weeklyEntries: entries.filter(e => new Date(e.createdAt) > weekAgo).length,
      monthlyEntries: entries.filter(e => new Date(e.createdAt) > monthAgo).length,
      peakHours
    }
  }

  private static async analyzeAIUsage() {
    const logsStore = useLogsStore()
    const aiLogs = logsStore.filteredLogs({
      category: ['ai']
    })

    const promptLogs = aiLogs.filter(log => log.action === 'generate_prompt')
    const analysisLogs = aiLogs.filter(log => log.action === 'analyze_entry')
    const successfulLogs = aiLogs.filter(log => log.status === 'success')

    const responseTimes = aiLogs
      .filter(log => log.metadata?.duration)
      .map(log => log.metadata?.duration || 0)

    return {
      promptsGenerated: promptLogs.length,
      analysisRequested: analysisLogs.length,
      successRate: (successfulLogs.length / aiLogs.length) * 100,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0
    }
  }

  private static async analyzeSearchBehavior() {
    const logsStore = useLogsStore()
    const searchLogs = logsStore.filteredLogs({
      category: ['user_action'],
      action: ['search']
    })

    const queryMap = new Map<string, number>()
    const noResultQueries = new Set<string>()

    searchLogs.forEach(log => {
      const query = log.details?.query
      if (query) {
        queryMap.set(query, (queryMap.get(query) || 0) + 1)
        if (log.details?.resultCount === 0) {
          noResultQueries.add(query)
        }
      }
    })

    const queries = Array.from(queryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }))

    const totalResults = searchLogs
      .reduce((sum, log) => sum + (log.details?.resultCount || 0), 0)

    return {
      queries,
      averageResults: totalResults / searchLogs.length || 0,
      noResultQueries: Array.from(noResultQueries)
    }
  }

  static getLatestMetrics(): AnalyticsData | null {
    return this.data
  }
} 