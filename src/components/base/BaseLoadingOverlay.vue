<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../stores/app';

const appStore = useAppStore();
const isVisible = computed(() => appStore.isLoading);
</script>

<template>
  <transition name="fade">
    <div v-if="isVisible" class="loading-overlay">
      <div class="loader"></div>
    </div>
  </transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid var(--text-primary);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 