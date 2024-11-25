import { exists } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api/core';

export class Storage {
  private static readonly BASE_PATH = '.aizen';

  static async init() {
    try {
      await invoke('plugin:fs|create_dir', { 
        path: this.BASE_PATH,
        recursive: true 
      });
    } catch (error) {
      console.error('Failed to initialize storage directory:', error);
    }
  }

  static async save(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await invoke('plugin:fs|write_file', {
        path: `${this.BASE_PATH}/${key}.json`,
        contents: jsonData
      });
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  static async load(key: string): Promise<any> {
    try {
      const filePath = `${this.BASE_PATH}/${key}.json`;
      if (await exists(filePath)) {
        const content = await invoke('plugin:fs|read_text_file', {
          path: filePath
        }) as string;
        return JSON.parse(content);
      }
      return null;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return null;
    }
  }
} 