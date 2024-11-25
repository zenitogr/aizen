<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

const greetMsg = ref("");
const name = ref("");

async function greet() {
  greetMsg.value = await invoke("greet", { name: name.value });
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <span class="ai">Ai</span><span class="zen">ZEN</span>
      </div>
      <nav class="main-nav">
        <button class="nav-button">Journal</button>
        <button class="nav-button">Memory Vault</button>
        <button class="nav-button">Mindfulness</button>
      </nav>
    </header>

    <main class="main-content">
      <div class="welcome-card card">
        <h1>Welcome to AiZEN</h1>
        <p class="subtitle">Your personal space for growth and reflection</p>
        
        <div class="quick-actions">
          <form class="greeting-form" @submit.prevent="greet">
            <input 
              id="greet-input" 
              v-model="name" 
              placeholder="Enter your name..."
            />
            <button type="submit">Greet</button>
          </form>
          <p class="greeting-message">{{ greetMsg }}</p>
        </div>
      </div>
    </main>
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
  gap: var(--spacing-sm);
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
    justify-content: center;
  }

  .welcome-card {
    margin-top: var(--spacing-md);
  }

  .greeting-form {
    flex-direction: column;
  }
}
</style>