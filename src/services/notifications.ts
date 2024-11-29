import { useLogsStore } from '../stores/logs'

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  urgency?: 'low' | 'normal' | 'critical'
  category?: 'system' | 'backup' | 'error' | 'update' | 'reminder'
  actions?: Array<{
    text: string
    action: string
  }>
}

export class NotificationService {
  private static isInitialized = false
  private static permissionGranted = false

  static async initialize() {
    const logsStore = useLogsStore()
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'system',
        action: 'init_notifications',
        message: 'Initializing notification system',
        status: 'pending'
      })

      // Check if we already have permission for web notifications
      let permissionGranted = Notification.permission === 'granted'

      // Request permission if not granted
      if (!permissionGranted && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        permissionGranted = permission === 'granted'
      }

      this.permissionGranted = permissionGranted
      this.isInitialized = true

      await logsStore.addLog({
        level: 'info',
        category: 'system',
        action: 'init_notifications',
        message: 'Notification system initialized',
        details: { permissionGranted },
        status: 'success'
      })
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'system',
        action: 'init_notifications',
        message: 'Failed to initialize notification system',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error
    }
  }

  static async notify(options: NotificationOptions) {
    const logsStore = useLogsStore()
    
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      if (!this.permissionGranted) {
        throw new Error('Notification permission not granted')
      }

      await logsStore.addLog({
        level: 'info',
        category: 'system',
        action: 'send_notification',
        message: `Sending notification: ${options.title}`,
        details: options,
        status: 'pending'
      })

      // Create web notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        tag: options.category
      })

      // Handle notification clicks
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      await logsStore.addLog({
        level: 'info',
        category: 'system',
        action: 'send_notification',
        message: 'Notification sent successfully',
        details: options,
        status: 'success'
      })
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'system',
        action: 'send_notification',
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : String(error),
        details: options,
        status: 'failure'
      })
      throw error
    }
  }

  static async notifyBackupComplete(success: boolean, details?: string) {
    await this.notify({
      title: success ? 'Backup Complete' : 'Backup Failed',
      body: success ? 'Your data has been backed up successfully' : `Backup failed: ${details || 'Unknown error'}`,
      category: 'backup',
      urgency: success ? 'normal' : 'critical'
    })
  }

  static async notifySystemError(error: Error) {
    await this.notify({
      title: 'System Error',
      body: error.message,
      category: 'error',
      urgency: 'critical'
    })
  }

  static async notifyUpdate(version: string) {
    await this.notify({
      title: 'Update Available',
      body: `A new version (${version}) is available. Would you like to update now?`,
      category: 'update',
      actions: [
        { text: 'Update Now', action: 'update' },
        { text: 'Later', action: 'dismiss' }
      ]
    })
  }

  static async notifyJournalReminder() {
    await this.notify({
      title: 'Journal Reminder',
      body: "Don't forget to write in your journal today!",
      category: 'reminder',
      urgency: 'low'
    })
  }

  static async notifyDataIntegrityIssue(issues: string[]) {
    await this.notify({
      title: 'Data Integrity Check',
      body: `Found ${issues.length} issue(s) with your data. Please check the logs for details.`,
      category: 'system',
      urgency: 'critical'
    })
  }
} 