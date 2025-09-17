// FIX: This declaration file defines the API exposed from the Electron preload script.
export interface IElectronAPI {
  startMining: (command: string) => void;
  stopMining: () => void;
  onLog: (callback: (log: string) => void) => () => void; // The function returns an unsubscribe function
  getHardwareConcurrency: () => Promise<number>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

// This export statement is needed to treat this file as a module.
export {};
