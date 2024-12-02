<script setup lang="ts">
import { computed } from "vue";
import { onMounted } from "vue";
import { useRouter } from 'vue-router';
import { useUserStore } from './stores/user';
import { useAppStore } from './stores/app';
import { useJournalStore } from './stores/journal';
import { useLogsStore } from './stores/logs';
import BaseButton from './components/base/BaseButton.vue';
import BaseCard from './components/base/BaseCard.vue';
import ToastContainer from './components/base/ToastContainer.vue';
import BaseLoadingOverlay from './components/base/BaseLoadingOverlay.vue';
import BaseBadge from './components/base/BaseBadge.vue';

const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();
const journalStore = useJournalStore();
const logsStore = useLogsStore();

const mainNavItems = ['journal', 'memory-vault', 'mindfulness'];
const utilityNavItems = ['analytics', 'recently-deleted', 'logs'];

const recentlyDeletedCount = computed(() => journalStore.recentlyDeletedEntries.length);

onMounted(async () => {
  try {
    await logsStore.addLog({
      level: 'info',
      category: 'system',
      action: 'app_mount',
      message: 'App component mounted',
      status: 'pending'
    });

    if (!userStore.initialized) {
      await userStore.initialize();
    }
    if (!appStore.initialized) {
      await appStore.initialize();
    }

    await logsStore.addLog({
      level: 'info',
      category: 'system',
      action: 'app_mount',
      message: 'App initialization complete',
      status: 'success'
    });
  } catch (error) {
    await logsStore.addLog({
      level: 'error',
      category: 'system',
      action: 'app_mount',
      message: 'Failed to initialize app',
      error: error instanceof Error ? error.message : String(error),
      status: 'failure'
    });
  }
});

async function navigateTo(route: string) {
  try {
    await logsStore.addLog({
      level: 'info',
      category: 'user_action',
      action: 'navigation_click',
      message: `User clicked navigation item: ${route}`,
      details: { route },
      status: 'pending'
    });

    appStore.setCurrentView(route);
    await router.push(`/${route === 'home' ? '' : route}`);

    await logsStore.addLog({
      level: 'info',
      category: 'user_action',
      action: 'navigation_click',
      message: `Successfully navigated to: ${route}`,
      details: { route },
      status: 'success'
    });
  } catch (error) {
    await logsStore.addLog({
      level: 'error',
      category: 'user_action',
      action: 'navigation_click',
      message: `Failed to navigate to: ${route}`,
      error: error instanceof Error ? error.message : String(error),
      details: { route },
      status: 'failure'
    });
  }
}
</script>

<template>
  <div class="app-container dark" :data-theme="userStore.currentTheme">
    <header class="app-header">
      <div class="logo" @click="navigateTo('home')" role="button" tabindex="0">
        <span class="ai">Ai</span><span class="zen">ZEN</span>
      </div>
      <nav class="main-nav">
        <div class="nav-group">
          <BaseButton 
            v-for="view in mainNavItems" 
            :key="view"
            variant="ghost"
            :class="{ active: appStore.currentView === view }"
            @click="navigateTo(view)"
          >
            {{ view.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') }}
          </BaseButton>
        </div>
        <div class="nav-divider"></div>
        <div class="nav-group utility">
          <BaseButton 
            v-for="view in utilityNavItems" 
            :key="view"
            variant="ghost"
            size="sm"
            :class="{ active: appStore.currentView === view }"
            @click="navigateTo(view)"
          >
            <div class="button-with-badge">
              {{ view.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') }}
              <BaseBadge 
                v-if="view === 'recently-deleted'"
                :count="recentlyDeletedCount"
                variant="error"
              />
            </div>
          </BaseButton>
        </div>
      </nav>
    </header>

    <main class="main-content">
      <BaseCard 
        v-if="appStore.hasErrors" 
        class="error-banner"
        padding="sm"
      >
        <p v-for="error in appStore.errors" :key="error">{{ error }}</p>
        <BaseButton 
          variant="ghost" 
          size="sm"
          class="error-close"
          @click="appStore.clearErrors()"
        >
          ×
        </BaseButton>
      </BaseCard>

      <router-view v-slot="{ Component }">
        <transition 
          name="fade" 
          mode="out-in"
          @before-leave="appStore.setLoading(true)"
          @after-enter="appStore.setLoading(false)"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <ToastContainer />
    <BaseLoadingOverlay v-if="appStore.isLoading" />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-dark);
}

.app-header {
  background: var(--surface-dark);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
}

.logo:focus {
  outline: none;
  opacity: 0.8;
}

.logo .ai {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo .zen {
  color: var(--text-primary);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.nav-group {
  display: flex;
  gap: var(--spacing-sm);
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
}

.nav-group.utility {
  opacity: 0.8;
}

.nav-group.utility:hover {
  opacity: 1;
}

.nav-button {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.nav-button:hover {
  background: var(--surface-light);
  color: var(--text-primary);
  opacity: 1;
}

.main-content {
  flex: 1;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-card {
  max-width: 600px;
  width: 100%;
  margin-top: var(--spacing-xl);
}

.subtitle {
  color: var(--text-secondary);
  margin: var(--spacing-sm) 0 var(--spacing-lg);
}

.quick-actions {
  margin-top: var(--spacing-lg);
}

.greeting-form {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.greeting-message {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .main-nav {
    width: 100%;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .nav-group {
    width: 100%;
    justify-content: center;
  }

  .nav-divider {
    width: 100%;
    height: 1px;
    margin: var(--spacing-xs) 0;
  }

  .welcome-card {
    margin-top: var(--spacing-md);
  }

  .greeting-form {
    flex-direction: column;
  }

  .button-with-badge {
    justify-content: center;
  }
}

.error-banner {
  width: 100%;
  max-width: 600px;
  background: var(--status-error) !important;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  position: relative;
}

.error-close {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button.active {
  background: var(--surface-light);
  color: var(--text-primary);
  border-color: var(--primary-color);
}

/* Route Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Optional: Add slide transition for mobile */
@media (max-width: 768px) {
  .fade-enter-active {
    transition: all 0.2s ease-out;
  }
  
  .fade-leave-active {
    transition: all 0.2s ease-in;
  }
  
  .fade-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }
  
  .fade-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.button-with-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
</style>