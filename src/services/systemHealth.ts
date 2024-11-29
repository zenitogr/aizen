import { useLogsStore } from '../stores/logs'

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

interface LogMetadata {
  component?: string;
  duration?: number;
  memoryUsage?: number;
  route?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export interface SystemHealthMetrics {
  timestamp: string
  memoryUsage: number
  activeUsers: number
  errorCount: number
  performanceMetrics: {
    apiLatency: number
    renderTime: number
    storageOperations: number
  }
  storageMetrics: {
    totalSize: number
    availableSpace: number
    backupStatus: 'success' | 'failure' | 'pending'
  }
}

export class SystemHealthService {
  private static async logHealthMetric(metric: string, value: unknown) {
    const logsStore = useLogsStore()
    
    await logsStore.addLog({
      level: 'info',
      category: 'health',
      action: 'health_metric',
      message: `System health metric: ${metric}`,
      details: { metric, value },
      status: 'success',
      metadata: {
        memoryUsage: performance.memory?.usedJSHeapSize,
        timestamp: new Date().toISOString()
      } as LogMetadata
    })
  }

  static async checkSystemHealth(): Promise<SystemHealthMetrics> {
    const logsStore = useLogsStore()
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'health',
        action: 'health_check',
        message: 'Starting system health check',
        status: 'pending'
      })

      const metrics: SystemHealthMetrics = {
        timestamp: new Date().toISOString(),
        memoryUsage: performance.memory?.usedJSHeapSize || 0,
        activeUsers: 1, // Implement actual user tracking
        errorCount: logsStore.entries.filter(log => log.level === 'error').length,
        performanceMetrics: {
          apiLatency: 0, // Implement actual metrics
          renderTime: 0,
          storageOperations: 0
        },
        storageMetrics: {
          totalSize: 0, // Implement actual metrics
          availableSpace: 0,
          backupStatus: 'pending'
        }
      }

      // Log individual metrics
      await this.logHealthMetric('memoryUsage', metrics.memoryUsage)
      await this.logHealthMetric('errorCount', metrics.errorCount)
      await this.logHealthMetric('apiLatency', metrics.performanceMetrics.apiLatency)

      await logsStore.addLog({
        level: 'info',
        category: 'health',
        action: 'health_check',
        message: 'System health check completed',
        details: metrics,
        status: 'success'
      })

      return metrics
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'health',
        action: 'health_check',
        message: 'System health check failed',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }

  static startHealthMonitoring(intervalMinutes: number = 5) {
    setInterval(() => {
      this.checkSystemHealth().catch(console.error)
    }, intervalMinutes * 60 * 1000)
  }
} 