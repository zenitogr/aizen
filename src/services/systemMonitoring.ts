import { useLogsStore } from '../stores/logs'
import { Storage } from '../utils/storage'
import { BackupMonitoringService } from './backupMonitoring'
import { DataIntegrityService } from './dataIntegrity'

export interface SystemStatus {
  timestamp: string
  health: {
    storage: {
      available: boolean
      errors: string[]
      lastBackup?: string
    }
    data: {
      integrity: boolean
      lastCheck: string
      issues: string[]
    }
    performance: {
      memory: {
        used: number
        total: number
        limit: number
      }
      loadTime: number
      responseTime: number
    }
    services: {
      ai: boolean
      storage: boolean
      backup: boolean
    }
  }
}

export class SystemMonitoringService {
  private static monitoringInterval: number | null = null
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

  static async checkSystemStatus(): Promise<SystemStatus> {
    const logsStore = useLogsStore()
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'health',
        action: 'system_check',
        message: 'Starting system health check',
        status: 'pending'
      })

      // Check storage health
      const storageHealth = await this.checkStorageHealth()

      // Check data integrity
      const integrityResult = await DataIntegrityService.checkJournalEntries()

      // Check backup status
      const lastBackup = await BackupMonitoringService.getBackupHistory()
      const lastBackupStatus = lastBackup[0]

      // Check performance
      const performance = await this.checkPerformance()

      // Check services
      const services = await this.checkServices()

      const status: SystemStatus = {
        timestamp: new Date().toISOString(),
        health: {
          storage: {
            available: storageHealth.available,
            errors: storageHealth.errors,
            lastBackup: lastBackupStatus?.timestamp
          },
          data: {
            integrity: integrityResult.passed,
            lastCheck: integrityResult.timestamp,
            issues: integrityResult.errors
          },
          performance: {
            memory: {
              used: performance.memory.used,
              total: performance.memory.total,
              limit: performance.memory.limit
            },
            loadTime: performance.loadTime,
            responseTime: performance.responseTime
          },
          services
        }
      }

      await logsStore.addLog({
        level: 'info',
        category: 'health',
        action: 'system_check',
        message: 'System health check completed',
        details: status,
        status: 'success'
      })

      return status
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'health',
        action: 'system_check',
        message: 'System health check failed',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }

  private static async checkStorageHealth() {
    try {
      const testKey = `health-check-${Date.now()}`
      await Storage.save(testKey, { test: true })
      await Storage.load(testKey)
      await Storage.remove(testKey)
      return { available: true, errors: [] }
    } catch (error) {
      return {
        available: false,
        errors: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  private static async checkPerformance() {
    const memory = performance.memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    }

    return {
      memory: {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      },
      loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0,
      responseTime: performance.now()
    }
  }

  private static async checkServices() {
    return {
      ai: await this.checkAIService(),
      storage: await this.checkStorageService(),
      backup: await this.checkBackupService()
    }
  }

  private static async checkAIService() {
    try {
      // Implement AI service check
      return true
    } catch {
      return false
    }
  }

  private static async checkStorageService() {
    try {
      await Storage.load('test')
      return true
    } catch {
      return false
    }
  }

  private static async checkBackupService() {
    try {
      const backups = await BackupMonitoringService.getBackupHistory()
      return backups.length > 0
    } catch {
      return false
    }
  }

  static startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkSystemStatus()
    }, this.CHECK_INTERVAL)

    // Run initial check
    this.checkSystemStatus()
  }

  static stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }
} 