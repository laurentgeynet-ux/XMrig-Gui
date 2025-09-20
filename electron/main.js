// electron/main.js
const { app, BrowserWindow, ipcMain, dialog, Menu, net } = require('electron');
const path = require('node:path');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('node:fs');

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
let xmrigProcess = null;
let isStoppingGracefully = false;

const USER_DATA_PATH = app.getPath('userData');
const CONFIG_FILE_PATH = path.join(USER_DATA_PATH, 'config.json');

const sendStatus = (status) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send('mining-status', status);
  }
};

const generateArgs = (config) => {
  const args = [];
  if (config.algorithm) args.push(`--algo=${config.algorithm}`);
  if (config.coin) args.push(`--coin=${config.coin}`);
  if (config.poolUrl) args.push('-o', config.poolUrl);
  if (config.walletAddress) {
    let user = config.walletAddress;
    const worker = config.workerName?.trim();
    if (worker) {
      user += `.${worker}`;
    }
    args.push('-u', user);
  }
  if (config.password) args.push('-p', config.password);
  if (config.tls) args.push('--tls');
  if (config.threads && config.threads > 0) args.push('-t', String(config.threads));

  const logFile = config.logFile?.trim();
  if (logFile) {
    args.push('-l', logFile);
  }

  return args;
};

function startMiner(config) {
  if (xmrigProcess) {
    console.log('Miner is already running.');
    return;
  }

  const args = generateArgs(config);
  const cmd = 'xmrig';
  
  isStoppingGracefully = false;
  console.log(`Starting miner with command: ${cmd} ${args.join(' ')}`);
  
  try {
    xmrigProcess = spawn(cmd, args);
    sendStatus('mining');
  } catch(err) {
    console.error('Failed to start xmrig process:', err);
    if(win && !win.isDestroyed()) {
      win.webContents.send('mining-log', `[SYSTEM] Failed to start miner: ${err.message}. Make sure xmrig is in your system PATH.`);
    }
    sendStatus('error');
    xmrigProcess = null;
    return;
  }

  const sendLog = (data) => {
      const log = data.toString();
      if (win && !win.isDestroyed()) {
        win.webContents.send('mining-log', log);
      }
  };

  xmrigProcess.stdout.on('data', sendLog);
  xmrigProcess.stderr.on('data', sendLog);

  xmrigProcess.on('close', (code) => {
      console.log(`xmrig process exited with code ${code}`);
      if(win && !win.isDestroyed()) {
        win.webContents.send('mining-log', `[SYSTEM] Miner process stopped with code ${code}.`);
      }
      if (isStoppingGracefully) {
          sendStatus('stopped');
      } else if (code !== 0) {
          sendStatus('error');
      } else {
          sendStatus('stopped');
      }
      xmrigProcess = null;
  });

  xmrigProcess.on('error', (err) => {
      console.error('Failed to start xmrig process:', err);
      if(win && !win.isDestroyed()) {
        win.webContents.send('mining-log', `[SYSTEM] Failed to start miner: ${err.message}. Make sure xmrig is in your system PATH.`);
      }
      sendStatus('error');
      xmrigProcess = null;
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    title: "XMRig GUI Configurator by Loulach",
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  win.webContents.on('context-menu', (event, params) => {
    const { x, y } = params;
    Menu.buildFromTemplate([
      { label: 'Cut', role: 'cut', enabled: params.editFlags.canCut },
      { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
      { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { label: 'Select All', role: 'selectAll', enabled: params.editFlags.canSelectAll },
    ]).popup({ window: win, x, y });
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (xmrigProcess) {
    xmrigProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();

  // Auto-start logic
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const config = JSON.parse(fileContent);
      if (config && config.autoStart) {
        console.log('Auto-starting miner based on saved configuration...');
        startMiner(config);
      }
    }
  } catch(error) {
    console.error('Error during auto-start procedure:', error);
  }
});

ipcMain.on('start-mining', (event, config) => {
    startMiner(config);
});

ipcMain.on('stop-mining', () => {
    if (xmrigProcess) {
        console.log('Stopping miner...');
        isStoppingGracefully = true;
        xmrigProcess.kill('SIGINT');
    }
});

// Handle fetching pool stats from the main process to avoid CORS issues
ipcMain.handle('fetch-pool-stats', async (event, requestUrl) => {
  return new Promise((resolve) => {
    const request = net.request({
      url: requestUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    let body = '';
    
    request.on('response', (response) => {
      const contentType = response.headers['content-type'];

      if (response.statusCode < 200 || response.statusCode >= 300) {
        resolve({ success: false, error: `API returned status ${response.statusCode}` });
        return;
      }
      
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      response.on('end', () => {
        if (!body.trim()) {
            console.error(`Received empty body from ${requestUrl}. Content-Type: ${contentType}.`);
            resolve({ success: false, error: 'Empty response from API' });
            return;
        }
        try {
          const data = JSON.parse(body);
          resolve({ success: true, data });
        } catch (error) {
          console.error(`Failed to parse pool stats JSON from ${requestUrl}. Content-Type: ${contentType}. Body: ${body.substring(0, 200)}...`);
          resolve({ success: false, error: 'Failed to parse JSON response' });
        }
      });
    });
    
    request.on('error', (error) => {
      console.error(`Failed to fetch pool stats from ${requestUrl}:`, error);
      resolve({ success: false, error: 'API request failed' });
    });
    
    request.end();
  });
});

// Handle saving configuration to a user-selected file
ipcMain.handle('save-config', async (event, configData) => {
  if (!win) return { success: false, message: 'Main window not available.' };
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save XMRig Configuration',
    defaultPath: 'xmrig-config.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (canceled || !filePath) {
    return { success: false, message: 'Save canceled.' };
  }

  try {
    fs.writeFileSync(filePath, configData);
    return { success: true, message: 'Configuration saved.' };
  } catch (error) {
    console.error('Failed to save config:', error);
    return { success: false, message: `Error saving file: ${error.message}` };
  }
});

// Handle loading configuration from a user-selected file
ipcMain.handle('load-config', async () => {
  if (!win) return { success: false, message: 'Main window not available.' };
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Load XMRig Configuration',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, message: 'Load canceled.' };
  }

  try {
    const filePath = filePaths[0];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(fileContent);
    return { success: true, config };
  } catch (error) {
    console.error('Failed to load config:', error);
    return { success: false, message: `Failed to parse file: ${error.message}` };
  }
});

// Handle selecting a log file path
ipcMain.handle('select-log-file', async () => {
  if (!win) return null;
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Select Log File Location',
    defaultPath: 'xmrig.log',
    filters: [{ name: 'Log Files', extensions: ['log'] }, { name: 'All Files', extensions: ['*'] }],
  });

  if (canceled || !filePath) {
    return null;
  }
  return filePath;
});

ipcMain.handle('get-hardware-concurrency', () => {
    return os.cpus().length;
});

// Handle saving app configuration automatically
ipcMain.handle('save-app-config', async (event, configData) => {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configData, null, 2));
  } catch (error) {
    console.error('Failed to save app config:', error);
  }
});

// Handle loading app configuration automatically
ipcMain.handle('load-app-config', async () => {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Failed to load app config:', error);
    // If file is corrupt, it's safer to return null and let the app use defaults
  }
  return null;
});