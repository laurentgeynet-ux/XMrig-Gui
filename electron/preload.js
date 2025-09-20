// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// FIX: Expose a secure API to the renderer process (React app).
contextBridge.exposeInMainWorld('electronAPI', {
  startMining: (config) => ipcRenderer.send('start-mining', config),
  stopMining: () => ipcRenderer.send('stop-mining'),
  onLog: (callback) => {
    const subscription = (event, log) => callback(log);
    ipcRenderer.on('mining-log', subscription);
    
    // Return an unsubscribe function to prevent memory leaks.
    return () => ipcRenderer.removeListener('mining-log', subscription);
  },
  onStatusUpdate: (callback) => {
    const subscription = (event, status) => callback(status);
    ipcRenderer.on('mining-status', subscription);
    return () => ipcRenderer.removeListener('mining-status', subscription);
  },
  getHardwareConcurrency: () => ipcRenderer.invoke('get-hardware-concurrency'),
  saveConfig: (configData) => ipcRenderer.invoke('save-config', configData),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  selectLogFile: () => ipcRenderer.invoke('select-log-file'),
  fetchPoolStats: (url) => ipcRenderer.invoke('fetch-pool-stats', url),
  saveAppConfig: (configData) => ipcRenderer.invoke('save-app-config', configData),
  loadAppConfig: () => ipcRenderer.invoke('load-app-config'),
});
