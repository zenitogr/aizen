import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import JournalView from '../views/JournalView.vue'
import MemoryVaultView from '../views/MemoryVaultView.vue'
import MindfulnessView from '../views/MindfulnessView.vue'
import RecentlyDeletedView from '../views/RecentlyDeletedView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'

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
    }
  ]
})

export default router 