import { createRouter, createWebHistory } from 'vue-router'
import { useLogsStore } from '../stores/logs'
import HomeView from '../views/HomeView.vue'
import JournalView from '../views/JournalView.vue'
import MemoryVaultView from '../views/MemoryVaultView.vue'
import MindfulnessView from '../views/MindfulnessView.vue'
import RecentlyDeletedView from '../views/RecentlyDeletedView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import LogsView from '../views/LogsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/journal',
      name: 'journal',
      component: JournalView
    },
    {
      path: '/memory-vault',
      name: 'memory-vault',
      component: MemoryVaultView
    },
    {
      path: '/mindfulness',
      name: 'mindfulness',
      component: MindfulnessView
    },
    {
      path: '/recently-deleted',
      name: 'recently-deleted',
      component: RecentlyDeletedView
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogsView
    }
  ]
})

// Add navigation guards for logging
router.beforeEach(async (to, from) => {
  const logsStore = useLogsStore()
  
  await logsStore.addLog({
    level: 'info',
    category: 'navigation',
    action: 'route_change',
    message: `Navigating from ${from.path} to ${to.path}`,
    details: {
      from: {
        path: from.path,
        name: from.name,
        params: from.params,
        query: from.query
      },
      to: {
        path: to.path,
        name: to.name,
        params: to.params,
        query: to.query
      }
    },
    status: 'pending'
  })

  return true
})

router.afterEach(async (to, from) => {
  const logsStore = useLogsStore()
  
  await logsStore.addLog({
    level: 'info',
    category: 'navigation',
    action: 'route_change',
    message: `Successfully navigated to ${to.path}`,
    details: {
      from: from.path,
      to: to.path
    },
    status: 'success'
  })
})

router.onError(async (error, to, from) => {
  const logsStore = useLogsStore()
  
  await logsStore.addLog({
    level: 'error',
    category: 'navigation',
    action: 'route_change',
    message: `Navigation error: ${error.message}`,
    error: error.message,
    details: {
      from: from?.path,
      to: to?.path,
      stack: error.stack
    },
    status: 'failure'
  })
})

export default router 