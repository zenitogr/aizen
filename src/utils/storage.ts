import { readTextFile, writeTextFile, createDir } from '@tauri-apps/api/fs';
import { BaseDirectory } from '@tauri-apps/api/path';

export class Storage {
  private static readonly BASE_PATH = '.aizen';

  static async init() {
    try {
      await createDir(this.BASE_PATH, { 
        dir: BaseDirectory.App,
        recursive: true 
      });
    } catch (error) {
      console.error('Failed to initialize storage directory:', error);
    }
  }

  static async save(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await writeTextFile(
        `${this.BASE_PATH}/${key}.json`,
        jsonData,
        { dir: BaseDirectory.App }
      );
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  static async load(key: string): Promise<any> {
    try {
      const content = await readTextFile(
        `${this.BASE_PATH}/${key}.json`,
        { dir: BaseDirectory.App }
      );
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return null;
    }
  }
} 