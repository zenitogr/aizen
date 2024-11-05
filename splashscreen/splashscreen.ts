import { invoke } from "@tauri-apps/api/core";

// Utility function to implement a sleep function
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Setup function
async function setup() {
  // Fake perform some really heavy setup task
  console.log('Performing really heavy frontend setup task...')
  await sleep(3);
  console.log('Frontend setup task complete!')
  // Set the frontend task as being completed
  await invoke('set_complete', {task: 'frontend'})
}

// Start setup when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  setup()
}); 