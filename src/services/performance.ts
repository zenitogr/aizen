import { useLogsStore } from '../stores/logs'

export interface PerformanceMetrics {
  componentRenderTime: number
  operationDuration: number
  memoryUsage?: number
  timestamp: string
  component?: string
  operation?: string
}

export class PerformanceService {
  private static metrics: Map<string, PerformanceMetrics[]> = new Map()
  private static readonly MAX_METRICS_PER_CATEGORY = 100

  static async trackOperation(category: string, operation: string, callback: () => Promise<any>) {
    const logsStore = useLogsStore()
    const start = performance.now()
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'performance',
        action: 'operation_start',
        message: `Starting operation: ${operation}`,
        details: { category, operation },
        status: 'pending'
      })

      const result = await callback()
      const duration = performance.now() - start

      const metric: PerformanceMetrics = {
        operationDuration: duration,
        componentRenderTime: 0,
        timestamp: new Date().toISOString(),
        operation
      }

      this.addMetric(category, metric)

      await logsStore.addLog({
        level: 'info',
        category: 'performance',
        action: 'operation_complete',
        message: `Operation completed: ${operation}`,
        details: {
          category,
          operation,
          duration,
          success: true
        },
        status: 'success'
      })

      return result
    } catch (error) {
      const duration = performance.now() - start

      await logsStore.addLog({
        level: 'error',
        category: 'performance',
        action: 'operation_failed',
        message: `Operation failed: ${operation}`,
        error: error instanceof Error ? error.message : String(error),
        details: {
          category,
          operation,
          duration
        },
        status: 'failure'
      })

      throw error
    }
  }

  static async trackComponentRender(component: string, renderCallback: () => Promise<void>) {
    const logsStore = useLogsStore()
    const start = performance.now()

    try {
      await renderCallback()
      const duration = performance.now() - start

      const metric: PerformanceMetrics = {
        componentRenderTime: duration,
        operationDuration: 0,
        timestamp: new Date().toISOString(),
        component
      }

      this.addMetric('component_renders', metric)

      if (duration > 100) { // Log slow renders
        await logsStore.addLog({
          level: 'warning',
          category: 'performance',
          action: 'slow_render',
          message: `Slow component render: ${component}`,
          details: {
            component,
            duration,
            threshold: 100
          },
          status: 'success'
        })
      }
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'performance',
        action: 'render_failed',
        message: `Component render failed: ${component}`,
        error: error instanceof Error ? error.message : String(error),
        details: { component },
        status: 'failure'
      })
      throw error
    }
  }

  private static addMetric(category: string, metric: PerformanceMetrics) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, [])
    }

    const metrics = this.metrics.get(category)!
    metrics.push(metric)

    // Trim old metrics if exceeding max
    if (metrics.length > this.MAX_METRICS_PER_CATEGORY) {
      metrics.splice(0, metrics.length - this.MAX_METRICS_PER_CATEGORY)
    }
  }

  static getMetrics(category?: string): Map<string, PerformanceMetrics[]> {
    if (category) {
      return new Map([[category, this.metrics.get(category) || []]])
    }
    return new Map(this.metrics)
  }

  static async analyzePerformance(): Promise<{
    slowOperations: PerformanceMetrics[]
    slowRenders: PerformanceMetrics[]
    averages: Record<string, number>
  }> {
    const logsStore = useLogsStore()

    try {
      await logsStore.addLog({
        level: 'info',
        category: 'performance',
        action: 'analyze_performance',
        message: 'Starting performance analysis',
        status: 'pending'
      })

      const allMetrics = Array.from(this.metrics.values()).flat()
      const slowOperations = allMetrics.filter(m => m.operationDuration > 1000)
      const slowRenders = allMetrics.filter(m => m.componentRenderTime > 100)

      const averages: Record<string, number> = {}
      this.metrics.forEach((metrics, category) => {
        const sum = metrics.reduce((acc, m) => acc + (m.operationDuration || m.componentRenderTime), 0)
        averages[category] = sum / metrics.length
      })

      const analysis = { slowOperations, slowRenders, averages }

      await logsStore.addLog({
        level: 'info',
        category: 'performance',
        action: 'analyze_performance',
        message: 'Performance analysis complete',
        details: analysis,
        status: 'success'
      })

      return analysis
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'performance',
        action: 'analyze_performance',
        message: 'Performance analysis failed',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }
} 