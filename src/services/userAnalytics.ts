import { useLogsStore } from '../stores/logs'
import type { LogEntry } from '../stores/logs'

export interface UserActivityMetrics {
  timestamp: string
  activeTime: number
  interactions: {
    total: number
    byType: Record<string, number>
  }
  navigation: {
    pathVisits: Record<string, number>
    averageTimePerPath: Record<string, number>
  }
  features: {
    journal: {
      entriesCreated: number
      entriesDeleted: number
      averageWordCount: number
      totalWords: number
    }
    ai: {
      promptsGenerated: number
      analysisRequested: number
      successRate: number
    }
  }
  errors: {
    total: number
    byCategory: Record<string, number>
  }
}

export class UserAnalyticsService {
  private static readonly ANALYSIS_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private static analysisTimer: number | null = null

  static async analyzeUserActivity(): Promise<UserActivityMetrics> {
    const logsStore = useLogsStore()
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'analytics',
        action: 'analyze_activity',
        message: 'Starting user activity analysis',
        status: 'pending'
      })

      const logs = logsStore.filteredLogs()
      const now = new Date()
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Filter recent logs
      const recentLogs = logs.filter(log => 
        new Date(log.timestamp) >= hourAgo
      )

      // Analyze interactions
      const interactions = this.analyzeInteractions(recentLogs)

      // Analyze navigation
      const navigation = this.analyzeNavigation(recentLogs)

      // Analyze features
      const features = this.analyzeFeatures(recentLogs)

      // Analyze errors
      const errors = this.analyzeErrors(recentLogs)

      const metrics: UserActivityMetrics = {
        timestamp: now.toISOString(),
        activeTime: this.calculateActiveTime(recentLogs),
        interactions,
        navigation,
        features,
        errors
      }

      await logsStore.addLog({
        level: 'info',
        category: 'analytics',
        action: 'analyze_activity',
        message: 'User activity analysis completed',
        details: metrics,
        status: 'success'
      })

      return metrics
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'analytics',
        action: 'analyze_activity',
        message: 'Failed to analyze user activity',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }

  private static analyzeInteractions(logs: LogEntry[]): UserActivityMetrics['interactions'] {
    const byType: Record<string, number> = {}
    
    logs.forEach(log => {
      if (log.category === 'user_action') {
        byType[log.action] = (byType[log.action] || 0) + 1
      }
    })

    return {
      total: logs.filter(log => log.category === 'user_action').length,
      byType
    }
  }

  private static analyzeNavigation(logs: LogEntry[]): UserActivityMetrics['navigation'] {
    const pathVisits: Record<string, number> = {}
    const pathTimes: Record<string, number[]> = {}
    
    logs.forEach(log => {
      if (log.category === 'navigation' && log.action === 'route_change') {
        const path = log.details?.to?.path
        if (path) {
          pathVisits[path] = (pathVisits[path] || 0) + 1
          
          if (log.metadata?.duration) {
            if (!pathTimes[path]) pathTimes[path] = []
            pathTimes[path].push(log.metadata.duration)
          }
        }
      }
    })

    const averageTimePerPath: Record<string, number> = {}
    Object.entries(pathTimes).forEach(([path, times]) => {
      averageTimePerPath[path] = times.reduce((a, b) => a + b, 0) / times.length
    })

    return {
      pathVisits,
      averageTimePerPath
    }
  }

  private static analyzeFeatures(logs: LogEntry[]): UserActivityMetrics['features'] {
    const journalLogs = logs.filter(log => log.category === 'journal')
    const aiLogs = logs.filter(log => log.category === 'ai')

    return {
      journal: {
        entriesCreated: journalLogs.filter(log => log.action === 'create_entry').length,
        entriesDeleted: journalLogs.filter(log => log.action === 'soft_delete').length,
        averageWordCount: this.calculateAverageWordCount(journalLogs),
        totalWords: this.calculateTotalWords(journalLogs)
      },
      ai: {
        promptsGenerated: aiLogs.filter(log => log.action === 'generate_prompt').length,
        analysisRequested: aiLogs.filter(log => log.action === 'analyze_entry').length,
        successRate: this.calculateAISuccessRate(aiLogs)
      }
    }
  }

  private static analyzeErrors(logs: LogEntry[]): UserActivityMetrics['errors'] {
    const errorLogs = logs.filter(log => log.level === 'error')
    const byCategory: Record<string, number> = {}

    errorLogs.forEach(log => {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1
    })

    return {
      total: errorLogs.length,
      byCategory
    }
  }

  private static calculateActiveTime(logs: LogEntry[]): number {
    // Implement active time calculation based on log timestamps
    return 0 // Placeholder
  }

  private static calculateAverageWordCount(logs: LogEntry[]): number {
    const wordCounts = logs
      .filter(log => log.action === 'create_entry' && log.details?.word_count)
      .map(log => {
        if (!log.details || typeof log.details.word_count !== 'number') return 0;
        return log.details.word_count;
      });

    return wordCounts.length ? 
      wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 
      0;
  }

  private static calculateTotalWords(logs: LogEntry[]): number {
    return logs
      .filter(log => log.action === 'create_entry' && log.details?.word_count)
      .reduce((total, log) => {
        if (!log.details || typeof log.details.word_count !== 'number') return total;
        return total + log.details.word_count;
      }, 0);
  }

  private static calculateAISuccessRate(logs: LogEntry[]): number {
    const aiRequests = logs.filter(log => 
      log.action === 'analyze_entry' || 
      log.action === 'generate_prompt'
    )

    if (!aiRequests.length) return 0

    const successfulRequests = aiRequests.filter(log => log.status === 'success')
    return (successfulRequests.length / aiRequests.length) * 100
  }

  static startAnalysis() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
    }

    this.analysisTimer = setInterval(async () => {
      await this.analyzeUserActivity()
    }, this.ANALYSIS_INTERVAL)

    // Run initial analysis
    this.analyzeUserActivity()
  }

  static stopAnalysis() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
      this.analysisTimer = null
    }
  }
} 