import { PiniaPluginContext } from 'pinia'
import { Storage } from '../utils/storage'

export function persistencePlugin({ store }: PiniaPluginContext) {
  // Restore state from storage when store is initialized
  Storage.load(store.$id).then((savedState) => {
    if (savedState) {
      store.$patch(savedState)
    }
  })

  // Save state changes to storage
  store.$subscribe((mutation, state) => {
    Storage.save(store.$id, state)
  })
} 