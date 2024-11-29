import { 
  mkdir,
  writeTextFile, 
  readTextFile, 
  remove, 
  exists 
} from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/plugin-fs';
import type { 
  MkdirOptions, 
  WriteFileOptions, 
  ReadFileOptions, 
  RemoveOptions, 
  ExistsOptions 
} from '@tauri-apps/plugin-fs';
import { useLogsStore } from '../stores/logs'

export class Storage {
  static readonly BASE_PATH = 'data';
  static readonly BACKUP_PATH = 'backups';
  private static readonly MAX_BACKUPS = 5;
  private static logsStore: ReturnType<typeof useLogsStore> | null = null;

  static setLogsStore(store: ReturnType<typeof useLogsStore>) {
    this.logsStore = store;
  }

  static async init() {
    try {
      // First check if directories already exist
      const basePathExists = await exists(this.BASE_PATH, {
        baseDir: BaseDirectory.AppData
      } as ExistsOptions);

      const backupPathExists = await exists(this.BACKUP_PATH, {
        baseDir: BaseDirectory.AppData
      } as ExistsOptions);

      // Create directories if needed
      if (!basePathExists) {
        await mkdir(this.BASE_PATH, {
          baseDir: BaseDirectory.AppData,
          recursive: true
        } as MkdirOptions);
      }

      if (!backupPathExists) {
        await mkdir(this.BACKUP_PATH, {
          baseDir: BaseDirectory.AppData,
          recursive: true
        } as MkdirOptions);
      }

      // Add initialization check
      const initCheck = await exists(`${this.BASE_PATH}/.init`, {
        baseDir: BaseDirectory.AppData
      } as ExistsOptions);

      if (!initCheck) {
        await writeTextFile(
          `${this.BASE_PATH}/.init`,
          JSON.stringify({ initialized: true, timestamp: new Date().toISOString() }),
          { baseDir: BaseDirectory.AppData } as WriteFileOptions
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  private static async log(logData: any) {
    if (this.logsStore) {
      await this.logsStore.addLog(logData);
    }
  }

  static async save(key: string, data: any): Promise<void> {
    try {
      await this.log({
        level: 'info',
        category: 'storage',
        action: 'save',
        message: `Saving data for key: ${key}`,
        details: { key },
        status: 'pending'
      });

      const jsonData = JSON.stringify(data, null, 2)
      await writeTextFile(
        `${this.BASE_PATH}/${key}.json`,
        jsonData,
        { baseDir: BaseDirectory.AppData } as WriteFileOptions
      )

      await this.log({
        level: 'info',
        category: 'storage',
        action: 'save',
        message: `Successfully saved data for key: ${key}`,
        details: { key, dataSize: jsonData.length },
        status: 'success'
      });
    } catch (error) {
      await this.log({
        level: 'error',
        category: 'storage',
        action: 'save',
        message: `Failed to save data for key: ${key}`,
        error: error instanceof Error ? error.message : String(error),
        details: { key },
        status: 'failure'
      });
      throw error;
    }
  }

  static async load(key: string): Promise<any> {
    try {
      await this.log({
        level: 'info',
        category: 'storage',
        action: 'load',
        message: `Loading data for key: ${key}`,
        details: { key },
        status: 'pending'
      });

      const fileExists = await exists(`${this.BASE_PATH}/${key}.json`, {
        baseDir: BaseDirectory.AppData
      } as ExistsOptions)
      
      if (fileExists) {
        const content = await readTextFile(`${this.BASE_PATH}/${key}.json`, {
          baseDir: BaseDirectory.AppData
        } as ReadFileOptions)

        const data = JSON.parse(content)
        
        await this.log({
          level: 'info',
          category: 'storage',
          action: 'load',
          message: `Successfully loaded data for key: ${key}`,
          details: { key, dataSize: content.length },
          status: 'success'
        });

        return data
      }

      await this.log({
        level: 'warning',
        category: 'storage',
        action: 'load',
        message: `No data found for key: ${key}`,
        details: { key },
        status: 'success'
      });

      return null
    } catch (error) {
      await this.log({
        level: 'error',
        category: 'storage',
        action: 'load',
        message: `Failed to load data for key: ${key}`,
        error: error instanceof Error ? error.message : String(error),
        details: { key },
        status: 'failure'
      });
      return null
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await this.log({
        level: 'info',
        category: 'storage',
        action: 'remove',
        message: `Removing data for key: ${key}`,
        details: { key },
        status: 'pending'
      });

      await remove(
        `${this.BASE_PATH}/${key}.json`,
        { baseDir: BaseDirectory.AppData } as RemoveOptions
      )

      await this.log({
        level: 'info',
        category: 'storage',
        action: 'remove',
        message: `Successfully removed data for key: ${key}`,
        details: { key },
        status: 'success'
      });
    } catch (error) {
      await this.log({
        level: 'error',
        category: 'storage',
        action: 'remove',
        message: `Failed to remove data for key: ${key}`,
        error: error instanceof Error ? error.message : String(error),
        details: { key },
        status: 'failure'
      });
      throw error;
    }
  }

  static async logInitialization(logsStore: any) {
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'storage',
        action: 'initialize',
        message: 'Storage system initialized successfully',
        status: 'success'
      });
    } catch (error) {
      console.error('Failed to log storage initialization:', error);
    }
  }
} 