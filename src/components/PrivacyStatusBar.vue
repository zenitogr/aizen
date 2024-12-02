<template>
  <div class="privacy-status-bar">
    <!-- Main Privacy Status -->
    <div class="status-indicator" :class="{ 'offline': privacyStore.isFullyOffline }">
      <LockClosedIcon v-if="privacyStore.isFullyOffline" class="status-icon" />
      <ShieldCheckIcon v-else class="status-icon" />
      <span class="status-text">{{ privacyStore.privacyStatus }}</span>
    </div>

    <!-- Online Features Status -->
    <div v-if="!privacyStore.isFullyOffline" class="online-features">
      <div 
        v-for="(feature, name) in onlineFeatures" 
        :key="name"
        class="feature-status"
        :class="{ 'enabled': feature.enabled }"
        @click="showFeatureDetails(name, feature)"
      >
        <component 
          :is="getFeatureIcon(name as FeatureName)" 
          class="feature-icon"
        />
        <span class="feature-name">{{ formatFeatureName(name as string) }}</span>
        <Badge 
          :variant="feature.enabled ? 'default' : 'secondary'"
          class="feature-badge"
        >
          {{ feature.enabled ? 'Active' : 'Disabled' }}
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePrivacyStore } from '../stores/privacy'
import type { PrivacyFeature } from '../stores/privacy'
import Badge from '@/components/ui/badge/Badge.vue'
import {
  LockClosedIcon,
  ShieldCheckIcon,
  CloudIcon,
  SparklesIcon
} from '@heroicons/vue/24/solid'

const privacyStore = usePrivacyStore()

type FeatureName = 'groqAI' | 'cloudBackup'

const onlineFeatures = computed(() => privacyStore.onlineFeatures)

const getFeatureIcon = (featureName: FeatureName) => {
  const icons: Record<FeatureName, any> = {
    groqAI: SparklesIcon,
    cloudBackup: CloudIcon
  }
  return icons[featureName]
}

const formatFeatureName = (name: string) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

const showFeatureDetails = (_name: FeatureName, _feature: PrivacyFeature) => {
  // Implement feature details dialog
}
</script>

<style lang="postcss">
.privacy-status-bar {
  @apply fixed bottom-0 left-0 right-0 h-8 bg-background border-t flex items-center px-4;
}

.status-indicator {
  @apply flex items-center gap-2;
}

.status-indicator.offline {
  @apply text-green-500;
}

.status-icon {
  @apply w-4 h-4;
}

.online-features {
  @apply flex items-center gap-4 ml-4;
}

.feature-status {
  @apply flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-muted;
}

.feature-icon {
  @apply w-4 h-4;
}

.feature-badge {
  @apply ml-2;
}
</style> 