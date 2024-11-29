import { Store } from '@tauri-apps/plugin-store'

const store = await Store.load('settings.json')

export const Storage = {
  async save<T>(key: string, value: T) {
    await store.set(key, value)
    await store.save()
  },

  async load<T>(key: string): Promise<T | null> {
    const value = await store.get(key) as T | undefined
    return value ?? null
  },

  async clear() {
    await store.clear()
    await store.save()
    console.log('Storage cleared')
  }
} 