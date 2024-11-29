import { useLogsStore } from '../stores/logs'
import { Storage } from '../utils/storage'

export interface SessionData {
  sessionId: string
  startTime: string
  lastActive: string
  userAgent: string
  screenSize: {
    width: number
    height: number
  }
  interactions: number
  views: string[]
  performance: {
    loadTime: number
    interactions: number
    errors: number
  }
}

export class SessionTrackingService {
  private static currentSession: SessionData | null = null
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static activityTimeout: number | null = null
  private static readonly STORAGE_KEY = 'current-session'

  static async startSession() {
    const logsStore = useLogsStore()
    
    try {
      this.currentSession = {
        sessionId: crypto.randomUUID(),
        startTime: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        interactions: 0,
        views: [],
        performance: {
          loadTime: performance.now(),
          interactions: 0,
          errors: 0
        }
      }

      await logsStore.addLog({
        level: 'info',
        category: 'system',
        action: 'session_start',
        message: 'New session started',
        details: this.currentSession,
        status: 'success',
        metadata: {
          sessionId: this.currentSession.sessionId
        }
      })

      // Save session to storage
      await Storage.save(this.STORAGE_KEY, this.currentSession)

      this.setupActivityTracking()
      return this.currentSession
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'system',
        action: 'session_start',
        message: 'Failed to start session',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }

  private static setupActivityTracking() {
    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll']
    
    const handleActivity = async () => {
      if (this.currentSession) {
        this.currentSession.lastActive = new Date().toISOString()
        this.currentSession.interactions++
        this.currentSession.performance.interactions++
        
        // Reset timeout
        if (this.activityTimeout) {
          clearTimeout(this.activityTimeout)
        }
        
        this.activityTimeout = window.setTimeout(() => {
          this.endSession('inactivity')
        }, this.SESSION_TIMEOUT)

        // Save updated session
        await Storage.save(this.STORAGE_KEY, this.currentSession)
      }
    }

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity)
    })
  }

  static async trackView(route: string) {
    const logsStore = useLogsStore()
    
    if (this.currentSession) {
      this.currentSession.views.push(route)
      await Storage.save(this.STORAGE_KEY, this.currentSession)
      
      await logsStore.addLog({
        level: 'info',
        category: 'navigation',
        action: 'view_tracked',
        message: `User visited: ${route}`,
        details: {
          route,
          viewCount: this.currentSession.views.length
        },
        status: 'success',
        metadata: {
          sessionId: this.currentSession.sessionId
        }
      })
    }
  }

  static async trackError() {
    if (this.currentSession) {
      this.currentSession.performance.errors++
      await Storage.save(this.STORAGE_KEY, this.currentSession)
    }
  }

  static async endSession(reason: string = 'normal') {
    const logsStore = useLogsStore()
    
    if (this.currentSession) {
      const sessionDuration = new Date().getTime() - new Date(this.currentSession.startTime).getTime()
      
      await logsStore.addLog({
        level: 'info',
        category: 'system',
        action: 'session_end',
        message: 'Session ended',
        details: {
          ...this.currentSession,
          duration: sessionDuration,
          reason
        },
        status: 'success',
        metadata: {
          sessionId: this.currentSession.sessionId
        }
      })

      // Archive session
      await Storage.save(`session-${this.currentSession.sessionId}`, {
        ...this.currentSession,
        endTime: new Date().toISOString(),
        duration: sessionDuration,
        reason
      })

      // Clear current session
      await Storage.remove(this.STORAGE_KEY)

      if (this.activityTimeout) {
        clearTimeout(this.activityTimeout)
      }

      this.currentSession = null
    }
  }

  static getCurrentSession(): SessionData | null {
    return this.currentSession
  }

  static async getSessionMetrics(): Promise<{
    duration: number
    interactionsPerMinute: number
    errorRate: number
    uniqueViews: number
  }> {
    if (!this.currentSession) return {
      duration: 0,
      interactionsPerMinute: 0,
      errorRate: 0,
      uniqueViews: 0
    }

    const duration = new Date().getTime() - new Date(this.currentSession.startTime).getTime()
    const durationMinutes = duration / (1000 * 60)

    return {
      duration,
      interactionsPerMinute: this.currentSession.interactions / durationMinutes,
      errorRate: this.currentSession.performance.errors / this.currentSession.interactions,
      uniqueViews: new Set(this.currentSession.views).size
    }
  }

  static async resumeSession() {
    try {
      const savedSession = await Storage.load(this.STORAGE_KEY)
      if (savedSession) {
        this.currentSession = savedSession
        this.setupActivityTracking()
        return true
      }
      return false
    } catch {
      return false
    }
  }
} 