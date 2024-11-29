import { useLogsStore } from '../stores/logs'

export interface ErrorDetails {
  error: Error | unknown
  component?: string
  action?: string
  metadata?: Record<string, any>
  context?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export class ErrorTrackingService {
  static readonly ERROR_CATEGORIES = {
    NETWORK: 'network',
    STORAGE: 'storage',
    VALIDATION: 'validation',
    RUNTIME: 'runtime',
    AI: 'ai',
    SYSTEM: 'system',
    USER: 'user'
  } as const

  static async trackError(details: ErrorDetails) {
    const logsStore = useLogsStore()
    const errorMessage = details.error instanceof Error ? details.error.message : String(details.error)
    const errorStack = details.error instanceof Error ? details.error.stack : undefined

    try {
      await logsStore.addLog({
        level: 'error',
        category: 'error',
        action: details.action || 'error_occurred',
        message: errorMessage,
        error: errorMessage,
        details: {
          component: details.component,
          stack: errorStack,
          metadata: details.metadata,
          context: details.context,
          severity: details.severity || 'medium',
          timestamp: new Date().toISOString(),
          category: this.determineErrorCategory(details)
        },
        status: 'failure'
      })

      // Track additional error context if available
      if (details.metadata?.userId || details.metadata?.sessionId) {
        await logsStore.addLog({
          level: 'info',
          category: 'error',
          action: 'error_context',
          message: 'Additional error context',
          details: {
            userId: details.metadata.userId,
            sessionId: details.metadata.sessionId,
            errorId: crypto.randomUUID()
          },
          status: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to track error:', error)
    }
  }

  private static determineErrorCategory(details: ErrorDetails): keyof typeof ErrorTrackingService.ERROR_CATEGORIES {
    if (details.error instanceof TypeError || details.error instanceof ReferenceError) {
      return 'RUNTIME'
    }
    if (details.context?.includes('network') || details.error instanceof TypeError && details.error.message.includes('fetch')) {
      return 'NETWORK'
    }
    if (details.context?.includes('storage') || details.component?.includes('storage')) {
      return 'STORAGE'
    }
    if (details.context?.includes('ai') || details.component?.includes('ai')) {
      return 'AI'
    }
    if (details.context?.includes('validation') || details.action?.includes('validate')) {
      return 'VALIDATION'
    }
    if (details.context?.includes('user') || details.action?.includes('user')) {
      return 'USER'
    }
    return 'SYSTEM'
  }

  static async handleGlobalError(error: Error, component?: string) {
    await this.trackError({
      error,
      component,
      action: 'global_error',
      severity: 'high',
      context: 'global_error_handler'
    })
  }

  static async handlePromiseRejection(event: PromiseRejectionEvent, component?: string) {
    await this.trackError({
      error: event.reason,
      component,
      action: 'unhandled_rejection',
      severity: 'high',
      context: 'promise_rejection_handler'
    })
  }

  static async handleNetworkError(error: Error, request?: Request) {
    await this.trackError({
      error,
      action: 'network_error',
      severity: 'medium',
      context: 'network',
      metadata: {
        url: request?.url,
        method: request?.method,
        headers: Object.fromEntries(request?.headers || [])
      }
    })
  }

  static async handleStorageError(error: Error, operation: string, key?: string) {
    await this.trackError({
      error,
      action: 'storage_error',
      severity: 'high',
      context: 'storage',
      metadata: {
        operation,
        key,
        timestamp: new Date().toISOString()
      }
    })
  }

  static async handleValidationError(error: Error, data?: any) {
    await this.trackError({
      error,
      action: 'validation_error',
      severity: 'low',
      context: 'validation',
      metadata: {
        invalidData: data,
        timestamp: new Date().toISOString()
      }
    })
  }

  static async handleAIError(error: Error, operation: string) {
    await this.trackError({
      error,
      action: 'ai_error',
      severity: 'medium',
      context: 'ai',
      metadata: {
        operation,
        timestamp: new Date().toISOString()
      }
    })
  }

  static setupGlobalHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error)
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event)
    })

    // Return cleanup function
    return () => {
      window.removeEventListener('error', (event) => {
        this.handleGlobalError(event.error)
      })
      window.removeEventListener('unhandledrejection', (event) => {
        this.handlePromiseRejection(event)
      })
    }
  }
} 