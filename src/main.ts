import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import JournalView from './views/JournalView.vue'
import MemoryVaultView from './views/MemoryVaultView.vue'
import MindfulnessView from './views/MindfulnessView.vue'
import RecentlyDeletedView from './views/RecentlyDeletedView.vue'
import AnalyticsView from './views/AnalyticsView.vue'
import LogsView from './views/LogsView.vue'
import { initJournalStore } from './stores/journal'

// Import base styles
import './styles/base.css'

// Create router instance
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

// Create Vue app
const app = createApp(App)

// Create Pinia instance
const pinia = createPinia()

// Install plugins FIRST
app.use(pinia)  // Install Pinia before initializing stores
app.use(router)

// THEN initialize stores
initJournalStore().catch(error => {
  console.error('Failed to initialize journal store:', error)
})

// Add error handling
app.config.errorHandler = (err, _instance, info) => {
  console.error('Global error:', err);
  console.error('Error info:', info);
};

app.mount('#app')

console.log('Main.ts initialized')
