import { useLogsStore } from '../stores/logs'
import { Storage } from '../utils/storage'
import type { JournalEntry } from '../stores/journal'

export interface BackupStatus {
  timestamp: string
  status: 'success' | 'failure' | 'pending'
  backupSize: number
  entryCount: number
  lastBackupDate?: string
  errors: string[]
  verificationResult?: {
    passed: boolean
    mismatches: number
    details: string[]
  }
}

export class BackupMonitoringService {
  private static readonly BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
  private static backupTimer: number | null = null

  static async createBackup(): Promise<BackupStatus> {
    const logsStore = useLogsStore()
    const errors: string[] = []
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'backup',
        action: 'create_backup',
        message: 'Starting backup creation',
        status: 'pending'
      })

      // Get current entries
      const entries = await Storage.load('journal-entries')
      if (!entries || !Array.isArray(entries)) {
        throw new Error('No valid entries to backup')
      }

      // Create backup data
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        entries,
        metadata: {
          entryCount: entries.length,
          activeEntries: entries.filter(e => e.state === 'active').length,
          deletedEntries: entries.filter(e => e.state === 'recently_deleted').length,
          hiddenEntries: entries.filter(e => e.state === 'hidden').length
        }
      }

      // Save backup
      const backupId = `backup-${new Date().toISOString()}`
      await Storage.save(backupId, backupData)

      // Verify backup
      const verification = await this.verifyBackup(backupId, entries)

      const status: BackupStatus = {
        timestamp: new Date().toISOString(),
        status: verification.passed ? 'success' : 'failure',
        backupSize: JSON.stringify(backupData).length,
        entryCount: entries.length,
        errors,
        verificationResult: verification
      }

      await logsStore.addLog({
        level: verification.passed ? 'info' : 'error',
        category: 'backup',
        action: 'create_backup',
        message: verification.passed ? 'Backup created successfully' : 'Backup verification failed',
        details: status,
        status: verification.passed ? 'success' : 'failure'
      })

      return status
    } catch (error) {
      const status: BackupStatus = {
        timestamp: new Date().toISOString(),
        status: 'failure',
        backupSize: 0,
        entryCount: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      }

      await logsStore.addLog({
        level: 'error',
        category: 'backup',
        action: 'create_backup',
        message: 'Failed to create backup',
        error: error instanceof Error ? error.message : String(error),
        details: status,
        status: 'failure'
      })

      return status
    }
  }

  private static async verifyBackup(backupId: string, originalEntries: JournalEntry[]): Promise<{
    passed: boolean
    mismatches: number
    details: string[]
  }> {
    const details: string[] = []
    let mismatches = 0

    try {
      const backupData = await Storage.load(backupId)
      if (!backupData || !backupData.entries) {
        throw new Error('Invalid backup data')
      }

      // Verify entry count
      if (backupData.entries.length !== originalEntries.length) {
        details.push(`Entry count mismatch: ${backupData.entries.length} vs ${originalEntries.length}`)
        mismatches++
      }

      // Verify each entry
      originalEntries.forEach((entry, index) => {
        const backupEntry = backupData.entries[index]
        if (!backupEntry) {
          details.push(`Missing entry in backup: ${entry.id}`)
          mismatches++
          return
        }

        // Compare essential fields
        const fields: (keyof JournalEntry)[] = ['id', 'title', 'content', 'state', 'tags']
        fields.forEach(field => {
          if (JSON.stringify(entry[field]) !== JSON.stringify(backupEntry[field])) {
            details.push(`Mismatch in entry ${entry.id}, field: ${field}`)
            mismatches++
          }
        })
      })

      return {
        passed: mismatches === 0,
        mismatches,
        details
      }
    } catch (error) {
      return {
        passed: false,
        mismatches: -1,
        details: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  static startBackupMonitoring() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer)
    }

    this.backupTimer = setInterval(async () => {
      await this.createBackup()
    }, this.BACKUP_INTERVAL)

    // Create initial backup
    this.createBackup()
  }

  static stopBackupMonitoring() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer)
      this.backupTimer = null
    }
  }

  static async getBackupHistory(): Promise<BackupStatus[]> {
    const logsStore = useLogsStore()
    const backupLogs = logsStore.filteredLogs({
      category: ['backup']
    })

    return backupLogs.map(log => log.details as BackupStatus)
  }
} 