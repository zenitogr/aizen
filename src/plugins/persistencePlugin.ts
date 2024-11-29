import { PiniaPluginContext } from 'pinia'
import { Storage } from '../utils/storage'
import { useLogsStore } from '../stores/logs'

export function persistencePlugin({ store }: PiniaPluginContext) {
  const logsStore = useLogsStore()
  const storageKey = `aizen-store-${store.$id}`
  
  const loadState = async () => {
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'storage',
        action: 'load_state',
        message: `Loading state for store: ${store.$id}`,
        status: 'pending'
      })

      const savedState = await Storage.load(storageKey)
      if (savedState) {
        store.$patch(savedState)
        await logsStore.addLog({
          level: 'info',
          category: 'storage',
          action: 'load_state',
          message: `State loaded for store: ${store.$id}`,
          details: { stateSize: JSON.stringify(savedState).length },
          status: 'success'
        })
      }
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'storage',
        action: 'load_state',
        message: `Failed to load state for store: ${store.$id}`,
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
    }
  }

  store.$subscribe(async (mutation, state) => {
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'storage',
        action: 'save_state',
        message: `Saving state for store: ${store.$id}`,
        details: {
          mutation: {
            type: mutation.type,
            storeId: mutation.storeId,
            events: mutation.events
          }
        },
        status: 'pending'
      })

      await Storage.save(storageKey, state)
      
      await logsStore.addLog({
        level: 'info',
        category: 'storage',
        action: 'save_state',
        message: `State saved for store: ${store.$id}`,
        details: { stateSize: JSON.stringify(state).length },
        status: 'success'
      })
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'storage',
        action: 'save_state',
        message: `Failed to save state for store: ${store.$id}`,
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
    }
  })

  loadState()

  return {
    async resetStorage() {
      try {
        await logsStore.addLog({
          level: 'info',
          category: 'storage',
          action: 'reset_storage',
          message: `Resetting storage for store: ${store.$id}`,
          status: 'pending'
        })

        await Storage.remove(storageKey)

        await logsStore.addLog({
          level: 'info',
          category: 'storage',
          action: 'reset_storage',
          message: `Storage reset for store: ${store.$id}`,
          status: 'success'
        })

        return true
      } catch (error) {
        await logsStore.addLog({
          level: 'error',
          category: 'storage',
          action: 'reset_storage',
          message: `Failed to reset storage for store: ${store.$id}`,
          error: error instanceof Error ? error.message : String(error),
          status: 'failure'
        })
        return false
      }
    },
    async reloadFromStorage() {
      return loadState()
    }
  }
} 