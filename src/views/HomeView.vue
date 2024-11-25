<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from "@tauri-apps/api/core";
import { useUserStore } from '../stores/user';
import { useAppStore } from '../stores/app';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseInput from '../components/base/BaseInput.vue';

const userStore = useUserStore();
const appStore = useAppStore();

const greetMsg = ref("");
const name = ref(userStore.name);
const inputError = ref("");

async function greet() {
  if (!name.value) {
    inputError.value = "Please enter your name";
    return;
  }
  
  try {
    appStore.setLoading(true);
    greetMsg.value = await invoke("greet", { name: name.value });
    userStore.setName(name.value);
    inputError.value = "";
  } catch (error) {
    appStore.addError(error as string);
  } finally {
    appStore.setLoading(false);
  }
}
</script>

<template>
  <BaseCard variant="elevated" class="welcome-card">
    <h1>Welcome {{ userStore.name ? `, ${userStore.name}` : 'to AiZEN' }}</h1>
    <p class="subtitle">Your personal space for growth and reflection</p>
    
    <div class="quick-actions">
      <form class="greeting-form" @submit.prevent="greet">
        <BaseInput
          v-model="name"
          placeholder="Enter your name..."
          :disabled="appStore.isLoading"
          :error="inputError"
        />
        <BaseButton 
          type="submit"
          :loading="appStore.isLoading"
        >
          {{ appStore.isLoading ? 'Loading...' : 'Greet' }}
        </BaseButton>
      </form>
      <p class="greeting-message">{{ greetMsg }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
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

@media (max-width: 768px) {
  .welcome-card {
    margin-top: var(--spacing-md);
  }

  .greeting-form {
    flex-direction: column;
  }
}
</style> 