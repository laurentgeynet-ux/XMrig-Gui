import type { XMRigConfig, MinerStatus } from './types';

// FIX: This declaration file defines the API exposed from the Electron preload script.
export interface IElectronAPI {
  startMining: (config: XMRigConfig) => void;
  stopMining: () => void;
  onLog: (callback: (log: string) => void) => () => void; // The function returns an unsubscribe function
  onStatusUpdate: (callback: (status: MinerStatus) => void) => () => void;
  getHardwareConcurrency: () => Promise<number>;
  saveConfig: (configData: string) => Promise<{ success: boolean; message: string }>;
  loadConfig: () => Promise<{ success: boolean; config?: XMRigConfig; message?: string }>;
  selectLogFile: () => Promise<string | null>;
  fetchPoolStats: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  saveAppConfig: (configData: XMRigConfig) => Promise<void>;
  loadAppConfig: () => Promise<XMRigConfig | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

// This export statement is needed to treat this file as a module.
export {};