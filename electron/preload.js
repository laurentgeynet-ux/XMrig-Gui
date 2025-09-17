// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// FIX: Expose a secure API to the renderer process (React app).
contextBridge.exposeInMainWorld('electronAPI', {
  startMining: (command) => ipcRenderer.send('start-mining', command),
  stopMining: () => ipcRenderer.send('stop-mining'),
  onLog: (callback) => {
    const subscription = (event, log) => callback(log);
    ipcRenderer.on('mining-log', subscription);
    
    // Return an unsubscribe function to prevent memory leaks.
    return () => ipcRenderer.removeListener('mining-log', subscription);
  },
  getHardwareConcurrency: () => ipcRenderer.invoke('get-hardware-concurrency'),
});
