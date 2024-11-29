import { useLogsStore } from '../stores/logs'

export interface InteractionDetails {
  component: string
  action: string
  target?: string
  value?: any
  metadata?: Record<string, any>
}

export class UserInteractionService {
  static async logInteraction(details: InteractionDetails) {
    const logsStore = useLogsStore()
    
    await logsStore.addLog({
      level: 'info',
      category: 'user_action',
      action: details.action,
      message: `User interaction in ${details.component}: ${details.action}`,
      details: {
        component: details.component,
        target: details.target,
        value: details.value,
        ...details.metadata
      },
      status: 'success'
    })
  }

  static async logError(error: Error, details: InteractionDetails) {
    const logsStore = useLogsStore()
    
    await logsStore.addLog({
      level: 'error',
      category: 'user_action',
      action: details.action,
      message: `Error during user interaction in ${details.component}`,
      error: error.message,
      details: {
        component: details.component,
        target: details.target,
        value: details.value,
        errorStack: error.stack,
        ...details.metadata
      },
      status: 'failure'
    })
  }

  static async logPerformance(details: InteractionDetails & { duration: number }) {
    const logsStore = useLogsStore()
    
    await logsStore.addLog({
      level: 'info',
      category: 'performance',
      action: details.action,
      message: `Performance measurement for ${details.action} in ${details.component}`,
      details: {
        component: details.component,
        duration: details.duration,
        ...details.metadata
      },
      status: 'success'
    })
  }
} 