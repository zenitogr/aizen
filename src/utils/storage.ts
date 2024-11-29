import { Store } from '@tauri-apps/plugin-store'

const store = new Store('.settings.dat')

export const Storage = {
  async save(key: string, value: any) {
    await store.set(key, value)
    await store.save()
  },

  async load(key: string) {
    return await store.get(key)
  },

  async clear() {
    await store.clear()
    await store.save()
    console.log('Storage cleared')
  }
} 