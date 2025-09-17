// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { spawn } = require('child_process');
const os = require('os');

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

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // It is recommended to disable nodeIntegration and enable contextIsolation for security.
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    title: "XMRig GUI Configurator",
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devtools in development
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
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
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// FIX: Added IPC Handlers for managing the xmrig mining process.
ipcMain.on('start-mining', (event, command) => {
    if (xmrigProcess) {
      console.log('Miner is already running.');
      return;
    }

    // Command parsing needs to be robust. Assuming 'xmrig' is the command.
    const args = command.substring(command.indexOf(' ') + 1).split(' ');
    const cmd = command.split(' ')[0];
    
    console.log(`Starting miner with command: ${cmd} ${args.join(' ')}`);
    // Note: This assumes 'xmrig' is in the system's PATH. For a distributable app,
    // you'd bundle the binary and reference its path.
    xmrigProcess = spawn(cmd, args);

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
        xmrigProcess = null;
    });

    xmrigProcess.on('error', (err) => {
        console.error('Failed to start xmrig process:', err);
        if(win && !win.isDestroyed()) {
          win.webContents.send('mining-log', `[SYSTEM] Failed to start miner: ${err.message}. Make sure xmrig is in your system PATH.`);
        }
        xmrigProcess = null;
    });
});

ipcMain.on('stop-mining', () => {
    if (xmrigProcess) {
        console.log('Stopping miner...');
        // SIGINT is the correct signal for graceful shutdown (Ctrl+C).
        xmrigProcess.kill('SIGINT');
        xmrigProcess = null;
    }
});

ipcMain.handle('get-hardware-concurrency', () => {
    return os.cpus().length;
});
