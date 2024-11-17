import { invoke } from "@tauri-apps/api/core";
import { relaunch } from '@tauri-apps/plugin-process';

// Utility function to implement a sleep function
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Setup function
async function setup() {
  console.log('Performing really heavy frontend setup task...')
  await sleep(3);
  console.log('Frontend setup task complete!')
  await invoke('set_complete', {task: 'frontend'})
}

// Handle relaunch
async function handleRelaunch() {
  try {
    // Relaunch the application
    await relaunch();
  } catch (error) {
    console.error('Failed to relaunch:', error);
  }
}

// Start setup when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  setup();
  
  // Add relaunch button listener
  const relaunchBtn = document.getElementById('relaunchBtn');
  if (relaunchBtn) {
    relaunchBtn.addEventListener('click', handleRelaunch);
  }
}); 