import { useLogsStore } from '../stores/logs'
import type { JournalEntry } from '../stores/journal'
import { Storage } from '../utils/storage'

export interface IntegrityCheckResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  fixes: number
  checkedEntries: number
  timestamp: string
}

export class DataIntegrityService {
  private static readonly REQUIRED_FIELDS: (keyof JournalEntry)[] = [
    'id',
    'title',
    'content',
    'type',
    'createdAt',
    'updatedAt',
    'state',
    'tags'
  ]

  static async checkJournalEntries(): Promise<IntegrityCheckResult> {
    const logsStore = useLogsStore()
    const errors: string[] = []
    const warnings: string[] = []
    let fixes = 0
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'system',
        action: 'integrity_check',
        message: 'Starting journal entries integrity check',
        status: 'pending'
      })

      const entries = await Storage.load('journal-entries') || []
      let validEntries = 0

      // Check each entry
      const checkedEntries = entries.map((entry: JournalEntry) => {
        let isValid = true
        const entryErrors: string[] = []

        // Check required fields
        this.REQUIRED_FIELDS.forEach(field => {
          if (!(field in entry)) {
            isValid = false
            entryErrors.push(`Missing required field: ${field}`)
          }
        })

        // Check field types
        if (typeof entry.id !== 'string') {
          isValid = false
          entryErrors.push('Invalid ID type')
        }
        if (typeof entry.title !== 'string') {
          isValid = false
          entryErrors.push('Invalid title type')
        }
        if (typeof entry.content !== 'string') {
          isValid = false
          entryErrors.push('Invalid content type')
        }
        if (!Array.isArray(entry.tags)) {
          isValid = false
          entryErrors.push('Invalid tags type')
        }

        // Check dates
        interface DateFields {
          createdAt: string;
          updatedAt: string;
          deletedAt?: string;
        }

        const dateFields: Array<keyof DateFields> = ['createdAt', 'updatedAt', 'deletedAt'];
        dateFields.forEach(field => {
          if (field in entry && !this.isValidDate(entry[field] as string)) {
            isValid = false;
            entryErrors.push(`Invalid ${field} date`);
          }
        });

        // Check state validity
        const validStates = ['active', 'recently_deleted', 'hidden']
        if (!validStates.includes(entry.state)) {
          isValid = false
          entryErrors.push('Invalid state')
        }

        // Auto-fix attempts
        if (!isValid) {
          const fixed = this.attemptFix(entry)
          if (fixed.fixed) {
            fixes++
            warnings.push(`Fixed entry ${entry.id}: ${fixed.fixes.join(', ')}`)
          } else {
            errors.push(`Entry ${entry.id}: ${entryErrors.join(', ')}`)
          }
        } else {
          validEntries++
        }

        return isValid ? entry : null
      }).filter(Boolean)

      // Save fixed entries if any fixes were made
      if (fixes > 0) {
        await Storage.save('journal-entries', checkedEntries)
      }

      const result: IntegrityCheckResult = {
        passed: errors.length === 0,
        errors,
        warnings,
        fixes,
        checkedEntries: entries.length,
        timestamp: new Date().toISOString()
      }

      await logsStore.addLog({
        level: errors.length > 0 ? 'error' : 'info',
        category: 'system',
        action: 'integrity_check',
        message: 'Journal entries integrity check completed',
        details: result,
        status: errors.length > 0 ? 'failure' : 'success'
      })

      return result
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'system',
        action: 'integrity_check',
        message: 'Failed to perform integrity check',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  private static attemptFix(entry: any): { fixed: boolean; fixes: string[] } {
    const fixes: string[] = []

    // Fix ID
    if (!entry.id || typeof entry.id !== 'string') {
      entry.id = crypto.randomUUID()
      fixes.push('Generated new ID')
    }

    // Fix title
    if (!entry.title || typeof entry.title !== 'string') {
      entry.title = 'Untitled Entry'
      fixes.push('Set default title')
    }

    // Fix content
    if (!entry.content || typeof entry.content !== 'string') {
      entry.content = ''
      fixes.push('Set empty content')
    }

    // Fix tags
    if (!Array.isArray(entry.tags)) {
      entry.tags = []
      fixes.push('Reset tags array')
    }

    // Fix dates
    const now = new Date().toISOString()
    if (!this.isValidDate(entry.createdAt)) {
      entry.createdAt = now
      fixes.push('Fixed creation date')
    }
    if (!this.isValidDate(entry.updatedAt)) {
      entry.updatedAt = now
      fixes.push('Fixed update date')
    }

    // Fix state
    const validStates = ['active', 'recently_deleted', 'hidden']
    if (!validStates.includes(entry.state)) {
      entry.state = 'active'
      fixes.push('Reset to active state')
    }

    return {
      fixed: fixes.length > 0,
      fixes
    }
  }

  static async schedulePeriodicCheck(intervalHours: number = 24) {
    setInterval(async () => {
      try {
        await this.checkJournalEntries()
      } catch (error) {
        console.error('Scheduled integrity check failed:', error)
      }
    }, intervalHours * 60 * 60 * 1000)
  }
} 