import { Router } from 'vue-router'
import { useLogsStore } from '../stores/logs'

export function createNavigationPlugin(router: Router) {
  const logsStore = useLogsStore()

  // Log route changes
  router.beforeEach(async (to, from) => {
    const fromPath = from.path;
    
    await logsStore.addLog({
      level: 'info',
      category: 'navigation',
      action: 'route_change',
      message: `Navigating from ${fromPath} to ${to.path}`,
      details: {
        from: {
          path: fromPath,
          name: from.name,
          params: from.params,
          query: from.query,
          hash: from.hash
        },
        to: {
          path: to.path,
          name: to.name,
          params: to.params,
          query: to.query,
          hash: to.hash
        }
      },
      status: 'pending'
    })

    return true
  })

  // Log successful navigation
  router.afterEach(async (to, from, failure) => {
    if (!failure) {
      await logsStore.addLog({
        level: 'info',
        category: 'navigation',
        action: 'route_change',
        message: `Successfully navigated to ${to.path}`,
        details: {
          from: from.path,
          to: to.path,
          duration: performance.now() // Add navigation timing
        },
        status: 'success'
      })
    }
  })

  // Log navigation errors
  router.onError(async (error, to, from) => {
    await logsStore.addLog({
      level: 'error',
      category: 'navigation',
      action: 'route_change',
      message: `Navigation error: ${error.message}`,
      error: error.message,
      details: {
        from: from?.path,
        to: to?.path,
        stack: error.stack,
        errorType: error.name,
        errorMessage: error.message
      },
      status: 'failure'
    })
  })

  // Log navigation cancellations
  router.beforeEach(async (to, from, next) => {
    const cancelled = false // You can implement your own cancellation logic
    if (cancelled) {
      await logsStore.addLog({
        level: 'warning',
        category: 'navigation',
        action: 'route_change',
        message: `Navigation cancelled from ${from.path} to ${to.path}`,
        details: {
          from: from.path,
          to: to.path,
          reason: 'User cancelled navigation'
        },
        status: 'failure'
      })
      next(false)
    } else {
      next()
    }
  })

  // Log navigation redirects
  router.beforeEach(async (to, from, next) => {
    if (to.redirectedFrom) {
      await logsStore.addLog({
        level: 'info',
        category: 'navigation',
        action: 'route_redirect',
        message: `Route redirected from ${to.redirectedFrom.path} to ${to.path}`,
        details: {
          from: to.redirectedFrom.path,
          to: to.path,
          reason: 'Route redirect'
        },
        status: 'success'
      })
    }
    next()
  })
} 